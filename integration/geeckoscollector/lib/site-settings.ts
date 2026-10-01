import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/site-schema";
import type { SiteConfiguration } from "@/lib/site-config";
export async function getSiteSettings():Promise<SiteConfiguration>{
 const [row]=await db.select().from(siteSettings).where(eq(siteSettings.id,"site")).limit(1);
 if(!row)throw new Error("La configuration du site est absente ; appliquer la migration 0004.");
 return {maintenanceEnabled:row.maintenanceEnabled,maintenanceMessage:row.maintenanceMessage,
  registrationsEnabled:row.registrationsEnabled,registrationMessage:row.registrationMessage,
  revision:row.revision,updatedAt:row.updatedAt.toISOString()};
}
