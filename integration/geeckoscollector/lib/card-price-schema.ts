import { sql } from "drizzle-orm";
import { pgTable,text,integer,timestamp,check,uniqueIndex } from "drizzle-orm/pg-core";
import type { PriceScope } from "./card-prices";
import type { AvailableFinish } from "./card-metadata";
export const cardPriceRules=pgTable("card_price_rules",{
 key:text("key").primaryKey(),scope:text("scope").$type<PriceScope>().notNull(),target:text("target").notNull(),
 finish:text("finish").$type<AvailableFinish>().notNull(),coins:integer("coins"),gems:integer("gems"),
 revision:integer("revision").notNull().default(1),updatedBy:text("updated_by").notNull(),updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},table=>[
 uniqueIndex("card_price_rule_target_idx").on(table.scope,table.target,table.finish),
 check("card_price_scope_check",sql.raw("scope IN ('rarity','card')")),
 check("card_price_finish_check",sql.raw("finish IN ('normal','holo','reverse','fullart')")),
 check("card_price_coins_check",sql.raw("coins IS NULL OR coins BETWEEN 0 AND 1000000000")),
 check("card_price_gems_check",sql.raw("gems IS NULL OR gems BETWEEN 0 AND 1000000000")),
 check("card_price_revision_check",sql.raw("revision > 0")),
]);
