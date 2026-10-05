import { pgTable, text, jsonb, timestamp, check, primaryKey, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "@/lib/auth-schema";
import { gameSets } from "./catalogue-schema";

export type AccessibilityPreferences = {
  theme: "clair" | "sombre";
  colorAid: "aucune" | "rouge-vert" | "bleu-jaune" | "monochrome";
  contrast: "standard" | "renforce";
  textSize: "petit" | "normal" | "grand" | "tres-grand";
  font: "systeme" | "atkinson" | "inclusive" | "open-dyslexic";
  motion: "systeme" | "normal" | "reduites" | "desactivees";
};

export const playerPreferences = pgTable("player_preferences", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  accessibility: jsonb("accessibility").$type<AccessibilityPreferences>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const collectionSettings = pgTable("collection_settings", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  visibility: text("visibility").$type<"public" | "private">().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, table => [check("collection_settings_visibility", sql`${table.visibility} IN ('public', 'private')`)]);

// Remember only that this set was started, never which cards used to be owned.
export const playerCollectionSets = pgTable("player_collection_sets", {
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  setCode: varchar("set_code", { length: 12 }).notNull().references(() => gameSets.code, { onDelete: "restrict" }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [primaryKey({ columns: [table.userId, table.setCode] })]);
