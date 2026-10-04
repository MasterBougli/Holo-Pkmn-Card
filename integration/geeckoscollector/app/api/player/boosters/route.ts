import { NextResponse } from "next/server";
import { adminBody,adminFailure } from "@/lib/admin-http";
import { playerGameSession } from "@/lib/player-game-session";
import { playerInventory,openPlayerBooster,boosterOdds } from "@/lib/booster-management";
const options={headers:{"Cache-Control":"private, no-store"}};
export async function GET(request:Request){try{
 const s=await playerGameSession(),p=new URL(request.url).searchParams;
 if(p.has("id"))return NextResponse.json(await boosterOdds(s.user.id,p.get("id")??""),options);
 const page=Math.max(0,Math.min(10000,Number(p.get("page"))||0));
 return NextResponse.json(await playerInventory(s.user.id,Math.floor(page)),options);
}catch(e){return adminFailure(e);}}
export async function POST(request:Request){try{
 const s=await playerGameSession(),body=await adminBody(request);
 return NextResponse.json(await openPlayerBooster(s.user.id,body.id),options);
}catch(e){return adminFailure(e);}}
