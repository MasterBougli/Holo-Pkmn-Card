import { NextResponse } from "next/server";
import { getAdminSession,AdminError } from "@/lib/admin-access";
import { adminBody,adminFailure } from "@/lib/admin-http";
import { getSiteSettings } from "@/lib/site-settings";
import { updateSiteSettings } from "@/lib/site-config-management";
export async function GET(){
 try{
  if(!await getAdminSession("config.read"))throw new AdminError("Permission insuffisante.");
  return NextResponse.json(await getSiteSettings(),{headers:{"Cache-Control":"no-store"}});
 }catch(error){return adminFailure(error);}
}
export async function PUT(request:Request){
 try{
  const session=await getAdminSession("config.edit");if(!session)throw new AdminError("Permission insuffisante.");
  const configuration=await updateSiteSettings(session.user,await adminBody(request));
  return NextResponse.json({ok:true,configuration},{headers:{"Cache-Control":"no-store"}});
 }catch(error){return adminFailure(error);}
}
