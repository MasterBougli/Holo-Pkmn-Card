INSERT INTO admin_audit(actor_id,actor_name,action,target_name,before,after)
SELECT 'migration','Migration finition unique','catalogue.metadata',name || ' · ' || set_code,
jsonb_build_object('cardMetadata',jsonb_build_object('name',name,'localId',local_id,'rarity',rarity,'illustrator',illustrator,'finishes',finishes)),
jsonb_build_object('reason','Finitions ambiguës : choix manuel requis','cardMetadata',jsonb_build_object('name',name,'localId',local_id,'rarity',rarity,'illustrator',illustrator,'finishes','[]'::jsonb))
FROM catalogue_cards WHERE jsonb_array_length(finishes)>1;
--> statement-breakpoint
UPDATE catalogue_cards SET finishes='[]'::jsonb,revision=revision+1,updated_at=now() WHERE jsonb_array_length(finishes)>1;
--> statement-breakpoint
ALTER TABLE catalogue_cards ADD CONSTRAINT catalogue_card_single_finish CHECK(jsonb_typeof(finishes)='array' AND jsonb_array_length(finishes)<=1 AND (jsonb_array_length(finishes)=0 OR finishes->>0 IN ('normal','holo','reverse','fullart')));
--> statement-breakpoint
CREATE TABLE booster_configs(set_code varchar(12) PRIMARY KEY REFERENCES game_sets(code),composition jsonb NOT NULL,revision integer NOT NULL DEFAULT 1,updated_by text NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
--> statement-breakpoint
CREATE TABLE booster_grants(id text PRIMARY KEY,actor_id text NOT NULL,user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,set_code varchar(12) NOT NULL REFERENCES game_sets(code),quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 100),reason text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
--> statement-breakpoint
CREATE TABLE player_boosters(id text PRIMARY KEY,user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,grant_id text NOT NULL REFERENCES booster_grants(id) ON DELETE CASCADE,set_code varchar(12) NOT NULL REFERENCES game_sets(code),opened_at timestamptz,composition jsonb,config_revision integer,created_at timestamptz NOT NULL DEFAULT now());
--> statement-breakpoint
CREATE INDEX player_boosters_user_idx ON player_boosters(user_id,created_at);
--> statement-breakpoint
CREATE TABLE owned_cards(id text PRIMARY KEY,user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,booster_id text NOT NULL REFERENCES player_boosters(id) ON DELETE CASCADE,card_id text NOT NULL,set_code varchar(12) NOT NULL REFERENCES game_sets(code),position integer NOT NULL,snapshot jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
--> statement-breakpoint
CREATE UNIQUE INDEX owned_cards_booster_position ON owned_cards(booster_id,position);
--> statement-breakpoint
CREATE INDEX owned_cards_user_idx ON owned_cards(user_id,created_at);
--> statement-breakpoint
CREATE INDEX owned_cards_user_card_idx ON owned_cards(user_id,card_id);
