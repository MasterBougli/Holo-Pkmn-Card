import {randomUUID} from "node:crypto";
import {eq,desc,and,isNull,isNotNull} from "drizzle-orm";
import {db} from "./db";
import {gameEvents} from "./event-schema";
import {adminAudit} from "./admin-schema";
import {AdminError,lockAdminAccess,type AdminTransaction} from "./admin-authorisation";
import {getCatalogueSetData} from "./catalogue";
import {newsUuid} from "./news-types";
import {validEvent,eventDates,eventPublicationIssues,type EventContent} from "./event-types";
export async function listEvents(archived=false){return db.select().from(gameEvents).where(archived?isNotNull(gameEvents.archivedAt):isNull(gameEvents.archivedAt)).orderBy(desc(gameEvents.updatedAt)).limit(100);}
export async function publicEvents(limit=12,offset=0){return db.select({id:gameEvents.id,content:gameEvents.published,start:gameEvents.startsAt,end:gameEvents.endsAt}).from(gameEvents).where(and(isNull(gameEvents.archivedAt),isNotNull(gameEvents.published))).orderBy(desc(gameEvents.startsAt)).limit(Math.min(limit,50)).offset(offset);}
export async function publicEvent(id:string){if(!newsUuid(id))return;return (await db.select({id:gameEvents.id,content:gameEvents.published,start:gameEvents.startsAt,end:gameEvents.endsAt}).from(gameEvents).where(and(eq(gameEvents.id,id),isNull(gameEvents.archivedAt),isNotNull(gameEvents.published))).limit(1))[0];}
async function references(tx:AdminTransaction,e:EventContent){
 const refs=[...e.objectives,...e.objectives.flatMap(o=>o.rewards),...e.rewards];
 const cached=new Map<string,Awaited<ReturnType<typeof getCatalogueSetData>>>();
 for(const r of refs){if(!r.setCode)continue;if(!cached.has(r.setCode))cached.set(r.setCode,await getCatalogueSetData(r.setCode,tx));const set=cached.get(r.setCode);if(!set)throw new AdminError("Ce set n’existe pas au catalogue.",400);if(r.kind==="card"&&!set.cards.some(c=>c.id===r.cardId))throw new AdminError("Cette carte ne fait pas partie du set sélectionné.",400);}
}
export async function mutateEvent(actor:{id:string;name:string;username?:string|null},body:Record<string,unknown>){
 const kind=String(body.kind);if(!["create","save","publish","unpublish","archive","restore"].includes(kind))throw new AdminError("Action invalide.",400);
 const permission=kind==="create"?"events.create":["publish","unpublish"].includes(kind)?"events.publish":["archive","restore"].includes(kind)?"events.delete":"events.edit";
 return db.transaction(async tx=>{
  await lockAdminAccess(tx,actor.id,permission);
  let old:typeof gameEvents.$inferSelect|undefined;
  if(kind!=="create"){if(!newsUuid(body.id)||!Number.isSafeInteger(body.revision))throw new AdminError("Événement ou révision invalide.",400);[old]=await tx.select().from(gameEvents).where(eq(gameEvents.id,body.id)).limit(1);if(!old)throw new AdminError("Événement introuvable.",404);if(old.revision!==body.revision)throw new AdminError("Cet événement a changé. Recharge la liste.",409);if(old.archivedAt&&kind!=="restore"||!old.archivedAt&&kind==="restore")throw new AdminError("État d’archivage incompatible.",409);}
  let content=old?.draft;
  if(kind==="create"||kind==="save"){if(!validEvent(body.content)||JSON.stringify(body.content).length>28000)throw new AdminError("Événement invalide ou trop volumineux. Vérifie aussi les cartes et quantités.",400);content=body.content;await references(tx,content);}
  if(!content)throw new AdminError("Contenu manquant.",400);
  const id=old?.id??randomUUID(),revision=(old?.revision??0)+1;
  const update:Partial<typeof gameEvents.$inferInsert>={draft:content,revision,updatedBy:actor.id,updatedAt:new Date()};
  if(kind==="publish"){const issues=eventPublicationIssues(content);if(issues.length)throw new AdminError(issues.join(" "),400);const dates=eventDates(content);update.published=content;update.startsAt=dates.start;update.endsAt=dates.end;}
  if(["unpublish","archive","restore"].includes(kind)){update.published=null;update.startsAt=null;update.endsAt=null;}
  if(kind==="archive")update.archivedAt=new Date();if(kind==="restore")update.archivedAt=null;
  if(old)await tx.update(gameEvents).set(update).where(eq(gameEvents.id,id));else await tx.insert(gameEvents).values({id,draft:content,createdBy:actor.id,updatedBy:actor.id});
  await tx.insert(adminAudit).values({actorId:actor.id,actorName:actor.username??actor.name,action:"events."+kind,targetName:content.title||"Brouillon d’événement",before:old?{revision:old.revision,published:!!old.published,archived:!!old.archivedAt}:null,after:{revision,published:update.published!==undefined?!!update.published:!!old?.published,archived:kind==="archive"?true:kind==="restore"?false:!!old?.archivedAt}});
  return (await tx.select().from(gameEvents).where(eq(gameEvents.id,id)).limit(1))[0];
 });
}
