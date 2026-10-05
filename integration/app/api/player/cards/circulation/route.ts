import { NextResponse } from "next/server";
import { playerGameSession } from "@/lib/player-game-session";
import { cardCirculation } from "@/lib/card-circulation";
import { adminFailure } from "@/lib/admin-http";

export async function GET(request: Request) {
  try {
    await playerGameSession();
    const params = new URL(request.url).searchParams;
    const result = await cardCirculation(params.get("setCode") ?? "", params.get("cardId") ?? "");
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return adminFailure(error);
  }
}
