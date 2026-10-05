CREATE TABLE "player_collection_sets" (
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "set_code" varchar(12) NOT NULL REFERENCES "game_sets"("code") ON DELETE RESTRICT,
  "started_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "set_code")
);
--> statement-breakpoint
-- Apply this migration inside a transaction; hold writes until backfill and trigger are ready.
LOCK TABLE "owned_cards" IN SHARE ROW EXCLUSIVE MODE;
--> statement-breakpoint
INSERT INTO "player_collection_sets" ("user_id", "set_code", "started_at")
SELECT "user_id", "set_code", min("created_at") FROM "owned_cards"
GROUP BY "user_id", "set_code"
ON CONFLICT ("user_id", "set_code") DO NOTHING;
--> statement-breakpoint
CREATE FUNCTION public.remember_collection_set() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.user_id IS NOT DISTINCT FROM OLD.user_id AND NEW.set_code IS NOT DISTINCT FROM OLD.set_code THEN
      RETURN NEW;
    END IF;
  END IF;
  INSERT INTO public.player_collection_sets (user_id, set_code)
  VALUES (NEW.user_id, NEW.set_code)
  ON CONFLICT (user_id, set_code) DO NOTHING;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER remember_owned_card_set
AFTER INSERT OR UPDATE OF user_id, set_code ON "owned_cards"
FOR EACH ROW EXECUTE FUNCTION public.remember_collection_set();
