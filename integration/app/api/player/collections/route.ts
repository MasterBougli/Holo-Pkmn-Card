import { NextResponse } from "next/server";
import { playerGameSession } from "@/lib/player-game-session";
import { searchCollections } from "@/lib/collection-search";
import { adminFailure } from "@/lib/admin-http";

export async function GET(request: Request) {
  try {
    await playerGameSession();
    return NextResponse.json(await searchCollections(new URL(request.url).searchParams.get("q") ?? ""), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return adminFailure(error); }
}
