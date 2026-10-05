CREATE TABLE IF NOT EXISTS "event_claims" (
 "id" text PRIMARY KEY NOT NULL, "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
 "event_id" text NOT NULL REFERENCES "game_events"("id") ON DELETE RESTRICT, "target" text NOT NULL,
 "rewards" jsonb NOT NULL, "outcome" jsonb NOT NULL, "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "event_claim_once_idx" ON "event_claims" ("user_id","event_id","target");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "player_wallets" (
 "user_id" text PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
 "coins" bigint DEFAULT 0 NOT NULL, "gems" bigint DEFAULT 0 NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "player_wallet_nonnegative" CHECK ("coins" >= 0 AND "gems" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wallet_entries" (
 "id" text PRIMARY KEY NOT NULL, "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
 "claim_id" text NOT NULL REFERENCES "event_claims"("id") ON DELETE CASCADE, "coins" bigint NOT NULL,
 "gems" bigint NOT NULL, "created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "wallet_entry_claim_once_idx" ON "wallet_entries" ("claim_id");
--> statement-breakpoint
ALTER TABLE "owned_cards" ALTER COLUMN "booster_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "owned_cards" ADD COLUMN IF NOT EXISTS "acquisition_source" text DEFAULT 'booster' NOT NULL;
--> statement-breakpoint
ALTER TABLE "owned_cards" ADD COLUMN IF NOT EXISTS "reward_claim_id" text REFERENCES "event_claims"("id") ON DELETE CASCADE;
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='owned_cards_provenance' AND conrelid='owned_cards'::regclass) THEN
  ALTER TABLE "owned_cards" ADD CONSTRAINT "owned_cards_provenance" CHECK (
   ("acquisition_source"='booster' AND "booster_id" IS NOT NULL AND "reward_claim_id" IS NULL)
   OR ("acquisition_source"='event_reward' AND "booster_id" IS NULL AND "reward_claim_id" IS NOT NULL)
  );
 END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "owned_cards_reward_position_idx" ON "owned_cards" ("reward_claim_id","position");
