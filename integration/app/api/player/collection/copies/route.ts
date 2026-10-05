import { NextResponse } from "next/server";
import { playerGameSession } from "@/lib/player-game-session";
import { collectionCopies } from "@/lib/collection-copies";
import { readCollectionFilters } from "@/lib/collection-filter-params";
import { adminFailure } from "@/lib/admin-http";

export async function GET(request: Request) {
  try {
    const session = await playerGameSession(), query = new URL(request.url).searchParams;
    const page = Math.floor(Math.max(0, Math.min(10000, Number(query.get("page")) || 0)));
    return NextResponse.json(await collectionCopies(session.user.id, query.get("anchorId") ?? "", page, readCollectionFilters(query)), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return adminFailure(error); }
}
