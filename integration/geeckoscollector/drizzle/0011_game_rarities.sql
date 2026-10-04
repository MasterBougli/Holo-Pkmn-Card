CREATE TABLE "game_rarities" (
 "id" text PRIMARY KEY NOT NULL,
 "name" text NOT NULL,
 "key" text NOT NULL,
 "aliases" jsonb DEFAULT '[]'::jsonb NOT NULL,
 "revision" integer DEFAULT 1 NOT NULL,
 "updated_by" text,
 "updated_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "game_rarities_aliases_array" CHECK (jsonb_typeof("aliases") = 'array'),
 CONSTRAINT "game_rarities_revision_positive" CHECK ("revision" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "game_rarities_key_idx" ON "game_rarities" ("key");
