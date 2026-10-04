import { randomInt,randomUUID } from "node:crypto";
import { and,eq,isNull,sql,desc,ilike,or,count } from "drizzle-orm";
import { db } from "./db";
import { boosterConfigs,boosterGrants,playerBoosters,ownedCards } from "./booster-schema";
import { gameSets,cardAvailability } from "./catalogue-schema";
import { user } from "./auth-schema";
import { adminAudit } from "./admin-schema";
import { AdminError,lockAdminAccess,type AdminTransaction } from "./admin-authorisation";
import { getSetCompleteness } from "./catalogue-completeness";
import { getGameAccess } from "./game-access";
import { defaultDefects } from "./card-defects";
import { validComposition,type BoosterComposition,type OwnedCard } from "./booster-types";
type Actor={id:string;username?:string|null;name:string};
const uuid=(s:unknown):s is string=>typeof s==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
export async function boosterSets(){return db.select({code:gameSets.code,name:gameSets.name,active:gameSets.active}).from(gameSets).orderBy(gameSets.code);}
export async function boosterSetup(code:string){
 const report=await getSetCompleteness(code);if(!report)throw new AdminError("Set introuvable.",404);
 const [config]=await db.select().from(boosterConfigs).where(eq(boosterConfigs.setCode,report.set.code)).limit(1);
 const [set]=await db.select().from(gameSets).where(eq(gameSets.code,report.set.code)).limit(1);
 const exclusions=await db.select().from(cardAvailability).where(and(eq(cardAvailability.setCode,report.set.code),eq(cardAvailability.excluded,true)));
 const excluded=new Set(exclusions.map(c=>c.cardId));
 return {setCode:report.set.code,name:report.set.name,active:set.active,complete:report.complete,incomplete:report.incomplete,
 rarities:[...new Set(report.cards.filter(c=>!c.missing.length&&!excluded.has(c.id)).map(c=>c.rarity))].sort((a,b)=>a.localeCompare(b,"fr")),composition:config?.composition??null,revision:config?.revision??0};
}
async function eligible(tx:AdminTransaction,code:string,composition:BoosterComposition,requireActive=true){
 const [set]=await tx.select().from(gameSets).where(eq(gameSets.code,code)).limit(1);
 const report=await getSetCompleteness(code,tx);
 if(!set||!report)throw new AdminError("Set introuvable.",404);
 if(requireActive&&(!set.active||!report.complete))throw new AdminError("Ce set doit être actif et toutes ses fiches complètes.",409);
 const excluded=new Set((await tx.select().from(cardAvailability).where(and(eq(cardAvailability.setCode,code),eq(cardAvailability.excluded,true)))).map(c=>c.cardId));
 const pool=report.cards.filter(c=>!c.missing.length&&!excluded.has(c.id));
 for(const slot of composition.slots)for(const choice of slot.choices)if(!pool.some(c=>c.rarity===choice.rarity))throw new AdminError("Aucune carte éligible pour la rareté « "+choice.rarity+" ». Corrige la composition ou les fiches.",409);
 return {pool,report};
}
export async function saveBoosterSetup(actor:Actor,body:Record<string,unknown>){
 if(typeof body.setCode!=="string"||!Number.isSafeInteger(body.revision)||!validComposition(body.composition))throw new AdminError("Composition invalide : 1 à 30 cartes et poids entiers positifs. Défauts : 0 à 1 000 par million.",400);
 const code=body.setCode,composition=body.composition,revision=Number(body.revision);
 await db.transaction(async tx=>{
  await lockAdminAccess(tx,actor.id,"boosters.edit");
  const [old]=await tx.select().from(boosterConfigs).where(eq(boosterConfigs.setCode,code)).limit(1);
  if((old?.revision??0)!==revision)throw new AdminError("Composition modifiée par un autre membre. Recharge.",409);
  await eligible(tx,code,composition,false);
  if(old&&JSON.stringify(old.composition)===JSON.stringify(composition))return;
  const value={setCode:code,composition,revision:revision+1,updatedBy:actor.id,updatedAt:new Date()};
  await tx.insert(boosterConfigs).values(value).onConflictDoUpdate({target:boosterConfigs.setCode,set:value});
  await tx.insert(adminAudit).values({actorId:actor.id,actorName:actor.username??actor.name,action:"boosters.config",targetName:code,before:old?{boosterSummary:JSON.stringify(old.composition)}:null,after:{boosterSummary:JSON.stringify(composition)}});
 });return boosterSetup(code);
}
export async function searchBoosterPlayers(query:string){
 if(query.trim().length<2)return [];
 const escaped=query.trim().slice(0,64).replace(/[\\%_]/g,"\\$&");
 return db.select({id:user.id,pseudo:user.displayUsername,username:user.username}).from(user).where(and(eq(user.emailVerified,true),or(ilike(user.username,"%"+escaped+"%"),ilike(user.displayUsername,"%"+escaped+"%")))).limit(20);
}
export async function grantBoosters(actor:Actor,body:Record<string,unknown>){
 if(!uuid(body.requestId)||typeof body.userId!=="string"||typeof body.setCode!=="string"||!Number.isInteger(body.quantity)||Number(body.quantity)<1||Number(body.quantity)>100||typeof body.reason!=="string"||body.reason.trim().length<3||body.reason.length>200)throw new AdminError("Choisis un joueur, 1 à 100 boosters et un motif de 3 à 200 caractères.",400);
 const {requestId,userId,setCode}=body,quantity=Number(body.quantity),reason=body.reason.trim();
 return db.transaction(async tx=>{
  await lockAdminAccess(tx,actor.id,"boosters.grant");
  const [existing]=await tx.select().from(boosterGrants).where(eq(boosterGrants.id,requestId)).limit(1);
  if(existing){if(existing.actorId!==actor.id||existing.userId!==userId||existing.setCode!==setCode||existing.quantity!==quantity||existing.reason!==reason)throw new AdminError("Cette demande a déjà été utilisée.",409);return {quantity:existing.quantity,replayed:true};}
  const [player]=await tx.select().from(user).where(eq(user.id,userId)).limit(1);
  if(!player?.emailVerified||!player.username)throw new AdminError("Joueur vérifié introuvable.",404);
  const [config]=await tx.select().from(boosterConfigs).where(eq(boosterConfigs.setCode,setCode)).limit(1);
  if(!config||!validComposition(config.composition))throw new AdminError("Configure d’abord la composition de ce set.",409);
  await eligible(tx,setCode,config.composition);
  await tx.insert(boosterGrants).values({id:requestId,actorId:actor.id,userId,setCode,quantity,reason});
  await tx.insert(playerBoosters).values(Array.from({length:quantity},()=>({id:randomUUID(),userId,grantId:requestId,setCode})));
  await tx.insert(adminAudit).values({actorId:actor.id,actorName:actor.username??actor.name,action:"boosters.grant",targetName:player.displayUsername??player.username,after:{boosterSummary:quantity+" booster(s) "+setCode+" · "+reason,grantId:requestId}});
  return {quantity,replayed:false};
 });
}
export async function grantHistory(){
 return db.select({id:boosterGrants.id,setCode:boosterGrants.setCode,quantity:boosterGrants.quantity,reason:boosterGrants.reason,pseudo:user.displayUsername,username:user.username,createdAt:boosterGrants.createdAt}).from(boosterGrants).innerJoin(user,eq(user.id,boosterGrants.userId)).orderBy(desc(boosterGrants.createdAt)).limit(30);
}
export async function playerInventory(userId:string,page=0){
 const packs=await db.select({id:playerBoosters.id,setCode:playerBoosters.setCode,setName:gameSets.name,openedAt:playerBoosters.openedAt,createdAt:playerBoosters.createdAt}).from(playerBoosters).innerJoin(gameSets,eq(gameSets.code,playerBoosters.setCode)).where(eq(playerBoosters.userId,userId)).orderBy(desc(playerBoosters.createdAt)).limit(24).offset(page*24);
 const [total]=await db.select({value:count()}).from(playerBoosters).where(eq(playerBoosters.userId,userId));
 const [unopened]=await db.select({value:count()}).from(playerBoosters).where(and(eq(playerBoosters.userId,userId),isNull(playerBoosters.openedAt)));
 return {packs,total:total.value,unopened:unopened.value};
}
export async function playerCollection(userId:string,page=0){
 const rows=await db.select({snapshot:ownedCards.snapshot}).from(ownedCards).where(eq(ownedCards.userId,userId)).orderBy(desc(ownedCards.createdAt),desc(ownedCards.id)).limit(24).offset(page*24);
 const [total]=await db.select({value:count()}).from(ownedCards).where(eq(ownedCards.userId,userId));
 return {cards:rows.map(r=>r.snapshot),total:total.value};
}
export async function openPlayerBooster(userId:string,id:unknown){
 if(!uuid(id))throw new AdminError("Booster invalide.",400);
 return db.transaction(async tx=>{
  // Catalogue, access and consumption share the same transaction lock.
  await tx.execute(sql.raw("select pg_advisory_xact_lock(748291034)"));
  if(!(await getGameAccess(userId)).allowed)throw new AdminError("Le jeu est en maintenance.",503);
  const [player]=await tx.select().from(user).where(eq(user.id,userId)).limit(1);
  if(!player?.emailVerified||!player.username)throw new AdminError("Vérifie ton adresse e-mail avant de jouer.",403);
  const [pack]=await tx.select().from(playerBoosters).where(and(eq(playerBoosters.id,id),eq(playerBoosters.userId,userId))).limit(1);
  if(!pack)throw new AdminError("Booster introuvable.",404);
  if(pack.openedAt){
   const cards=await tx.select({snapshot:ownedCards.snapshot}).from(ownedCards).where(eq(ownedCards.boosterId,id)).orderBy(ownedCards.position);
   return {cards:cards.map(c=>c.snapshot),replayed:true};
  }
  const [config]=await tx.select().from(boosterConfigs).where(eq(boosterConfigs.setCode,pack.setCode)).limit(1);
  if(!config||!validComposition(config.composition))throw new AdminError("Composition indisponible. Ton booster est conservé.",409);
  const {pool,report}=await eligible(tx,pack.setCode,config.composition);
  const previous=await tx.select({cardId:ownedCards.cardId}).from(ownedCards).where(and(eq(ownedCards.userId,userId),eq(ownedCards.setCode,pack.setCode)));
  const seen=new Set(previous.map(c=>c.cardId)),cards:OwnedCard[]=[];
  for(const slot of config.composition.slots)for(let i=0;i<slot.count;i++){
   let ticket=randomInt(slot.choices.reduce((n,c)=>n+c.weight,0));
   const choice=slot.choices.find(c=>{ticket-=c.weight;return ticket<0;})!;
   const candidates=pool.filter(c=>c.rarity===choice.rarity),card=candidates[randomInt(candidates.length)];
   let defects:OwnedCard["defects"]=null;
   if(randomInt(1000000)<config.composition.defectPpm){
    const settings=defaultDefects(),keys=["miscut","registration","missingInk","stain","printLine"] as const;
    const first=randomInt(keys.length);settings[keys[first]].enabled=true;
    if(randomInt(1000000)<config.composition.defectPpm){const second=(first+1+randomInt(keys.length-1))%keys.length;settings[keys[second]].enabled=true;}
    settings.seed=randomInt(1000000001);settings.miscut.x=randomInt(6,21)*(randomInt(2)?1:-1);settings.miscut.y=randomInt(-10,11);settings.registration.offset=randomInt(2,9);
    const neighbors=pool.filter(c=>c.id!==card.id);
    defects={version:1,setCode:pack.setCode,cardId:card.id,neighborId:neighbors.length?neighbors[randomInt(neighbors.length)].id:card.id,settings};
   }
   cards.push({id:randomUUID(),cardId:card.id,setCode:pack.setCode,setName:report.set.name,name:card.name,localId:card.localId,max:report.set.officialCount,rarity:card.rarity,illustrator:card.illustrator,finish:card.finishes[0],isNew:!seen.has(card.id),defects,position:cards.length});
   seen.add(card.id);
  }
  await tx.insert(ownedCards).values(cards.map(snapshot=>({id:snapshot.id,userId,boosterId:id,cardId:snapshot.cardId,setCode:pack.setCode,position:snapshot.position,snapshot})));
  await tx.update(playerBoosters).set({openedAt:new Date(),composition:config.composition,configRevision:config.revision}).where(eq(playerBoosters.id,id));
  return {cards,replayed:false};
 });
}
export async function boosterOdds(userId:string,id:string){
 const [pack]=await db.select().from(playerBoosters).where(and(eq(playerBoosters.id,id),eq(playerBoosters.userId,userId))).limit(1);
 if(!pack)throw new AdminError("Booster introuvable.",404);
 const setup=await boosterSetup(pack.setCode);
 return {name:setup.name,setCode:setup.setCode,composition:pack.openedAt?pack.composition:setup.composition,active:setup.active,complete:setup.complete};
}
