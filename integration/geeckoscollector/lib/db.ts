import { gameRarities } from "./rarity-schema";
import * as boosterSchema from "@/lib/booster-schema";
import * as importSchema from "@/lib/catalogue-import-schema";
import { cardPriceRules } from "@/lib/card-price-schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as authSchema from "@/lib/auth-schema";
import { playerPreferences } from "@/lib/player-schema";
import { holoProfiles,holoProfileHistory } from "@/lib/holo-schema";
import * as adminSchema from "@/lib/admin-schema";
import { siteSettings } from "@/lib/site-schema";
import { gameSets,cardAvailability,catalogueCards } from "@/lib/catalogue-schema";

if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL doit être renseignée en production.");
}
const connectionString = process.env.DATABASE_URL ?? "postgresql://geeckos:geeckos_dev@127.0.0.1:5433/geeckoscollector";
const globalForDb = globalThis as unknown as { pool?: Pool };
const pool = globalForDb.pool ?? new Pool({ connectionString, max: 10 });
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema: { gameRarities,...boosterSchema,cardPriceRules, ...importSchema,...authSchema, ...adminSchema, siteSettings, playerPreferences, gameSets,cardAvailability,catalogueCards, holoProfiles,holoProfileHistory } });
