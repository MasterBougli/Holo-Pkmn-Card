import { NextResponse } from "next/server";
import { getAdminSession,AdminError } from "@/lib/admin-access";
import { adminBody,adminFailure } from "@/lib/admin-http";
import { boosterSetup,saveBoosterSetup,grantBoosters,searchBoosterPlayers,grantHistory } from "@/lib/booster-management";
const options={headers:{"Cache-Control":"no-store"}};
export async function GET(request:Request){try{
 if(!await getAdminSession("boosters.read"))throw new AdminError("Permission insuffisante.");
 const p=new URL(request.url).searchParams;
 if(p.has("players")){if(!await getAdminSession("boosters.grant"))throw new AdminError("Permission insuffisante.");return NextResponse.json({players:await searchBoosterPlayers(p.get("players")??"")},options);}
 if(p.has("history"))return NextResponse.json({history:await grantHistory()},options);
 return NextResponse.json(await boosterSetup(p.get("set")??""),options);
}catch(e){return adminFailure(e);}}
export async function PUT(request:Request){try{
 const s=await getAdminSession("boosters.edit");if(!s)throw new AdminError("Permission insuffisante.");
 return NextResponse.json(await saveBoosterSetup(s.user,await adminBody(request)),options);
}catch(e){return adminFailure(e);}}
export async function POST(request:Request){try{
 const s=await getAdminSession("boosters.grant");if(!s)throw new AdminError("Permission insuffisante.");
 return NextResponse.json(await grantBoosters(s.user,await adminBody(request)),options);
}catch(e){return adminFailure(e);}}
