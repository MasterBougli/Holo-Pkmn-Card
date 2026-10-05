import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { user } from "./auth-schema";
import { collectionSettings } from "./player-schema";
import { collectionData } from "./collection-query";
import { emptyCollectionFilters, type CollectionFilters } from "./collection-filters";
import { AdminError } from "./admin-authorisation";
import type { CollectionCard, OwnedCard } from "./booster-types";

export async function visibleCollectionOwner(pseudo: string, connection: Pick<typeof db, "select">) {
  if (!/^[A-Za-z0-9]{4,16}$/.test(pseudo)) throw new AdminError("Cette collection n’est pas accessible.", 404);
  const [owner] = await connection.select({ id: user.id, pseudo: user.displayUsername, username: user.username })
    .from(user).innerJoin(collectionSettings, eq(collectionSettings.userId, user.id))
    .where(and(eq(user.username, pseudo.toLowerCase()), eq(user.emailVerified, true), eq(collectionSettings.visibility, "public")))
    .limit(1).for("share", { of: collectionSettings });
  if (!owner) throw new AdminError("Cette collection n’est pas accessible.", 404);
  return owner;
}
export function sharedCard(id: string, c: OwnedCard): OwnedCard {
  return { id, cardId: c.cardId, setCode: c.setCode, setName: c.setName, name: c.name,
    localId: c.localId, max: c.max, rarity: c.rarity, illustrator: c.illustrator,
    finish: c.finish, defects: c.defects, position: c.position, isNew: false };
}

export async function sharedCollection(pseudo: string, page = 0, filters: CollectionFilters = emptyCollectionFilters) {
  if (filters.favorites) throw new AdminError("Les favoris sont privés.", 400);
  if (!/^[A-Za-z0-9]{4,16}$/.test(pseudo)) throw new AdminError("Cette collection n’est pas accessible.", 404);
  return db.transaction(async tx => {
    // Lock visibility until this read finishes: a private setting never authorizes a new read.
    const owner = await visibleCollectionOwner(pseudo, tx);
    const { rows, total, groupsTotal, options, progress } = await collectionData(owner.id, page, filters, tx);
    const cards: CollectionCard[] = rows.map(({ id, snapshot: c, quantity }) => ({ ...sharedCard(id, c), quantity }));
    return { pseudo: owner.pseudo ?? owner.username, cards, total, groupsTotal, options, progress };
  });
}
