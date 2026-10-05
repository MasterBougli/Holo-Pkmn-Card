import { NextResponse } from "next/server";
import { playerGameSession } from "@/lib/player-game-session";
import { collectionPrivacy, saveCollectionPrivacy } from "@/lib/collection-privacy";
import { adminBody, adminFailure } from "@/lib/admin-http";

const response = (value: unknown) => NextResponse.json(value, { headers: { "Cache-Control": "private, no-store" } });
export async function GET() {
  try {
    const session = await playerGameSession();
    return response(await collectionPrivacy(session.user.id));
  } catch (error) { return adminFailure(error); }
}
export async function PATCH(request: Request) {
  try {
    const session = await playerGameSession();
    const body = await adminBody(request);
    return response(await saveCollectionPrivacy(session.user.id, body.visibility));
  } catch (error) { return adminFailure(error); }
}
