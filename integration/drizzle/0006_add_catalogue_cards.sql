CREATE TABLE "catalogue_cards" (
 "id" text PRIMARY KEY NOT NULL,
 "set_code" varchar(12) NOT NULL REFERENCES "game_sets"("code") ON DELETE RESTRICT,
 "name" text DEFAULT '' NOT NULL,
 "local_id" text DEFAULT '' NOT NULL,
 "rarity" text DEFAULT '' NOT NULL,
 "illustrator" text DEFAULT '' NOT NULL,
 "finishes" jsonb DEFAULT '[]'::jsonb NOT NULL,
 "details" jsonb,
 "source" text DEFAULT 'manual' NOT NULL,
 "revision" integer DEFAULT 1 NOT NULL,
 "updated_by" text NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "catalogue_cards_set_idx" ON "catalogue_cards" ("set_code");
