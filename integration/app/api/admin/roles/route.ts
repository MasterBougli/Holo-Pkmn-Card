import { NextResponse } from "next/server";
import { getAdminSession,AdminError } from "@/lib/admin-access";
import { adminBody,adminFailure } from "@/lib/admin-http";
import { listAdminRoles,mutateRole } from "@/lib/admin-management";
export async function GET(){
 try{if(!await getAdminSession("roles.read"))throw new AdminError("Permission insuffisante.");
 return NextResponse.json({roles:await listAdminRoles()},{headers:{"Cache-Control":"no-store"}});}catch(error){return adminFailure(error);}
}
async function mutate(request:Request){
 try{
  const session=await getAdminSession();if(!session)throw new AdminError("Accès réservé à l’administration.");
  await mutateRole(session.user,request.method,await adminBody(request));
  return NextResponse.json({ok:true});
 }catch(error){return adminFailure(error);}
}
export const POST=mutate;export const PATCH=mutate;export const DELETE=mutate;
