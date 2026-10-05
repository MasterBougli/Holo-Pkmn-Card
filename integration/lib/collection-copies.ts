import { and, asc, count, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { ownedCards } from "./booster-schema";
import { collectionGroupKey, collectionWhere } from "./collection-query";
import { sharedCard, visibleCollectionOwner } from "./shared-collection";
import { AdminError } from "./admin-authorisation";
import { newsUuid } from "./news-types";
import type { CollectionFilters } from "./collection-filters";

export async function collectionCopies(viewerId: string, anchorId: string, page: number, filters: CollectionFilters, pseudo?: string) {
  if (pseudo && filters.favorites) throw new AdminError("Les favoris sont privés.", 400);
  if (!newsUuid(anchorId)) throw new AdminError("Exemplaire invalide.", 400);
  return db.transaction(async tx => {
    const ownerId = pseudo ? (await visibleCollectionOwner(pseudo, tx)).id : viewerId;
    const key = collectionGroupKey();
    const [anchor] = await tx.select({ key }).from(ownedCards)
      .where(and(eq(ownedCards.userId, ownerId), eq(ownedCards.id, anchorId))).limit(1);
    if (!anchor) throw new AdminError("Cet exemplaire n’est pas accessible.", 404);
    const where = and(collectionWhere(ownerId, filters), sql`${key} = ${anchor.key}`);
    const rows = await tx.select({ id: ownedCards.id, card: ownedCards.snapshot, createdAt: ownedCards.createdAt }).from(ownedCards)
      .where(where).orderBy(asc(ownedCards.id)).limit(6).offset(page * 6);
    const [total] = await tx.select({ value: count() }).from(ownedCards).where(where);
    return { copies: rows.map(row => ({ card: pseudo ? sharedCard(row.id, row.card) : { ...row.card, id: row.id }, createdAt: row.createdAt })), total: total.value };
  });
}
