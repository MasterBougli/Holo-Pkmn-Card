import { sql } from "drizzle-orm";
import { check, boolean, jsonb, date, index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const gameSets = pgTable("game_sets", {
  code: varchar("code", { length: 12 }).primaryKey(),
  name: text("name").notNull(),
  seriesName: text("series_name").notNull().default(""),
  releaseDate: date("release_date", { mode: "string" }),
  officialCardCount: integer("official_card_count").notNull().default(0),
  totalCardCount: integer("total_card_count").notNull().default(0),
  active: boolean("active").notNull().default(false),
  revision: integer("revision").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("game_sets_active_idx").on(table.active)]);


// Only exceptions are persisted; an absent row means the card follows its set.
export const cardAvailability = pgTable("card_availability", {
 cardId: text("card_id").primaryKey(),
 setCode: varchar("set_code", {length:12}).notNull().references(()=>gameSets.code,{onDelete:"restrict"}),
 excluded: boolean("excluded").notNull().default(false),
 revision: integer("revision").notNull().default(1),
 updatedAt: timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},table=>[index("card_availability_set_idx").on(table.setCode)]);

export const catalogueCards=pgTable("catalogue_cards",{
 id:text("id").primaryKey(),
 setCode:varchar("set_code",{length:12}).notNull().references(()=>gameSets.code,{onDelete:"restrict"}),
 name:text("name").notNull().default(""),
 localId:text("local_id").notNull().default(""),
 rarity:text("rarity").notNull().default(""),
 illustrator:text("illustrator").notNull().default(""),
 finishes:jsonb("finishes").$type<import("./card-metadata").AvailableFinish[]>().notNull().default([]),
 details:jsonb("details").$type<Record<string,unknown>>(),
 source:text("source").notNull().default("manual"),
 revision:integer("revision").notNull().default(1),
 updatedBy:text("updated_by").notNull(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},table=>[index("catalogue_cards_set_idx").on(table.setCode),check("catalogue_card_single_finish",sql`jsonb_typeof(${table.finishes}) = 'array' and jsonb_array_length(${table.finishes}) <= 1 and (jsonb_array_length(${table.finishes}) = 0 or ${table.finishes}->>0 in ('normal','holo','reverse','fullart'))`)]);
