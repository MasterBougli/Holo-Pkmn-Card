CREATE TABLE admin_roles (
 id text PRIMARY KEY, name text NOT NULL, description text NOT NULL DEFAULT '',
 permissions jsonb NOT NULL DEFAULT '[]'::jsonb, revision integer NOT NULL DEFAULT 1,
 archived_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX admin_roles_name_unique ON admin_roles (lower(name));
--> statement-breakpoint
CREATE TABLE admin_user_roles (
 user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 role_id text NOT NULL REFERENCES admin_roles(id) ON DELETE RESTRICT,
 assigned_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,role_id)
);
--> statement-breakpoint
CREATE INDEX admin_user_roles_role_idx ON admin_user_roles(role_id);
--> statement-breakpoint
CREATE TABLE admin_audit (
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, actor_id text NOT NULL, actor_name text NOT NULL,
 action text NOT NULL, target_name text NOT NULL, before jsonb, after jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX admin_audit_created_idx ON admin_audit(created_at);
--> statement-breakpoint
INSERT INTO admin_roles(id,name,description,permissions) VALUES
('initial-administrator','Administrateur','Gestion complète, sans statut de superadministrateur.','["admin.access", "audit.read", "roles.read", "roles.create", "roles.edit", "roles.delete", "roles.assign", "users.read", "holo.read", "holo.edit", "config.read", "config.edit", "catalogue.read", "catalogue.create", "catalogue.edit", "catalogue.delete", "catalogue.activate", "catalogue.import", "news.read", "news.create", "news.edit", "news.delete", "news.publish", "events.read", "events.create", "events.edit", "events.delete", "events.publish", "economy.read", "economy.edit", "boosters.read", "boosters.create", "boosters.edit", "boosters.delete", "users.edit", "users.moderate"]'::jsonb),
('initial-moderator','Modérateur','Consultation des comptes et journal ; modération lors de l’ouverture du module.','["admin.access", "users.read", "users.moderate", "audit.read"]'::jsonb),
('initial-editor','Rédacteur','Rédaction et publication des actualités lors de l’ouverture du CMS.','["admin.access", "news.read", "news.create", "news.edit", "news.delete", "news.publish"]'::jsonb);
