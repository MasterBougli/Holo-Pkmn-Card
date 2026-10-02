ALTER TABLE "game_sets" ADD COLUMN "revision" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
CREATE TABLE "card_availability" (
 "card_id" text PRIMARY KEY NOT NULL,
 "set_code" varchar(12) NOT NULL REFERENCES "game_sets"("code") ON DELETE RESTRICT,
 "excluded" boolean DEFAULT false NOT NULL,
 "revision" integer DEFAULT 1 NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "card_availability_set_idx" ON "card_availability" ("set_code");
