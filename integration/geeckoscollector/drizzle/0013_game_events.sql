CREATE TABLE IF NOT EXISTS "game_events" (
 "id" text PRIMARY KEY NOT NULL, "draft" jsonb NOT NULL, "published" jsonb,
 "starts_at" timestamptz, "ends_at" timestamptz, "revision" integer DEFAULT 1 NOT NULL,
 "archived_at" timestamptz, "created_by" text NOT NULL, "updated_by" text NOT NULL,
 "created_at" timestamptz DEFAULT now() NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "game_events_public_idx" ON "game_events" ("archived_at","starts_at");
