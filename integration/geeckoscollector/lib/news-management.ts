import {randomUUID} from "node:crypto";
import {eq,desc,and,isNull,sql,inArray} from "drizzle-orm";
import {db} from "./db";
import {newsArticles,newsVersions,newsMedia} from "./news-schema";
import {adminAudit} from "./admin-schema";
import {AdminError,lockAdminAccess,type AdminTransaction} from "./admin-authorisation";
import {blankNews,validNews,newsUuid,newsMediaIds,parisSchedule,type NewsContent} from "./news-types";
type Actor={id:string;username?:string|null;name:string};
const effective=sql<NewsContent>`CASE WHEN scheduled_at <= now() AND scheduled IS NOT NULL THEN scheduled ELSE published END`;
const visible=sql`archived_at IS NULL AND (published IS NOT NULL OR (scheduled_at <= now() AND scheduled IS NOT NULL))`;
export async function publicNews(limit=24,offset=0){return db.select({id:newsArticles.id,slug:newsArticles.slug,content:effective,date:sql<Date>`CASE WHEN scheduled_at <= now() AND scheduled IS NOT NULL THEN scheduled_at ELSE published_at END`}).from(newsArticles).where(visible).orderBy(sql`CASE WHEN scheduled_at <= now() AND scheduled IS NOT NULL THEN scheduled_at ELSE published_at END DESC`).limit(Math.min(50,limit)).offset(offset);}
export async function publicNewsArticle(slug:string){return (await db.select({slug:newsArticles.slug,content:effective,date:sql<Date>`CASE WHEN scheduled_at <= now() AND scheduled IS NOT NULL THEN scheduled_at ELSE published_at END`}).from(newsArticles).where(and(visible,eq(newsArticles.slug,slug))).limit(1))[0];}
export async function publicNewsMedia(id:string){return (await db.select({id:newsArticles.id}).from(newsArticles).where(and(visible,sql`(${effective})::text LIKE ${"%"+id+"%"}`)).limit(1)).length>0;}
export async function listNews(archived=false){return db.select().from(newsArticles).where(archived?sql`archived_at IS NOT NULL`:isNull(newsArticles.archivedAt)).orderBy(desc(newsArticles.updatedAt)).limit(100);}
export async function listNewsVersions(id:string){if(!newsUuid(id))throw new AdminError("Article invalide.",400);return db.select().from(newsVersions).where(eq(newsVersions.articleId,id)).orderBy(desc(newsVersions.revision)).limit(100);}
export async function listNewsMedia(){return db.select({id:newsMedia.id,name:newsMedia.name,alt:newsMedia.alt,width:newsMedia.width,height:newsMedia.height}).from(newsMedia).orderBy(desc(newsMedia.createdAt)).limit(300);}
async function checkMedia(tx:AdminTransaction,v:NewsContent,publishing=false){
 const ids=newsMediaIds(v);if(ids.length&&(await tx.select({id:newsMedia.id}).from(newsMedia).where(inArray(newsMedia.id,ids))).length!==ids.length)throw new AdminError("Une image n’existe plus dans la bibliothèque.",400);
 if(publishing&&(v.title.trim().length<3||!v.summary.trim()||!v.blocks.length||v.blocks.some(b=>b.type==="image"?(!b.mediaId||!b.alt?.trim()):(!b.text.trim()||(b.type==="link"&&!b.href)))||(v.coverId&&!v.coverAlt.trim())))throw new AdminError("Complète le titre (3 caractères), le résumé, les blocs et les descriptions alternatives des images avant publication.",400);
}
export async function mutateNews(actor:Actor,body:Record<string,unknown>){
 const kind=body.kind;
 const permission=kind==="create"?"news.create":kind==="trash"||kind==="untrash"?"news.delete":["publish","schedule","unpublish","cancelSchedule"].includes(String(kind))?"news.publish":"news.edit";
 if(!["create","save","publish","schedule","unpublish","cancelSchedule","trash","untrash","restore"].includes(String(kind)))throw new AdminError("Action invalide.",400);
 return db.transaction(async tx=>{
  await lockAdminAccess(tx,actor.id,permission);
  let old:typeof newsArticles.$inferSelect|undefined;
  if(kind!=="create"){
   if(!newsUuid(body.id)||!Number.isSafeInteger(body.revision))throw new AdminError("Article ou révision invalide.",400);
   [old]=await tx.select().from(newsArticles).where(eq(newsArticles.id,body.id)).limit(1);
   if(!old)throw new AdminError("Article introuvable.",404);
   if(old.revision!==body.revision)throw new AdminError("Cet article a changé. Recharge avant de continuer.",409);
   if(old.archivedAt&&kind!=="untrash")throw new AdminError("Restaure d’abord l’article depuis la corbeille.",409);
   if(!old.archivedAt&&kind==="untrash")throw new AdminError("Cet article n’est pas dans la corbeille.",409);
  }
  let content=old?.draft??blankNews;
  if(kind==="create"||kind==="save"){if(!validNews(body.content)||JSON.stringify(body.content).length>28000)throw new AdminError("Article invalide ou trop volumineux.",400);content=body.content;await checkMedia(tx,content);}
  if(kind==="restore"){
   if(!newsUuid(body.versionId))throw new AdminError("Version invalide.",400);
   const [version]=await tx.select().from(newsVersions).where(and(eq(newsVersions.id,body.versionId),eq(newsVersions.articleId,old!.id))).limit(1);
   if(!version)throw new AdminError("Version introuvable.",404);content=version.content;await checkMedia(tx,content);
  }
  if(kind==="publish"||kind==="schedule")await checkMedia(tx,content,true);
  const id=old?.id??randomUUID(),revision=(old?.revision??0)+1,now=new Date();
  const update:Partial<typeof newsArticles.$inferInsert>={draft:content,revision,updatedBy:actor.id,updatedAt:now};
  if(kind==="publish"){update.published=content;update.publishedAt=now;update.scheduled=null;update.scheduledAt=null;}
  if(kind==="schedule"){
   let date:Date;try{date=parisSchedule(String(body.date));}catch(e){throw new AdminError((e as Error).message,400);}
   if(date.getTime()<=Date.now()+60000)throw new AdminError("Choisis une publication au moins une minute dans le futur.",400);
   update.scheduled=content;update.scheduledAt=date;
  }
  if(kind==="unpublish"||kind==="trash"||kind==="untrash"){update.published=null;update.publishedAt=null;update.scheduled=null;update.scheduledAt=null;}
  if(kind==="cancelSchedule"){if(old?.scheduledAt&&old.scheduledAt.getTime()<=Date.now())throw new AdminError("Cette programmation est déjà publiée. Utilise Dépublier pour la retirer.",409);update.scheduled=null;update.scheduledAt=null;}
  if(kind==="trash")update.archivedAt=now;if(kind==="untrash")update.archivedAt=null;
  if(old)await tx.update(newsArticles).set(update).where(eq(newsArticles.id,id));
  else{
   const stem=content.title.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80)||"actualite";
   await tx.insert(newsArticles).values({id,slug:stem+"-"+id.slice(0,8),draft:content,revision,createdBy:actor.id,updatedBy:actor.id});
  }
  await tx.insert(newsVersions).values({id:randomUUID(),articleId:id,revision,content,action:String(kind),actorId:actor.id,actorName:actor.username??actor.name});
  await tx.insert(adminAudit).values({actorId:actor.id,actorName:actor.username??actor.name,action:"news."+kind,targetName:content.title||"Brouillon",before:old?{revision:old.revision,published:!!old.published,scheduledAt:old.scheduledAt,archived:!!old.archivedAt}:null,after:{revision,published:update.published!==undefined?!!update.published:!!old?.published,scheduledAt:update.scheduledAt!==undefined?update.scheduledAt:old?.scheduledAt,archived:kind==="trash"?true:kind==="untrash"?false:!!old?.archivedAt}});
  return (await tx.select().from(newsArticles).where(eq(newsArticles.id,id)).limit(1))[0];
 });
}
