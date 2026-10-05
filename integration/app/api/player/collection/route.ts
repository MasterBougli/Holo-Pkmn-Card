import { NextResponse } from "next/server";
import { playerGameSession } from "@/lib/player-game-session";
import { playerCollection } from "@/lib/booster-management";
import { adminFailure } from "@/lib/admin-http";
import { readCollectionFilters } from "@/lib/collection-filter-params";
export async function GET(request:Request){try{const s=await playerGameSession(),params=new URL(request.url).searchParams,page=Math.floor(Math.max(0,Math.min(10000,Number(params.get("page"))||0)));return NextResponse.json(await playerCollection(s.user.id,page,readCollectionFilters(params)),{headers:{"Cache-Control":"private, no-store"}});}catch(e){return adminFailure(e);}}
