CREATE TABLE "collection_reward_configs" (
  "set_code" varchar(12) PRIMARY KEY REFERENCES "game_sets"("code") ON DELETE RESTRICT,
  "enabled" boolean NOT NULL DEFAULT false,
  "rewards" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "revision" integer NOT NULL DEFAULT 1,
  "updated_by" text NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "collection_reward_config_valid" CHECK (
    jsonb_typeof("rewards") = 'array' AND jsonb_array_length("rewards") <= 20
    AND (NOT "enabled" OR jsonb_array_length("rewards") > 0) AND "revision" > 0
  )
);
