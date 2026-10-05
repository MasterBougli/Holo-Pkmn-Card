import { NextResponse } from "next/server";
import { getAdminSession, AdminError } from "@/lib/admin-access";
import { adminBody, adminFailure } from "@/lib/admin-http";
import { collectionRewardSets, getCollectionRewardConfig, saveCollectionRewardConfig } from "@/lib/collection-reward-management";
import { getCatalogueSetData } from "@/lib/catalogue";
const options = { headers: { "Cache-Control": "private, no-store" } };
export async function GET(request: Request) {
  try {
    if (!await getAdminSession("collectionRewards.read")) throw new AdminError("Permission insuffisante.");
    const p = new URL(request.url).searchParams;
    if (p.has("cards")) {
      const code = p.get("cards") ?? "";
      if (!/^[A-Z0-9.-]{1,12}$/.test(code)) throw new AdminError("Set invalide.", 400);
      const set = await getCatalogueSetData(code); if (!set) throw new AdminError("Set introuvable.", 404);
      return NextResponse.json({ cards: set.cards }, options);
    }
    if (p.has("set")) return NextResponse.json(await getCollectionRewardConfig(p.get("set") ?? ""), options);
    return NextResponse.json({ sets: await collectionRewardSets() }, options);
  } catch (error) { return adminFailure(error); }
}
export async function PUT(request: Request) {
  try {
    const session = await getAdminSession("collectionRewards.edit"); if (!session) throw new AdminError("Permission insuffisante.");
    return NextResponse.json(await saveCollectionRewardConfig(session.user, await adminBody(request)), options);
  } catch (error) { return adminFailure(error); }
}
