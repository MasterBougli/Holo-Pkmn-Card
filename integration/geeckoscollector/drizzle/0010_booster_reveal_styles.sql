ALTER TABLE "site_settings" ADD COLUMN "booster_reveal_styles" jsonb NOT NULL DEFAULT '{}'::jsonb;
--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "booster_reveal_revision" integer NOT NULL DEFAULT 1;
