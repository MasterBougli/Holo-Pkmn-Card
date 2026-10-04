import { NextResponse } from "next/server";
import { playerGameSession } from "@/lib/player-game-session";
import { playerCollection } from "@/lib/booster-management";
import { adminFailure } from "@/lib/admin-http";
export async function GET(request:Request){try{const s=await playerGameSession(),page=Math.floor(Math.max(0,Math.min(10000,Number(new URL(request.url).searchParams.get("page"))||0)));return NextResponse.json(await playerCollection(s.user.id,page),{headers:{"Cache-Control":"private, no-store"}});}catch(e){return adminFailure(e);}}
