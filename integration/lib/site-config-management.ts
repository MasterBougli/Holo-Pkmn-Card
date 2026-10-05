import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/site-schema";
import { adminAudit } from "@/lib/admin-schema";
import { AdminError,lockAdminAccess } from "@/lib/admin-access";
import { validSiteConfig,type SiteConfigFields } from "@/lib/site-config";
type Actor={id:string;username?:string|null;name:string};
function snapshot(config:SiteConfigFields){
 return {configuration:{maintenanceEnabled:config.maintenanceEnabled,maintenanceMessage:config.maintenanceMessage,registrationsEnabled:config.registrationsEnabled,registrationMessage:config.registrationMessage}};
}
export async function updateSiteSettings(actor:Actor,body:Record<string,unknown>){
 const revision=body.revision;
 if(!validSiteConfig(body)||!Number.isSafeInteger(revision)||Number(revision)<1)
  throw new AdminError("Messages de 5 à 800 caractères et réglages valides requis.",400);
 const next={maintenanceEnabled:body.maintenanceEnabled,maintenanceMessage:body.maintenanceMessage.trim(),
  registrationsEnabled:body.registrationsEnabled,registrationMessage:body.registrationMessage.trim()};
 return db.transaction(async tx=>{
  await lockAdminAccess(tx,actor.id,"config.edit");
  const [previous]=await tx.select().from(siteSettings).where(eq(siteSettings.id,"site")).limit(1);
  if(!previous)throw new AdminError("Configuration indisponible.",503);
  if(revision!==previous.revision)throw new AdminError("La configuration a changé. Recharge la page avant de continuer.",409);
  if(JSON.stringify(snapshot(previous))===JSON.stringify(snapshot(next)))
   return {...next,revision:previous.revision,updatedAt:previous.updatedAt.toISOString()};
  const [saved]=await tx.update(siteSettings).set({...next,revision:previous.revision+1,updatedAt:new Date(),updatedBy:actor.id}).where(eq(siteSettings.id,"site")).returning();
  await tx.insert(adminAudit).values({actorId:actor.id,actorName:actor.username??actor.name,action:"configuration.update",targetName:"Configuration du jeu",before:snapshot(previous),after:snapshot(next)});
  return {...next,revision:saved.revision,updatedAt:saved.updatedAt.toISOString()};
 });
}
