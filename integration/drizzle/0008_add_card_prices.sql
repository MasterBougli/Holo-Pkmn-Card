CREATE TABLE "card_price_rules" (
 "key" text PRIMARY KEY NOT NULL,
 "scope" text NOT NULL,
 "target" text NOT NULL,
 "finish" text NOT NULL,
 "coins" integer,
 "gems" integer,
 "revision" integer DEFAULT 1 NOT NULL,
 "updated_by" text NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
 CONSTRAINT "card_price_scope_check" CHECK (scope IN ('rarity','card')),
 CONSTRAINT "card_price_finish_check" CHECK (finish IN ('normal','holo','reverse','fullart')),
 CONSTRAINT "card_price_coins_check" CHECK (coins IS NULL OR coins BETWEEN 0 AND 1000000000),
 CONSTRAINT "card_price_gems_check" CHECK (gems IS NULL OR gems BETWEEN 0 AND 1000000000),
 CONSTRAINT "card_price_revision_check" CHECK (revision > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "card_price_rule_target_idx" ON "card_price_rules" ("scope","target","finish");
