CREATE TABLE IF NOT EXISTS news_articles (
id text PRIMARY KEY, slug text NOT NULL UNIQUE, draft jsonb NOT NULL, published jsonb, published_at timestamptz,
scheduled jsonb, scheduled_at timestamptz, archived_at timestamptz, revision integer NOT NULL DEFAULT 1,
created_by text NOT NULL, updated_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS news_visible_idx ON news_articles(archived_at,scheduled_at,published_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS news_versions (id text PRIMARY KEY,article_id text NOT NULL REFERENCES news_articles(id),revision integer NOT NULL,content jsonb NOT NULL,action text NOT NULL,actor_id text NOT NULL,actor_name text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS news_versions_article_idx ON news_versions(article_id,revision);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS news_media (id text PRIMARY KEY,filename text NOT NULL,name text NOT NULL,alt text NOT NULL,width integer NOT NULL,height integer NOT NULL,created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
