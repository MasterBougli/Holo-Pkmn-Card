import { eq } from "drizzle-orm";
import { db } from "./db";
import { collectionSettings } from "./player-schema";
import { AdminError } from "./admin-authorisation";

export async function collectionPrivacy(userId: string) {
  const [setting] = await db.select({ visibility: collectionSettings.visibility })
    .from(collectionSettings).where(eq(collectionSettings.userId, userId)).limit(1);
  return { visibility: setting?.visibility ?? "private" };
}

export async function saveCollectionPrivacy(userId: string, value: unknown) {
  if (value !== "public" && value !== "private") {
    throw new AdminError("Choisis une visibilité pour ta collection.", 400);
  }
  await db.insert(collectionSettings).values({ userId, visibility: value })
    .onConflictDoUpdate({ target: collectionSettings.userId, set: { visibility: value, updatedAt: new Date() } });
  return { visibility: value };
}
