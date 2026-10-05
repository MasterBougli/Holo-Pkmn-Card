import { NextResponse } from "next/server";
import { getAdminSession,AdminError } from "@/lib/admin-access";
import { adminBody,adminFailure } from "@/lib/admin-http";
import { listAdminAccounts,assignAdminRoles } from "@/lib/admin-management";
export async function GET(request:Request){
 try{
  if(!await getAdminSession("users.read"))throw new AdminError("Permission insuffisante.");
  const url=new URL(request.url),q=(url.searchParams.get("q")??"").trim().slice(0,60),page=Math.min(10000,Math.max(0,Math.floor(Number(url.searchParams.get("page"))||0)));
  return NextResponse.json(await listAdminAccounts(q,page),{headers:{"Cache-Control":"no-store"}});
 }catch(error){return adminFailure(error);}
}
export async function PUT(request:Request){
 try{
  const session=await getAdminSession("roles.assign");if(!session)throw new AdminError("Permission insuffisante.");
  await assignAdminRoles(session.user,await adminBody(request));return NextResponse.json({ok:true});
 }catch(error){return adminFailure(error);}
}
