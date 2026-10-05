CREATE TABLE "collection_reward_claims" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "set_code" varchar(12) NOT NULL REFERENCES "game_sets"("code") ON DELETE RESTRICT,
  "config_revision" integer NOT NULL,
  "rewards" jsonb NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "collection_reward_claim_valid" CHECK (
    "config_revision" > 0 AND jsonb_typeof("rewards") = 'array'
    AND jsonb_array_length("rewards") BETWEEN 1 AND 20
  )
);
--> statement-breakpoint
CREATE UNIQUE INDEX "collection_reward_once_idx" ON "collection_reward_claims" ("user_id", "set_code");
