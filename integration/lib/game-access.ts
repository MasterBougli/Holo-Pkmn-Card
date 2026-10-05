import { and,eq,isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { adminRoles,adminUserRoles } from "@/lib/admin-schema";
import { isSuperAdmin } from "@/lib/admin-identity";
import { getSiteSettings } from "@/lib/site-settings";
export async function isTeamMember(id:string){
 if(isSuperAdmin(id))return true;
 const roles=await db.select({id:adminRoles.id}).from(adminUserRoles).innerJoin(adminRoles,eq(adminRoles.id,adminUserRoles.roleId))
 .where(and(eq(adminUserRoles.userId,id),isNull(adminRoles.archivedAt))).limit(1);
 return roles.length>0;
}
export async function getGameAccess(id?:string){
 const config=await getSiteSettings();
 return {config,allowed:!config.maintenanceEnabled||Boolean(id&&await isTeamMember(id))};
}
export async function requireGameAccess(id:string){
 const access=await getGameAccess(id);if(!access.allowed)redirect("/maintenance");
 return access;
}
// Future private gameplay endpoints must call getGameAccess and reject with 503
// before reading player game data or carrying out a game action.
