import { NextResponse } from "next/server";
import { getAdminSession,AdminError } from "@/lib/admin-access";
import { adminBody,adminFailure } from "@/lib/admin-http";
import { getSetCompleteness } from "@/lib/catalogue-completeness";
import { saveCardMetadata } from "@/lib/card-metadata-management";
export async function GET(request:Request){
 try{
  if(!await getAdminSession("catalogue.read"))throw new AdminError("Permission insuffisante.");
  const params=new URL(request.url).searchParams,report=await getSetCompleteness(params.get("set")??"");
  const card=report?.cards.find(card=>card.id===params.get("card"));
  if(!card)throw new AdminError("Carte introuvable.",404);
  return NextResponse.json(card,{headers:{"Cache-Control":"no-store"}});
 }catch(error){return adminFailure(error);}
}
export async function PUT(request:Request){
 try{
  const session=await getAdminSession("catalogue.edit");if(!session)throw new AdminError("Permission insuffisante.");
  return NextResponse.json(await saveCardMetadata(session.user,await adminBody(request)),{headers:{"Cache-Control":"no-store"}});
 }catch(error){return adminFailure(error);}
}
