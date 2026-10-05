import { pgTable,text,timestamp,jsonb,integer,index,primaryKey } from "drizzle-orm/pg-core";
import type { DiscoveryItem,ImportRequest } from "./catalogue-import-types";
export const importJobs=pgTable("catalogue_import_jobs",{
 id:text("id").primaryKey(),kind:text("kind").notNull(),status:text("status").notNull().default("queued"),actorId:text("actor_id"),actorName:text("actor_name").notNull(),
 payload:jsonb("payload").$type<ImportRequest>(),summary:text("summary").notNull().default(""),progress:integer("progress").notNull().default(0),total:integer("total").notNull().default(0),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),finishedAt:timestamp("finished_at",{withTimezone:true}),
},t=>[index("catalogue_jobs_created_idx").on(t.createdAt)]);
export const discoveryItems=pgTable("catalogue_discovery_items",{
 reportId:text("report_id").notNull().references(()=>importJobs.id,{onDelete:"restrict"}),sourceCode:text("source_code").notNull(),data:jsonb("data").$type<DiscoveryItem>().notNull(),
},t=>[primaryKey({columns:[t.reportId,t.sourceCode]})]);
export const importSchedule=pgTable("catalogue_import_schedule",{
 id:integer("id").primaryKey(),weekday:integer("weekday").notNull().default(1),hour:integer("hour").notNull().default(4),nextRun:timestamp("next_run",{withTimezone:true}).notNull(),heartbeat:timestamp("heartbeat",{withTimezone:true}),
});
export const importMappings=pgTable("catalogue_import_mappings",{
 sourceCode:text("source_code").primaryKey(),localCode:text("local_code").notNull(),tcgdexId:text("tcgdex_id").notNull().default(""),updatedBy:text("updated_by").notNull(),updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
});
