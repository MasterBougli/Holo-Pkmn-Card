import { pgTable,text,timestamp,jsonb,integer,primaryKey,index } from "drizzle-orm/pg-core";
import { user } from "@/lib/auth-schema";
import type { AdminPermission } from "@/lib/admin-permissions";
export const adminRoles=pgTable("admin_roles",{
 id:text("id").primaryKey(),name:text("name").notNull(),description:text("description").notNull().default(""),
 permissions:jsonb("permissions").$type<AdminPermission[]>().notNull().default([]),
 revision:integer("revision").notNull().default(1),
 archivedAt:timestamp("archived_at",{withTimezone:true}),
 createdAt:timestamp("created_at",{withTimezone:true}).defaultNow().notNull(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).defaultNow().notNull(),
});
export const adminUserRoles=pgTable("admin_user_roles",{
 userId:text("user_id").notNull().references(()=>user.id,{onDelete:"cascade"}),
 roleId:text("role_id").notNull().references(()=>adminRoles.id,{onDelete:"restrict"}),
 assignedBy:text("assigned_by").notNull(),createdAt:timestamp("created_at",{withTimezone:true}).defaultNow().notNull(),
},table=>[primaryKey({columns:[table.userId,table.roleId]}),index("admin_user_roles_role_idx").on(table.roleId)]);
export const adminAudit=pgTable("admin_audit",{
 id:integer("id").primaryKey().generatedAlwaysAsIdentity(),
 actorId:text("actor_id").notNull(),actorName:text("actor_name").notNull(),action:text("action").notNull(),
 targetName:text("target_name").notNull(),before:jsonb("before"),after:jsonb("after"),
 createdAt:timestamp("created_at",{withTimezone:true}).defaultNow().notNull(),
},table=>[index("admin_audit_created_idx").on(table.createdAt)]);
