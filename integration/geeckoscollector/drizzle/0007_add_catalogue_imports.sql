CREATE TABLE catalogue_import_jobs (id text PRIMARY KEY, kind text NOT NULL, status text NOT NULL DEFAULT 'queued', actor_id text, actor_name text NOT NULL, payload jsonb, summary text NOT NULL DEFAULT '', progress integer NOT NULL DEFAULT 0, total integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz);
--> statement-breakpoint
CREATE INDEX catalogue_jobs_created_idx ON catalogue_import_jobs(created_at);
--> statement-breakpoint
CREATE TABLE catalogue_discovery_items(report_id text NOT NULL REFERENCES catalogue_import_jobs(id) ON DELETE RESTRICT, source_code text NOT NULL, data jsonb NOT NULL, PRIMARY KEY(report_id,source_code));
--> statement-breakpoint
CREATE TABLE catalogue_import_schedule(id integer PRIMARY KEY, weekday integer NOT NULL DEFAULT 1, hour integer NOT NULL DEFAULT 4, next_run timestamptz NOT NULL, heartbeat timestamptz);
--> statement-breakpoint
CREATE TABLE catalogue_import_mappings(source_code text PRIMARY KEY, local_code text NOT NULL, tcgdex_id text NOT NULL DEFAULT '', updated_by text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
