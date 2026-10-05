CREATE TABLE IF NOT EXISTS "collection_settings" (
 "user_id" text PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
 "visibility" text NOT NULL,
 "updated_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "collection_settings_visibility" CHECK ("visibility" IN ('public', 'private'))
);
