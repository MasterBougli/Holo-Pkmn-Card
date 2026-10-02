import { boolean, date, index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

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
