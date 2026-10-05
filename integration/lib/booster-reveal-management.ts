import { getGameRarities,findRarity } from "./rarity-catalogue";
import { defaultRevealStyle } from "./booster-reveal";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { siteSettings } from "./site-schema";
import { adminAudit } from "./admin-schema";
import { AdminError,lockAdminAccess } from "./admin-authorisation";

import { validRevealStyles,type RevealConfiguration } from "./booster-reveal";
export async function getBoosterRevealSettings():Promise<RevealConfiguration>{
 const [row]=await db.select({styles:siteSettings.boosterRevealStyles,revision:siteSettings.boosterRevealRevision}).from(siteSettings).where(eq(siteSettings.id,"site")).limit(1);
 if(!row)throw new AdminError("Configuration indisponible.",503);
 return {styles:validRevealStyles(row.styles)?row.styles:{},revision:row.revision};
}
export async function getRevealRarities(){return (await getGameRarities()).map(r=>r.name);}
export async function getPublicBoosterRevealStyles(){const config=await getBoosterRevealSettings(),entries=await getGameRarities(),styles={...config.styles};for(const r of entries){const style=config.styles[r.name]??defaultRevealStyle(r.name);styles[r.name]=style;for(const alias of r.aliases)styles[alias]=style;}return styles;}
export async function saveBoosterRevealSettings(actor:{id:string;username?:string|null;name:string},body:Record<string,unknown>){
 if(!validRevealStyles(body.styles)||!Number.isSafeInteger(body.revision)||Number(body.revision)<1)throw new AdminError("Couleurs et réglages invalides.",400);
 const styles=body.styles;
 return db.transaction(async tx=>{
  await lockAdminAccess(tx,actor.id,"boosters.edit");
  const entries=await getGameRarities(tx);if(Object.keys(styles).some(name=>findRarity(name,entries)?.name!==name))throw new AdminError("La liste des raretés a changé. Recharge les effets.",409);
  const [previous]=await tx.select().from(siteSettings).where(eq(siteSettings.id,"site")).limit(1);
  if(!previous)throw new AdminError("Configuration indisponible.",503);
  if(body.revision!==previous.boosterRevealRevision)throw new AdminError("Ces effets ont changé. Recharge les réglages avant de continuer.",409);
  const [saved]=await tx.update(siteSettings).set({boosterRevealStyles:styles,boosterRevealRevision:previous.boosterRevealRevision+1}).where(eq(siteSettings.id,"site")).returning();
  await tx.insert(adminAudit).values({actorId:actor.id,actorName:actor.username??actor.name,action:"boosters.reveal.update",targetName:"Effets de révélation",before:{styles:previous.boosterRevealStyles},after:{styles}});
  return {styles:saved.boosterRevealStyles,revision:saved.boosterRevealRevision};
 });
}
