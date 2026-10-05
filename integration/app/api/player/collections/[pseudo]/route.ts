import { NextResponse } from "next/server";
import { playerGameSession } from "@/lib/player-game-session";
import { sharedCollection } from "@/lib/shared-collection";
import { adminFailure } from "@/lib/admin-http";
import { readCollectionFilters } from "@/lib/collection-filter-params";

export async function GET(request: Request, { params }: { params: Promise<{ pseudo: string }> }) {
  try {
    await playerGameSession();
    const { pseudo } = await params;
    const query = new URL(request.url).searchParams;
    const page = Math.floor(Math.max(0, Math.min(10000, Number(query.get("page")) || 0)));
    return NextResponse.json(await sharedCollection(pseudo, page, readCollectionFilters(query)), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return adminFailure(error); }
}
