import { asc, eq } from "drizzle-orm";
import { db } from "./db";
import { collectionRewardConfigs } from "./collection-reward-schema";
import { gameSets } from "./catalogue-schema";
import { getCatalogueSetData } from "./catalogue";
import { adminAudit } from "./admin-schema";
import { AdminError, lockAdminAccess } from "./admin-authorisation";
import { validEventRewards } from "./event-types";
import type { CollectionRewardConfig } from "./collection-reward-types";
type Connection = Pick<typeof db, "select">;
const validCode = (v: unknown): v is string => typeof v === "string" && /^[A-Z0-9.-]{1,12}$/.test(v);
export async function collectionRewardSets() {
  return db.select({ code: gameSets.code, name: gameSets.name }).from(gameSets).orderBy(asc(gameSets.code));
}
export async function getCollectionRewardConfig(code: string, connection: Connection = db): Promise<CollectionRewardConfig> {
  if (!validCode(code)) throw new AdminError("Set invalide.", 400);
  const [set] = await connection.select({ code: gameSets.code }).from(gameSets).where(eq(gameSets.code, code)).limit(1);
  if (!set) throw new AdminError("Set introuvable.", 404);
  const [row] = await connection.select().from(collectionRewardConfigs).where(eq(collectionRewardConfigs.setCode, code)).limit(1);
  return { setCode: code, enabled: row?.enabled ?? false, rewards: row?.rewards ?? [], revision: row?.revision ?? 0 };
}
export async function saveCollectionRewardConfig(actor: { id: string; username?: string | null; name: string }, body: Record<string, unknown>) {
  const { setCode, enabled, rewards, revision } = body;
  if (!validCode(setCode) || typeof enabled !== "boolean" || !validEventRewards(rewards) || !Number.isSafeInteger(revision) || Number(revision) < 0 || (enabled && !rewards.length))
    throw new AdminError("Configuration invalide. Complète les récompenses et leurs quantités.", 400);
  return db.transaction(async tx => {
    await lockAdminAccess(tx, actor.id, "collectionRewards.edit");
    const previous = await getCollectionRewardConfig(setCode, tx);
    if (previous.revision !== revision) throw new AdminError("Cette configuration a changé. Recharge avant d’enregistrer.", 409);
    for (const code of new Set(rewards.filter(r => r.kind === "card" || r.kind === "booster").map(r => r.setCode))) {
      const set = await getCatalogueSetData(code, tx);
      if (!set) throw new AdminError("Un set de récompense est introuvable.", 400);
      if (rewards.some(r => r.kind === "card" && r.setCode === code && !set.cards.some(c => c.id === r.cardId)))
        throw new AdminError("Une carte de récompense n’appartient pas au set choisi.", 400);
    }
    const normalized = rewards.map(r => ({ id: r.id, kind: r.kind, quantity: r.quantity,
      setCode: r.kind === "card" || r.kind === "booster" ? r.setCode : "", cardId: r.kind === "card" ? r.cardId : "" }));
    const next = { setCode, enabled, rewards: normalized, revision: Number(revision) + 1 };
    const value = { ...next, updatedBy: actor.id, updatedAt: new Date() };
    await tx.insert(collectionRewardConfigs).values(value).onConflictDoUpdate({ target: collectionRewardConfigs.setCode, set: value });
    await tx.insert(adminAudit).values({ actorId: actor.id, actorName: actor.username ?? actor.name,
      action: "collectionRewards.configure", targetName: setCode, before: previous, after: next });
    return next;
  });
}
