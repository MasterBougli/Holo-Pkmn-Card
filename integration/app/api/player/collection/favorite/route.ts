import { NextResponse } from "next/server";
import { playerGameSession } from "@/lib/player-game-session";
import { collectionFavorite } from "@/lib/collection-favorites";
import { adminBody, adminFailure } from "@/lib/admin-http";
import { AdminError } from "@/lib/admin-authorisation";
const response = (value: unknown) => NextResponse.json(value, { headers: { "Cache-Control": "private, no-store" } });
export async function GET(request: Request) {
  try { const session = await playerGameSession(); return response(await collectionFavorite(session.user.id, new URL(request.url).searchParams.get("id") ?? "")); }
  catch (error) { return adminFailure(error); }
}
export async function PATCH(request: Request) {
  try {
    const session = await playerGameSession(), body = await adminBody(request);
    if (typeof body.id !== "string" || typeof body.favorite !== "boolean") throw new AdminError("Favori invalide.", 400);
    return response(await collectionFavorite(session.user.id, body.id, body.favorite));
  } catch (error) { return adminFailure(error); }
}
