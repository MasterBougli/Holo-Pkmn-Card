import { randomUUID } from "node:crypto";
import { and,eq,isNull,asc,ilike,inArray,sql,desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/auth-schema";
import { adminRoles,adminUserRoles,adminAudit } from "@/lib/admin-schema";
import { AdminError,isSuperAdmin,lockAdminAccess,type AdminTransaction } from "@/lib/admin-access";
import { canDelegate,validPermissions,type AdminRoleView,type AdminPermission } from "@/lib/admin-permissions";
type Actor={id:string;username?:string|null;name:string};
function actorName(actor:Actor){return actor.username??actor.name;}
function roleSnapshot(role:typeof adminRoles.$inferSelect){return {name:role.name,description:role.description,permissions:role.permissions,archived:Boolean(role.archivedAt)};}
export async function listAdminRoles():Promise<AdminRoleView[]>{
 const rows=await db.select({role:adminRoles,members:sql.raw("count(admin_user_roles.user_id)::integer").mapWith(Number)})
 .from(adminRoles).leftJoin(adminUserRoles,eq(adminUserRoles.roleId,adminRoles.id)).groupBy(adminRoles.id).orderBy(asc(adminRoles.name));
 return rows.map(({role,members})=>({id:role.id,name:role.name,description:role.description,permissions:role.permissions,revision:role.revision,archived:Boolean(role.archivedAt),members}));
}
async function audit(tx:AdminTransaction,actor:Actor,action:string,targetName:string,before:unknown,after:unknown){
 await tx.insert(adminAudit).values({actorId:actor.id,actorName:actorName(actor),action,targetName,before,after});
}
export async function mutateRole(actor:Actor,method:string,body:Record<string,unknown>){
 const action=method==="POST"?"roles.create":method==="DELETE"?"roles.delete":"roles.edit";
 await db.transaction(async tx=>{
  const access=await lockAdminAccess(tx,actor.id,action);
  let previous:typeof adminRoles.$inferSelect|undefined;
  if(method!=="POST"){
   if(typeof body.id!=="string")throw new AdminError("Rôle invalide.",400);
   [previous]=await tx.select().from(adminRoles).where(eq(adminRoles.id,body.id)).limit(1);
   if(!previous)throw new AdminError("Rôle introuvable.",404);
   if(body.revision!==previous.revision)throw new AdminError("Ce rôle a changé. Recharge la page avant de continuer.",409);
   if(!canDelegate(access,previous.permissions))throw new AdminError("Ce rôle contient des permissions que tu ne peux pas gérer.");
  }
  const affectedAccounts=previous?(await tx.select({username:user.username,name:user.name}).from(adminUserRoles).innerJoin(user,eq(user.id,adminUserRoles.userId)).where(eq(adminUserRoles.roleId,previous.id))).map(account=>account.username??account.name):[];
  if(method==="DELETE"){
   if(previous!.archivedAt)throw new AdminError("Ce rôle est déjà archivé.",409);
   const assignments=await tx.select({userId:adminUserRoles.userId}).from(adminUserRoles).where(eq(adminUserRoles.roleId,previous!.id)).limit(1);
   if(assignments.length)throw new AdminError("Retire d’abord ce rôle des comptes auxquels il est attribué.",409);
   await tx.update(adminRoles).set({archivedAt:new Date(),updatedAt:new Date(),revision:previous!.revision+1}).where(eq(adminRoles.id,previous!.id));
   await audit(tx,actor,"role.archive",previous!.name,roleSnapshot(previous!),{...roleSnapshot(previous!),archived:true});return;
  }
  if(body.restore===true){
   if(!previous?.archivedAt)throw new AdminError("Ce rôle n’est pas archivé.",409);
   await tx.update(adminRoles).set({archivedAt:null,updatedAt:new Date(),revision:previous.revision+1}).where(eq(adminRoles.id,previous.id));
   await audit(tx,actor,"role.restore",previous.name,roleSnapshot(previous),{...roleSnapshot(previous),archived:false});return;
  }
  if(previous?.archivedAt)throw new AdminError("Restaure ce rôle avant de le modifier.",409);
  if(typeof body.name!=="string"||body.name.trim().length<2||body.name.trim().length>60||/[\u0000-\u001f]/.test(body.name)||typeof body.description!=="string"||body.description.length>400||!validPermissions(body.permissions))
   throw new AdminError("Nom de 2 à 60 caractères, description de 400 caractères maximum et permissions valides requis.",400);
  if(/super\s*admin/i.test(body.name))throw new AdminError("Le statut de superadministrateur est réservé à Bougli.",400);
  if(!canDelegate(access,body.permissions))throw new AdminError("Tu peux uniquement déléguer tes propres permissions.");
  const fields={name:body.name.trim(),description:body.description.trim(),permissions:body.permissions as AdminPermission[]};
  if(previous){
   await tx.update(adminRoles).set({...fields,updatedAt:new Date(),revision:previous.revision+1}).where(eq(adminRoles.id,previous.id));
  }else await tx.insert(adminRoles).values({id:randomUUID(),...fields});
  await audit(tx,actor,previous?"role.update":"role.create",fields.name,previous?{...roleSnapshot(previous),affectedAccounts}:null,{...fields,archived:false,affectedAccounts});
 });
}
export type AdminAccountView={id:string;name:string;superAdmin:boolean;roleIds:string[];permissions:AdminPermission[]};
export async function listAdminAccounts(query:string,page:number){
 const filter=query?ilike(user.username,"%"+query.replace(/[\\%_]/g,char=>"\\"+char)+"%"):undefined;
 const accounts=await db.select({id:user.id,username:user.username,name:user.name}).from(user).where(filter).orderBy(asc(user.username),asc(user.id)).limit(21).offset(page*20);
 const visible=accounts.slice(0,20);
 const assignments=visible.length?await db.select({userId:adminUserRoles.userId,roleId:adminUserRoles.roleId,permissions:adminRoles.permissions})
 .from(adminUserRoles).innerJoin(adminRoles,eq(adminRoles.id,adminUserRoles.roleId))
 .where(and(inArray(adminUserRoles.userId,visible.map(row=>row.id)),isNull(adminRoles.archivedAt))):[];
 return {hasMore:accounts.length>20,accounts:visible.map(account=>{
  const roles=assignments.filter(row=>row.userId===account.id);
  return {id:account.id,name:account.username??account.name,superAdmin:isSuperAdmin(account.id),roleIds:roles.map(role=>role.roleId),permissions:[...new Set(roles.flatMap(role=>role.permissions))]};
 })};
}
function roleIds(value:unknown):value is string[]{return Array.isArray(value)&&value.length<=100&&new Set(value).size===value.length&&value.every(id=>typeof id==="string"&&id.length<=100);}
export async function assignAdminRoles(actor:Actor,body:Record<string,unknown>){
 if(typeof body.userId!=="string"||!roleIds(body.roleIds)||!roleIds(body.expectedRoleIds))throw new AdminError("Attribution invalide.",400);
 const targetId=body.userId,requested=body.roleIds,expected=body.expectedRoleIds;
 await db.transaction(async tx=>{
  const access=await lockAdminAccess(tx,actor.id,"roles.assign");
  if(!access.superAdmin&&!access.permissions.includes("users.read"))throw new AdminError("La consultation des comptes est nécessaire.");
  if(isSuperAdmin(targetId))throw new AdminError("Le compte superadministrateur de Bougli est protégé.");
  const [target]=await tx.select({id:user.id,name:user.name,username:user.username}).from(user).where(eq(user.id,targetId)).limit(1);
  if(!target)throw new AdminError("Compte introuvable.",404);
  const current=await tx.select({role:adminRoles}).from(adminUserRoles).innerJoin(adminRoles,eq(adminRoles.id,adminUserRoles.roleId)).where(eq(adminUserRoles.userId,targetId));
  const currentIds=current.map(row=>row.role.id).sort();
  if(JSON.stringify(currentIds)!==JSON.stringify([...expected].sort()))throw new AdminError("Les rôles de ce compte ont changé. Recharge la page.",409);
  const selected=requested.length?await tx.select().from(adminRoles).where(inArray(adminRoles.id,requested)):[];
  if(selected.length!==requested.length||selected.some(role=>role.archivedAt))throw new AdminError("Un rôle est introuvable ou archivé.",400);
  const added=selected.filter(role=>!currentIds.includes(role.id));
  const removed=current.map(row=>row.role).filter(role=>!requested.includes(role.id));
  if([...added,...removed].some(role=>!canDelegate(access,role.permissions)))throw new AdminError("Tu ne peux attribuer ou retirer que les rôles couverts par tes permissions.");
  if(!added.length&&!removed.length)return;
  if(removed.length)await tx.delete(adminUserRoles).where(and(eq(adminUserRoles.userId,targetId),inArray(adminUserRoles.roleId,removed.map(role=>role.id))));
  if(added.length)await tx.insert(adminUserRoles).values(added.map(role=>({userId:targetId,roleId:role.id,assignedBy:actor.id})));
  await audit(tx,actor,"account.roles",target.username??target.name,
   {roles:current.map(row=>row.role.name).sort(),permissions:[...new Set(current.flatMap(row=>row.role.permissions))].sort()},
   {roles:selected.map(role=>role.name).sort(),permissions:[...new Set(selected.flatMap(role=>role.permissions))].sort()});
 });
}
export async function listAdminAudit(page:number){
 return db.select({id:adminAudit.id,actorName:adminAudit.actorName,action:adminAudit.action,targetName:adminAudit.targetName,before:adminAudit.before,after:adminAudit.after,createdAt:adminAudit.createdAt})
 .from(adminAudit).orderBy(desc(adminAudit.id)).limit(31).offset(page*30);
}
