import { and, asc, eq, ilike } from "drizzle-orm";
import { db } from "./db";
import { user } from "./auth-schema";
import { collectionSettings } from "./player-schema";
import { AdminError } from "./admin-authorisation";

export async function searchCollections(query: string) {
  const q = query.trim();
  if (!/^[A-Za-z0-9]{2,16}$/.test(q)) throw new AdminError("Saisis 2 à 16 lettres ou chiffres du pseudo.", 400);
  const rows = await db.select({ username: user.username, pseudo: user.displayUsername })
    .from(user).innerJoin(collectionSettings, eq(collectionSettings.userId, user.id))
    .where(and(eq(user.emailVerified, true), eq(collectionSettings.visibility, "public"), ilike(user.username, "%" + q + "%")))
    .orderBy(asc(user.username)).limit(21);
  return { players: rows.slice(0, 20).map(row => ({ username: row.username!, pseudo: row.pseudo ?? row.username! })), more: rows.length > 20 };
}
