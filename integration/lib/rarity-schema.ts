import { pgTable,text,jsonb,integer,timestamp,uniqueIndex } from "drizzle-orm/pg-core";
export const gameRarities=pgTable("game_rarities",{
 id:text("id").primaryKey(),name:text("name").notNull(),key:text("key").notNull(),
 aliases:jsonb("aliases").$type<string[]>().notNull().default([]),revision:integer("revision").notNull().default(1),
 updatedBy:text("updated_by"),updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[uniqueIndex("game_rarities_key_idx").on(t.key)]);
