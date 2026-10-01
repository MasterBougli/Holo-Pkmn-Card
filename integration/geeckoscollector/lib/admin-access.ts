import { headers } from "next/headers";
import { and,eq,isNull,sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminRoles,adminUserRoles } from "@/lib/admin-schema";
import { can,permissionKeys,type AdminAccess,type AdminPermission } from "@/lib/admin-permissions";
import { isSuperAdmin } from "@/lib/admin-identity";
export { isSuperAdmin } from "@/lib/admin-identity";
export type AdminTransaction=Parameters<Parameters<typeof db.transaction>[0]>[0];
export async function getAdminAccess(id:string,connection:typeof db|AdminTransaction=db):Promise<AdminAccess>{
 if(isSuperAdmin(id))return {superAdmin:true,permissions:[...permissionKeys]};
 const rows=await connection.select({permissions:adminRoles.permissions}).from(adminUserRoles)
 .innerJoin(adminRoles,eq(adminUserRoles.roleId,adminRoles.id))
 .where(and(eq(adminUserRoles.userId,id),isNull(adminRoles.archivedAt)));
 return {superAdmin:false,permissions:[...new Set(rows.flatMap(row=>row.permissions))].filter(key=>permissionKeys.includes(key))};
}
export async function isAdminUser(id:string){return can(await getAdminAccess(id),"admin.access");}
export async function getAdminSession(permission:AdminPermission="admin.access"){
 const session=await auth.api.getSession({headers:await headers()});
 if(!session)return null;
 const access=await getAdminAccess(session.user.id);
 return can(access,"admin.access")&&can(access,permission)?{...session,access}:null;
}
export class AdminError extends Error {constructor(message:string,public status=403){super(message);}}
export async function lockAdminAccess(tx:AdminTransaction,id:string,permission:AdminPermission){
 // Serialize authorization changes and privileged writes, then re-read current grants.
 await tx.execute(sql.raw("select pg_advisory_xact_lock(748291034)"));
 const access=await getAdminAccess(id,tx);
 if(!can(access,"admin.access")||!can(access,permission))throw new AdminError("Permission insuffisante.");
 return access;
}
