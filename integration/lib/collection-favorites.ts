import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { ownedCards } from "./booster-schema";
import { AdminError } from "./admin-authorisation";
import { newsUuid } from "./news-types";

export async function collectionFavorite(userId: string, id: string, value?: unknown) {
  if (!newsUuid(id)) throw new AdminError("Exemplaire invalide.", 400);
  const where = and(eq(ownedCards.userId, userId), eq(ownedCards.id, id));
  if (value !== undefined && typeof value !== "boolean") throw new AdminError("Favori invalide.", 400);
  const rows = value === undefined
    ? await db.select({ favorite: ownedCards.favorite }).from(ownedCards).where(where).limit(1)
    : await db.update(ownedCards).set({ favorite: value as boolean }).where(where).returning({ favorite: ownedCards.favorite });
  if (!rows[0]) throw new AdminError("Cet exemplaire n’est pas accessible.", 404);
  return rows[0];
}
