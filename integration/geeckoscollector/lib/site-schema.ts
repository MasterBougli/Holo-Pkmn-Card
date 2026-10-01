import { sql } from "drizzle-orm";
import { pgTable,text,boolean,integer,timestamp,check } from "drizzle-orm/pg-core";
export const siteSettings=pgTable("site_settings",{
 id:text("id").primaryKey().default("site"),
 maintenanceEnabled:boolean("maintenance_enabled").notNull().default(false),
 maintenanceMessage:text("maintenance_message").notNull(),
 registrationsEnabled:boolean("registrations_enabled").notNull().default(true),
 registrationMessage:text("registration_message").notNull(),
 revision:integer("revision").notNull().default(1),
 updatedBy:text("updated_by"),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},()=>[check("site_settings_singleton",sql.raw("id = 'site'"))]);
