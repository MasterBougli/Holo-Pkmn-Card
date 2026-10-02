import { NextResponse } from "next/server";
import { getAdminSession,AdminError } from "@/lib/admin-access";
import { adminFailure } from "@/lib/admin-http";
import { getCatalogueSetData } from "@/lib/catalogue";
import { getHoloSettings } from "@/lib/holo-settings";
export async function GET(request:Request){
 try{
  if(!await getAdminSession("defects.preview"))throw new AdminError("Permission insuffisante.");
  const params=new URL(request.url).searchParams,set=getCatalogueSetData(params.get("set")??"AOR");
  if(!set||!set.cards.length)throw new AdminError("Set introuvable.",404);
  const card=params.get("card")?set.cards.find(card=>card.id===params.get("card")):set.cards[0];
  if(!card)throw new AdminError("Carte introuvable dans ce set.",404);
  return NextResponse.json({set:{code:set.code,name:set.name,cards:set.cards},card,profiles:(await getHoloSettings(set.code,card.id)).profiles},{headers:{"Cache-Control":"no-store"}});
 }catch(error){return adminFailure(error);}
}
