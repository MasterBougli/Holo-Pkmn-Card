import { NextResponse } from "next/server";
import { getAdminSession,AdminError } from "@/lib/admin-access";
import { adminBody,adminFailure } from "@/lib/admin-http";
import { getCatalogueAvailability,updateCatalogueAvailability } from "@/lib/catalogue-management";
export async function GET(request:Request){
 try{
  if(!await getAdminSession("catalogue.read"))throw new AdminError("Permission insuffisante.");
  const code=new URL(request.url).searchParams.get("set");
  if(!code)throw new AdminError("Choisis un set.",400);
  return NextResponse.json(await getCatalogueAvailability(code),{headers:{"Cache-Control":"no-store"}});
 }catch(error){return adminFailure(error);}
}
export async function PUT(request:Request){
 try{
  const body=await adminBody(request);
  const session=await getAdminSession(body.kind==="set"?"catalogue.activate":"catalogue.edit");
  if(!session)throw new AdminError("Permission insuffisante.");
  const result=await updateCatalogueAvailability(session.user,body);
  return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch(error){return adminFailure(error);}
}
