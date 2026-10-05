CREATE TABLE IF NOT EXISTS "holo_profiles" (
 "set_code" varchar(12) NOT NULL REFERENCES "game_sets"("code") ON DELETE CASCADE,
 "card_id" text NOT NULL DEFAULT '',
 "settings" jsonb NOT NULL DEFAULT '{}'::jsonb,
 "updated_by" text NOT NULL,
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY ("set_code","card_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "holo_profile_history" (
 "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 "set_code" varchar(12) NOT NULL,
 "card_id" text NOT NULL DEFAULT '',
 "previous" jsonb,
 "settings" jsonb NOT NULL,
 "actor_id" text NOT NULL,
 "created_at" timestamptz NOT NULL DEFAULT now()
);
