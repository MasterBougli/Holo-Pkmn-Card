import { and, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { ownedCards } from "./booster-schema";
import { AdminError } from "./admin-authorisation";

/** Current owned copies, including defects and all acquisition sources. */
export async function cardCirculation(setCode: string, cardId: string) {
  if (!/^[A-Z0-9.-]{1,12}$/.test(setCode) || !cardId || cardId.length > 100) {
    throw new AdminError("Carte invalide.", 400);
  }
  const [row] = await db
    .select({ total: sql<string>`count(*)::text` })
    .from(ownedCards)
    .where(and(eq(ownedCards.setCode, setCode), eq(ownedCards.cardId, cardId)));
  return { total: row.total };
}
