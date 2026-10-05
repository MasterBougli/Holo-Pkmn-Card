import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { ownedCards } from "./booster-schema";
import { getCatalogueSetData } from "./catalogue";
import { visibleCollectionOwner } from "./shared-collection";
import { AdminError } from "./admin-authorisation";

export async function collectionMissing(viewerId: string, code: string, requestedPage: number, pseudo?: string) {
  if (!/^[A-Z0-9.-]{1,12}$/.test(code)) throw new AdminError("Set invalide.", 400);
  return db.transaction(async tx => {
    const ownerId = pseudo ? (await visibleCollectionOwner(pseudo, tx)).id : viewerId;
    const set = await getCatalogueSetData(code, tx);
    if (!set) throw new AdminError("Set introuvable.", 404);
    const rows = await tx.selectDistinct({ id: ownedCards.cardId }).from(ownedCards)
      .where(and(eq(ownedCards.userId, ownerId), eq(ownedCards.setCode, set.code)));
    const obtained = new Set(rows.map(row => row.id));
    // Current ownership satisfies an entry; after the last copy leaves, it becomes missing again.
    // Finish, defects and favorite status do not affect that ownership check.
    const missing = set.cards.filter(card => !obtained.has(card.id));
    const page = Math.min(requestedPage, Math.max(0, Math.ceil(missing.length / 24) - 1));
    return { set: { code: set.code, name: set.name }, cards: missing.slice(page * 24, (page + 1) * 24),
      total: missing.length, page, catalogueMissing: Math.max(0, set.totalCount - set.cards.length) };
  });
}
