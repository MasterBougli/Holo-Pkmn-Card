import {pgTable,text,jsonb,integer,timestamp,index} from "drizzle-orm/pg-core";
import type {EventContent} from "./event-types";
export const gameEvents=pgTable("game_events",{
 id:text("id").primaryKey(),draft:jsonb("draft").$type<EventContent>().notNull(),published:jsonb("published").$type<EventContent>(),
 startsAt:timestamp("starts_at",{withTimezone:true}),endsAt:timestamp("ends_at",{withTimezone:true}),
 revision:integer("revision").notNull().default(1),archivedAt:timestamp("archived_at",{withTimezone:true}),
 createdBy:text("created_by").notNull(),updatedBy:text("updated_by").notNull(),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow()
},t=>[index("game_events_public_idx").on(t.archivedAt,t.startsAt)]);
