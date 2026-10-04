import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { catalogueCards,gameSets } from "@/lib/catalogue-schema";
import { adminAudit } from "@/lib/admin-schema";
import { AdminError,lockAdminAccess } from "@/lib/admin-access";
import { getSetCompleteness } from "@/lib/catalogue-completeness";
import { validMetadata,type CardMetadataFields } from "@/lib/card-metadata";
type Actor={id:string;username?:string|null;name:string};
function fields(v:CardMetadataFields):CardMetadataFields{return {name:v.name.trim(),localId:v.localId.trim(),rarity:v.rarity.trim(),illustrator:v.illustrator.trim(),finishes:[...v.finishes].sort()};}
export async function saveCardMetadata(actor:Actor,body:Record<string,unknown>){
 const revision=body.revision,code=body.setCode,id=body.id;
 if(typeof code!=="string"||typeof id!=="string"||!Number.isSafeInteger(revision)||Number(revision)<0||!validMetadata(body))throw new AdminError("Fiche invalide : textes de 160 caractères maximum et une seule finition connue.",400);
 const next=fields(body);
 await db.transaction(async tx=>{
  await lockAdminAccess(tx,actor.id,"catalogue.edit");
  const report=await getSetCompleteness(code,tx),previous=report?.cards.find(card=>card.id===id);
  if(!report||!previous)throw new AdminError("Carte introuvable.",404);
  if(previous.revision!==revision)throw new AdminError("La fiche a changé. Recharge avant de continuer.",409);
  if(JSON.stringify(fields(previous))===JSON.stringify(next))return;
  const value={...next,setCode:report.set.code,id,source:"manual",revision:previous.revision+1,updatedBy:actor.id,updatedAt:new Date()};
  await tx.insert(catalogueCards).values(value).onConflictDoUpdate({target:catalogueCards.id,set:value});
  await tx.insert(adminAudit).values({actorId:actor.id,actorName:actor.username??actor.name,action:"catalogue.metadata",targetName:next.name+" · "+report.set.code+" n°"+next.localId,before:{cardMetadata:fields(previous)},after:{cardMetadata:next}});
  // Any incomplete card blocks the entire set, including individually excluded cards.
  const fresh=await getSetCompleteness(report.set.code,tx);
  const [set]=await tx.select().from(gameSets).where(eq(gameSets.code,report.set.code)).limit(1);
  if(set?.active&&!fresh?.complete){
   await tx.update(gameSets).set({active:false,revision:set.revision+1,updatedAt:new Date()}).where(eq(gameSets.code,set.code));
   await tx.insert(adminAudit).values({actorId:actor.id,actorName:actor.username??actor.name,action:"catalogue.set",targetName:set.name+" · "+set.code,before:{availability:{kind:"set",active:true}},after:{availability:{kind:"set",active:false},reason:"Fiche de carte incomplète"}});
  }
 });
 const report=await getSetCompleteness(code);return report?.cards.find(card=>card.id===id)??null;
}
