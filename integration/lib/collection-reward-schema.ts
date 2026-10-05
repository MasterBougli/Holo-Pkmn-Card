import { pgTable, varchar, boolean, jsonb, integer, text, timestamp, check, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { gameSets } from "./catalogue-schema";
import { user } from "./auth-schema";
import type { EventReward } from "./event-types";
export const collectionRewardConfigs = pgTable("collection_reward_configs", {
  setCode: varchar("set_code", { length: 12 }).primaryKey().references(() => gameSets.code, { onDelete: "restrict" }),
  enabled: boolean("enabled").notNull().default(false),
  rewards: jsonb("rewards").$type<EventReward[]>().notNull().default([]),
  revision: integer("revision").notNull().default(1),
  updatedBy: text("updated_by").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [check("collection_reward_config_valid", sql`jsonb_typeof(${t.rewards}) = 'array' AND jsonb_array_length(${t.rewards}) <= 20 AND (NOT ${t.enabled} OR jsonb_array_length(${t.rewards}) > 0) AND ${t.revision} > 0`)]);

export const collectionRewardClaims = pgTable("collection_reward_claims", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  setCode: varchar("set_code", { length: 12 }).notNull().references(() => gameSets.code, { onDelete: "restrict" }),
  configRevision: integer("config_revision").notNull(),
  rewards: jsonb("rewards").$type<EventReward[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [uniqueIndex("collection_reward_once_idx").on(t.userId, t.setCode), check("collection_reward_claim_valid", sql`${t.configRevision} > 0 AND jsonb_typeof(${t.rewards}) = 'array' AND jsonb_array_length(${t.rewards}) BETWEEN 1 AND 20`)]);
