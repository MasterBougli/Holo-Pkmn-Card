import { asc,eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { gameSets,cardAvailability } from "@/lib/catalogue-schema";
import { getCatalogueSetData } from "@/lib/catalogue";
import { adminAudit } from "@/lib/admin-schema";
import { AdminError,lockAdminAccess } from "@/lib/admin-access";

type Actor={id:string;username?:string|null;name:string};
export type AdminSetView={code:string;name:string;seriesName:string;active:boolean;revision:number;totalCardCount:number};
export type AdminCardView={id:string;name:string;localId:string;rarity:string;excluded:boolean;revision:number};
export async function listCatalogueSets():Promise<AdminSetView[]>{
 return db.select({code:gameSets.code,name:gameSets.name,seriesName:gameSets.seriesName,active:gameSets.active,revision:gameSets.revision,totalCardCount:gameSets.totalCardCount}).from(gameSets).orderBy(asc(gameSets.name));
}
export async function getCatalogueAvailability(code:string){
 const manifest=getCatalogueSetData(code);
 if(!manifest)throw new AdminError("Set introuvable.",404);
 // Read set and exceptions in the same snapshot to avoid mixed availability.
 return db.transaction(async tx=>{
  const [set]=await tx.select().from(gameSets).where(eq(gameSets.code,manifest.code)).limit(1);
  if(!set)throw new AdminError("Set indisponible en base.",404);
  const exceptions=await tx.select().from(cardAvailability).where(eq(cardAvailability.setCode,set.code));
  const byId=new Map(exceptions.map(row=>[row.cardId,row]));
  return {set:{code:set.code,name:set.name,seriesName:set.seriesName,active:set.active,revision:set.revision,totalCardCount:set.totalCardCount},
   cards:manifest.cards.map(card=>({...card,excluded:byId.get(card.id)?.excluded??false,revision:byId.get(card.id)?.revision??0}))};
 },{isolationLevel:"repeatable read"});
}
export async function updateCatalogueAvailability(actor:Actor,body:Record<string,unknown>){
 const {kind,code,cardId,revision}=body;
 if((kind!=="set"&&kind!=="card")||typeof code!=="string"||!Number.isSafeInteger(revision)||Number(revision)<0)
  throw new AdminError("Réglage invalide.",400);
 const manifest=getCatalogueSetData(code);
 if(!manifest)throw new AdminError("Set introuvable.",404);
 const card=kind==="card"?manifest.cards.find(item=>item.id===cardId):undefined;
 if(kind==="card"&&!card)throw new AdminError("Carte introuvable dans ce set.",404);
 if(kind==="set"?typeof body.active!=="boolean":typeof body.excluded!=="boolean")
  throw new AdminError("Statut invalide.",400);
 return db.transaction(async tx=>{
  await lockAdminAccess(tx,actor.id,kind==="set"?"catalogue.activate":"catalogue.edit");
  const [set]=await tx.select().from(gameSets).where(eq(gameSets.code,manifest.code)).limit(1);
  if(!set)throw new AdminError("Set indisponible en base.",404);
  if(kind==="set"){
   if(set.revision!==revision)throw new AdminError("Ce set a changé. Recharge les données.",409);
   if(set.active===body.active)return {kind,code:set.code,active:set.active,revision:set.revision};
   const [saved]=await tx.update(gameSets).set({active:body.active as boolean,revision:set.revision+1,updatedAt:new Date()}).where(eq(gameSets.code,set.code)).returning();
   await tx.insert(adminAudit).values({actorId:actor.id,actorName:actor.username??actor.name,action:"catalogue.set",targetName:set.name+" · "+set.code,before:{availability:{kind:"set",active:set.active}},after:{availability:{kind:"set",active:saved.active}}});
   return {kind,code:saved.code,active:saved.active,revision:saved.revision};
  }
  const [previous]=await tx.select().from(cardAvailability).where(eq(cardAvailability.cardId,card!.id)).limit(1);
  if((previous?.revision??0)!==revision)throw new AdminError("Cette carte a changé. Recharge les données.",409);
  const excluded=body.excluded as boolean;
  if((previous?.excluded??false)===excluded)return {kind,cardId:card!.id,excluded,revision:previous?.revision??0};
  const value={cardId:card!.id,setCode:set.code,excluded,revision:(previous?.revision??0)+1,updatedAt:new Date()};
  await tx.insert(cardAvailability).values(value).onConflictDoUpdate({target:cardAvailability.cardId,set:value});
  await tx.insert(adminAudit).values({actorId:actor.id,actorName:actor.username??actor.name,action:"catalogue.card",targetName:card!.name+" · "+set.code+" n°"+card!.localId,before:{availability:{kind:"card",excluded:previous?.excluded??false}},after:{availability:{kind:"card",excluded}}});
  return {kind,cardId:card!.id,excluded,revision:value.revision};
 });
}
