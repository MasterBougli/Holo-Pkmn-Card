import { randomUUID,createHash } from "node:crypto";
import { eq,sql,count } from "drizzle-orm";
import { db } from "./db";
import { gameRarities } from "./rarity-schema";
import { catalogueCards } from "./catalogue-schema";
import { boosterConfigs,ownedCards } from "./booster-schema";
import { cardPriceRules } from "./card-price-schema";
import { siteSettings } from "./site-schema";
import { adminAudit } from "./admin-schema";
import { AdminError,lockAdminAccess,type AdminTransaction } from "./admin-authorisation";
import { getGameRarities } from "./rarity-catalogue";
import { getCatalogueSets } from "./catalogue";
import { readBaseDetails } from "./catalogue-completeness";
import { findRarity,rarityNameKey,validRarityName,type RarityOverview,type GameRarity } from "./rarity-types";
import { priceKey,rarityKey } from "./card-prices";
import { validComposition } from "./booster-types";
import { basicRarity } from "./booster-reveal";
type Connection=Pick<typeof db,"select">;
type Actor={id:string;username?:string|null;name:string};
export async function getRarityOverview(connection:Connection=db,includePrices=false):Promise<RarityOverview>{
 const copyRarity=sql<string>`${ownedCards.snapshot}->>'rarity'`;
 const [entries,sets,overrides,configs,prices,settings,copies]=await Promise.all([
  getGameRarities(connection),getCatalogueSets(connection),connection.select().from(catalogueCards),
  connection.select().from(boosterConfigs),connection.select().from(cardPriceRules),
  connection.select().from(siteSettings).where(eq(siteSettings.id,"site")),
  connection.select({rarity:copyRarity,value:count()}).from(ownedCards).groupBy(copyRarity),
 ]);
 const manual=new Map(overrides.map(c=>[c.id,c.rarity])),counts=new Map<string,number>(),unknown=new Map<string,number>();
 for(let i=0;i<sets.length;i+=8){await Promise.all(sets.slice(i,i+8).map(async set=>{
  const base=await readBaseDetails(set.code);
  for(const c of set.cards){const seen=new Set<string>();const raws=manual.has(c.id)?[manual.get(c.id)]:[base[c.id]?.rarity,c.rarity];for(const raw of new Set(raws)){if(typeof raw!=="string"||!raw.trim())continue;
   const found=findRarity(raw,entries);if(found){if(!seen.has(found.id)){counts.set(found.id,(counts.get(found.id)??0)+1);seen.add(found.id);}}else unknown.set(raw,(unknown.get(raw)??0)+1);
  }}
 }));}
 const rows=entries.map(r=>{const rules=prices.filter(p=>p.scope==="rarity"&&findRarity(p.target,entries)?.id===r.id);return {...r,cards:counts.get(r.id)??0,copies:copies.filter(c=>c.rarity&&findRarity(c.rarity,entries)?.id===r.id).reduce((n,c)=>n+c.value,0),
  boosterSets:configs.filter(c=>c.composition.slots.some(s=>s.choices.some(v=>findRarity(v.rarity,entries)?.id===r.id))).map(c=>c.setCode),
  priceCount:rules.length,priceRules:includePrices?rules.map(({finish,coins,gems})=>({finish,coins,gems})):[]};
 });
 const unregistered=[...unknown].map(([name,cards])=>({name,cards})).sort((a,b)=>a.name.localeCompare(b.name,"fr"));
 const token=createHash("sha256").update(JSON.stringify({entries,counts:[...counts].sort(),unknown:unregistered,configs:configs.sort((a,b)=>a.setCode.localeCompare(b.setCode)),prices:prices.sort((a,b)=>a.key.localeCompare(b.key)),styles:settings[0]?.boosterRevealRevision,copies:copies.sort((a,b)=>(a.rarity??"").localeCompare(b.rarity??""))})).digest("hex");
 return {rarities:rows,unregistered,token};
}
export async function changeRarity(actor:Actor,body:Record<string,unknown>){
 const action=body.action;if(!["create","rename","delete"].includes(String(action)))throw new AdminError("Action invalide.",400);
 if(typeof body.token!=="string")throw new AdminError("Recharge la liste des raretés.",409);
 if(action!=="delete"&&!validRarityName(body.name))throw new AdminError("Nom de rareté : 1 à 160 caractères.",400);
 return db.transaction(async tx=>{
  await lockAdminAccess(tx,actor.id,action==="create"?"rarities.create":action==="rename"?"rarities.edit":"rarities.delete");
  const before=await getRarityOverview(tx,true);
  if(before.token!==body.token)throw new AdminError("Le catalogue ou ses réglages ont changé. Recharge la liste pour revoir cette opération.",409);
  if(action==="create"){
   const name=(body.name as string).trim();if(findRarity(name,before.rarities))throw new AdminError("Ce nom est déjà une rareté ou une correspondance d’import.",409);
   if(before.rarities.length>=200)throw new AdminError("La liste est limitée à 200 raretés.",400);
   if(before.unregistered.some(r=>rarityNameKey(r.name)===rarityNameKey(name)))await lockAdminAccess(tx,actor.id,"catalogue.edit");
   const value={id:randomUUID(),name,key:rarityNameKey(name),aliases:[],updatedBy:actor.id};
   await tx.insert(gameRarities).values(value);
   await tx.insert(adminAudit).values({actorId:actor.id,actorName:actor.username??actor.name,action:"rarities.create",targetName:name,after:{rarity:value}});
   return;
  }
  const source=before.rarities.find(r=>r.id===body.id);if(!source)throw new AdminError("Rareté introuvable.",404);
  const target=action==="delete"?before.rarities.find(r=>r.id===body.replacementId):undefined;
  if(action==="delete"&&body.replacementId&&!target)throw new AdminError("Rareté de remplacement introuvable.",404);
  if(target?.id===source.id)throw new AdminError("Choisis une autre rareté de remplacement.",400);
  const used=source.cards>0||source.copies>0||source.boosterSets.length>0||source.priceCount>0;
  if(action==="delete"&&used&&!target)throw new AdminError("Cette rareté est utilisée. Choisis une rareté de remplacement.",409);
  const newName=action==="rename"?(body.name as string).trim():target?.name;
  if(action==="rename"){const existing=findRarity(newName!,before.rarities);if(existing&&existing.id!==source.id)throw new AdminError("Ce nom appartient déjà à une rareté. Utilise la suppression avec remplacement pour regrouper les doublons.",409);if(newName===source.name)return;}
  if(source.cards>0)await lockAdminAccess(tx,actor.id,"catalogue.edit");
  const configs=await tx.select().from(boosterConfigs),prices=await tx.select().from(cardPriceRules);
  const [site]=await tx.select().from(siteSettings).where(eq(siteSettings.id,"site"));
  if(!site)throw new AdminError("Configuration du site indisponible.",503);
  const matches=(raw:string,r:GameRarity)=>findRarity(raw,before.rarities)?.id===r.id;
  const sourceStyles=Object.entries(site.boosterRevealStyles).filter(([name])=>matches(name,source));
  const targetStyles=target?Object.entries(site.boosterRevealStyles).filter(([name])=>matches(name,target)):[];
  if(source.boosterSets.length||sourceStyles.length)await lockAdminAccess(tx,actor.id,"boosters.edit");
  if(source.priceCount){await lockAdminAccess(tx,actor.id,"economy.read");await lockAdminAccess(tx,actor.id,"economy.edit");}
  const changedConfigs=[];
  if(newName)for(const config of configs){
   if(!config.composition.slots.some(s=>s.choices.some(c=>matches(c.rarity,source))))continue;
   const composition={...config.composition,slots:config.composition.slots.map(s=>{
    const choices=new Map<string,number>();for(const choice of s.choices){const rarity=matches(choice.rarity,source)?newName:choice.rarity;choices.set(rarity,(choices.get(rarity)??0)+choice.weight);}
    return {...s,choices:[...choices].map(([rarity,weight])=>({rarity,weight}))};
   })};
   if(!validComposition(composition))throw new AdminError("Les poids fusionnés dépassent la limite. Ajuste d’abord les compositions concernées.",409);
   await tx.update(boosterConfigs).set({composition,revision:config.revision+1,updatedBy:actor.id,updatedAt:new Date()}).where(eq(boosterConfigs.setCode,config.setCode));
   changedConfigs.push({set:config.setCode,before:config.composition,after:composition});
  }
  const sourcePrices=prices.filter(p=>p.scope==="rarity"&&matches(p.target,source)),changedPrices=[];
  if(newName)for(const old of sourcePrices){
   const key=priceKey("rarity",newName,old.finish);if(key===old.key)continue;
   const destination=prices.find(p=>p.key===key);
   const collision=destination&&(["coins","gems"] as const).some(k=>old[k]!==null&&destination[k]!==null&&old[k]!==destination[k]);
   if(collision&&body.pricePolicy!=="target"&&body.pricePolicy!=="source")throw new AdminError("Choisis les tarifs à conserver en cas de conflit.",409);
   const value={...old,key,target:rarityKey(newName),coins:body.pricePolicy==="source"?old.coins??destination?.coins??null:destination?.coins??old.coins,
    gems:body.pricePolicy==="source"?old.gems??destination?.gems??null:destination?.gems??old.gems,
    revision:Math.max(old.revision,destination?.revision??0)+1,updatedBy:actor.id,updatedAt:new Date()};
   await tx.delete(cardPriceRules).where(eq(cardPriceRules.key,old.key));
   await tx.insert(cardPriceRules).values(value).onConflictDoUpdate({target:cardPriceRules.key,set:value});
   changedPrices.push({before:old,destination:destination??null,after:value});
  }
  if(sourceStyles.length){
   const styles={...site.boosterRevealStyles};for(const [key]of sourceStyles)delete styles[key];
   if(newName){for(const [key]of targetStyles)delete styles[key];const selected=body.effectPolicy==="source"?sourceStyles[0]?.[1]??targetStyles[0]?.[1]:targetStyles[0]?.[1]??sourceStyles[0]?.[1];if(selected)styles[newName]={...selected,enabled:basicRarity(newName)?false:selected.enabled};}
   await tx.update(siteSettings).set({boosterRevealStyles:styles,boosterRevealRevision:site.boosterRevealRevision+1}).where(eq(siteSettings.id,"site"));
  }
  const aliases=[...new Set([...(target?.aliases??source.aliases),...(target?source.aliases:[]),source.name])].filter(n=>n!==newName);
  if(action==="rename")await tx.update(gameRarities).set({name:newName!,key:rarityNameKey(newName!),aliases,revision:source.revision+1,updatedBy:actor.id,updatedAt:new Date()}).where(eq(gameRarities.id,source.id));
  else{
   if(target)await tx.update(gameRarities).set({aliases,revision:target.revision+1,updatedBy:actor.id,updatedAt:new Date()}).where(eq(gameRarities.id,target.id));
   await tx.delete(gameRarities).where(eq(gameRarities.id,source.id));
  }
  await tx.insert(adminAudit).values({actorId:actor.id,actorName:actor.username??actor.name,action:"rarities."+action,targetName:source.name,
   before:{rarity:source,target:target??null,styles:sourceStyles},after:{name:newName??null,replacement:target?.id??null,aliases,boosterConfigs:changedConfigs,prices:changedPrices,historicalSnapshots:"Conservés"}});
 });
}
