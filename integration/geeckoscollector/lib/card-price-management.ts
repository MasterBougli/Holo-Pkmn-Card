import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { cardPriceRules } from "@/lib/card-price-schema";
import { adminAudit } from "@/lib/admin-schema";
import { AdminError,lockAdminAccess } from "@/lib/admin-authorisation";
import { getCatalogueSets,getCatalogueSetData } from "@/lib/catalogue";
import { availableFinishes,singleFinish } from "@/lib/card-metadata";
import { priceKey,rarityKey,resolvePrice,validPriceRules,type PriceScope,type PriceDetail,type PriceOverview,type ResolvedPrice } from "@/lib/card-prices";
import { getPublicCardDetails } from "./catalogue-completeness";
type Connection=Pick<typeof db,"select">;
type Actor={id:string;username?:string|null;name:string};
export async function getPriceOverview():Promise<PriceOverview>{
 const sets=await getCatalogueSets(),rarities=new Map<string,string>();
 for(const set of sets)for(const card of set.cards)if(card.rarity.trim())rarities.set(rarityKey(card.rarity),card.rarity.trim());
 return {sets:sets.map(({code,name})=>({code,name})),rarities:[...rarities.values()].sort((a,b)=>a.localeCompare(b,"fr"))};
}
async function targetInfo(scope:PriceScope,target:string,setCode:string,connection:Connection){
 if(scope==="card"){
  const set=await getCatalogueSetData(setCode,connection),card=set?.cards.find(card=>card.id===target);
  if(!set||!card)throw new AdminError("Carte introuvable.",404);
  const details=await getPublicCardDetails(set.code,card.id,connection);
  return {target:card.id,setCode:set.code,name:card.name+" · "+set.code+" n°"+card.localId,rarity:card.rarity,finishes:singleFinish(details?.availableFinishes)};
 }
 const sets=await getCatalogueSets(connection),card=sets.flatMap(set=>set.cards).find(card=>rarityKey(card.rarity)===rarityKey(target));
 if(!target.trim()||!card)throw new AdminError("Rareté introuvable dans le catalogue.",404);
 return {target:rarityKey(card.rarity),setCode:"",name:card.rarity,rarity:card.rarity,finishes:[...availableFinishes]};
}
export async function getResolvedCardPrices(id:string,rarity:string,connection:Connection=db){
 const keys=availableFinishes.flatMap(finish=>[priceKey("rarity",rarity,finish),priceKey("card",id,finish)]);
 const rows=await connection.select().from(cardPriceRules).where(inArray(cardPriceRules.key,keys));
 const rules=new Map(rows.map(row=>[row.key,row]));
 return Object.fromEntries(availableFinishes.map(finish=>[finish,resolvePrice(rules.get(priceKey("rarity",rarity,finish)),rules.get(priceKey("card",id,finish)))])) as Record<typeof availableFinishes[number],ResolvedPrice>;
}
export async function getPriceDetail(scope:PriceScope,target:string,setCode:string,connection:Connection=db):Promise<PriceDetail>{
 const info=await targetInfo(scope,target,setCode,connection);
 const keys=info.finishes.map(finish=>priceKey(scope,info.target,finish));
 const rows=keys.length?await connection.select().from(cardPriceRules).where(inArray(cardPriceRules.key,keys)):[];
 const rules=info.finishes.map(finish=>{const row=rows.find(row=>row.finish===finish);return {finish,coins:row?.coins??null,gems:row?.gems??null,revision:row?.revision??0};});
 const effective=scope==="card"?await getResolvedCardPrices(info.target,info.rarity,connection):Object.fromEntries(rules.map(rule=>[rule.finish,resolvePrice(rule)])) as PriceDetail["effective"];
 return {scope,...info,rules,effective};
}
export async function savePriceRules(actor:Actor,body:Record<string,unknown>){
 const {scope,target,setCode,rules}=body;
 if((scope!=="card"&&scope!=="rarity")||typeof target!=="string"||target.length>160||typeof setCode!=="string"||setCode.length>12||!validPriceRules(rules))
  throw new AdminError("Tarifs invalides : nombres entiers positifs, zéro ou champs vides.",400);
 return db.transaction(async tx=>{
  await lockAdminAccess(tx,actor.id,"economy.edit");
  const previous=await getPriceDetail(scope,target,setCode,tx);
  if(rules.length!==previous.rules.length||rules.some(rule=>!previous.rules.some(old=>old.finish===rule.finish)))throw new AdminError("La finition de cette carte a changé ou reste à définir. Recharge sa fiche.",409);
  for(const rule of rules){
   const old=previous.rules.find(old=>old.finish===rule.finish)!;
   if(old.revision!==rule.revision)throw new AdminError("Ces tarifs ont changé. Recharge avant de continuer.",409);
  }
  const before=previous.rules.map(({finish,coins,gems})=>({finish,coins,gems}));
  const after=rules.map(({finish,coins,gems})=>({finish,coins,gems}));
  const changed=rules.filter(rule=>{const old=previous.rules.find(old=>old.finish===rule.finish)!;return old.coins!==rule.coins||old.gems!==rule.gems;});
  for(const rule of changed){
   const value:typeof cardPriceRules.$inferInsert={key:priceKey(scope,previous.target,rule.finish),scope,target:previous.target,finish:rule.finish,coins:rule.coins,gems:rule.gems,revision:rule.revision+1,updatedBy:actor.id,updatedAt:new Date()};
   await tx.insert(cardPriceRules).values(value).onConflictDoUpdate({target:cardPriceRules.key,set:value});
  }
  if(changed.length)await tx.insert(adminAudit).values({actorId:actor.id,actorName:actor.username??actor.name,action:"economy.prices",targetName:previous.name,before:{priceRules:{scope,values:before}},after:{priceRules:{scope,values:after}}});
  return getPriceDetail(scope,previous.target,previous.setCode,tx);
 });
}
