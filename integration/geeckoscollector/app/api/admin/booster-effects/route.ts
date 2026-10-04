import { NextResponse } from "next/server";
import { getAdminSession,AdminError } from "@/lib/admin-access";
import { adminBody,adminFailure } from "@/lib/admin-http";
import { getBoosterRevealSettings,saveBoosterRevealSettings } from "@/lib/booster-reveal-management";
const options={headers:{"Cache-Control":"private, no-store"}};
export async function GET(){try{
 if(!await getAdminSession("boosters.read"))throw new AdminError("Permission insuffisante.");
 return NextResponse.json(await getBoosterRevealSettings(),options);
}catch(e){return adminFailure(e);}}
export async function PUT(request:Request){try{
 const s=await getAdminSession("boosters.edit");if(!s)throw new AdminError("Permission insuffisante.");
 return NextResponse.json(await saveBoosterRevealSettings(s.user,await adminBody(request)),options);
}catch(e){return adminFailure(e);}}
