CREATE TABLE site_settings (
 id text PRIMARY KEY DEFAULT 'site', maintenance_enabled boolean NOT NULL DEFAULT false,
 maintenance_message text NOT NULL, registrations_enabled boolean NOT NULL DEFAULT true,
 registration_message text NOT NULL, revision integer NOT NULL DEFAULT 1,
 updated_by text, updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT site_settings_singleton CHECK (id = 'site')
);
--> statement-breakpoint
INSERT INTO site_settings(id,maintenance_message,registration_message) VALUES
('site','Le jeu est momentanément en maintenance. Les pages publiques restent accessibles. Reviens bientôt pour continuer ta collection.',
'Les inscriptions sont momentanément fermées. Les comptes existants peuvent toujours se connecter.');
