import { asc, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { ownedCards } from "./booster-schema";
import { gameSets, catalogueCards } from "./catalogue-schema";
import { playerCollectionSets } from "./player-schema";
import catalogue from "./catalogue-data.json";
import type { CollectionSetProgress } from "./collection-progress-types";

type Connection = Pick<typeof db, "select" | "selectDistinct">;
export async function collectionProgress(userId: string, connection: Connection = db): Promise<CollectionSetProgress[]> {
  // Current inventory only, not historical discoveries. No collection filters here:
  // progress describes the entire authorized owner's collection.
  const owned = await connection.selectDistinct({ code: ownedCards.setCode, cardId: ownedCards.cardId,
    name: gameSets.name, active: gameSets.active, total: gameSets.totalCardCount })
    .from(ownedCards).innerJoin(gameSets, eq(gameSets.code, ownedCards.setCode))
    .where(eq(ownedCards.userId, userId)).orderBy(asc(ownedCards.setCode), asc(ownedCards.cardId));
  const started = await connection.select({ code: gameSets.code, name: gameSets.name, active: gameSets.active, total: gameSets.totalCardCount })
    .from(playerCollectionSets).innerJoin(gameSets, eq(gameSets.code, playerCollectionSets.setCode))
    .where(eq(playerCollectionSets.userId, userId));
  // Include current cards as a fallback, while remembered starts keep empty sets visible.
  const sets = new Map([...started, ...owned].map(s => [s.code, s]));
  const codes = [...sets.keys()].sort();
  if (!codes.length) return [];
  const imported = await connection.select({ code: catalogueCards.setCode, id: catalogueCards.id }).from(catalogueCards)
    .where(inArray(catalogueCards.setCode, codes));
  const lists = new Map(codes.map(code => [code, new Set((catalogue.sets.find(s => s.code === code)?.cards ?? []).map(c => c.id))]));
  for (const card of imported) lists.get(card.code)?.add(card.id);
  const summaries = new Map<string, CollectionSetProgress>();
  for (const code of codes) {
    const set = sets.get(code)!, ids = lists.get(code)!;
    const total = Math.max(set.total, ids.size);
    summaries.set(code, { code, name: set.name, active: set.active, obtained: 0, total,
      catalogueMissing: Math.max(0, total - ids.size), unlistedOwned: 0 });
  }
  for (const card of owned) {
    const ids = lists.get(card.code)!, summary = summaries.get(card.code)!;
    if (ids.has(card.cardId)) summary.obtained++; else summary.unlistedOwned++;
  }
  return [...summaries.values()];
}
