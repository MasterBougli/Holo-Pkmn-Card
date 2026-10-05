import { NextResponse } from "next/server";
import { playerGameSession } from "@/lib/player-game-session";
import { collectionMissing } from "@/lib/collection-missing";
import { adminFailure } from "@/lib/admin-http";
export async function GET(request: Request) {
  try {
    const session = await playerGameSession(), query = new URL(request.url).searchParams;
    const page = Math.floor(Math.max(0, Math.min(10000, Number(query.get("page")) || 0)));
    return NextResponse.json(await collectionMissing(session.user.id, query.get("setCode") ?? "", page), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return adminFailure(error); }
}
