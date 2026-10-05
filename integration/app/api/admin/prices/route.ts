import { NextResponse } from "next/server";
import { getAdminSession,AdminError } from "@/lib/admin-access";
import { adminBody,adminFailure } from "@/lib/admin-http";
import { getPriceDetail,savePriceRules } from "@/lib/card-price-management";
import { getCatalogueSetData } from "@/lib/catalogue";
export async function GET(request:Request){
 try{
  if(!await getAdminSession("economy.read"))throw new AdminError("Permission insuffisante.");
  const params=new URL(request.url).searchParams,scope=params.get("scope"),target=params.get("target"),setCode=params.get("set")??"";
  if(!scope){
   const set=await getCatalogueSetData(setCode);if(!set)throw new AdminError("Set introuvable.",404);
   return NextResponse.json({cards:set.cards},{headers:{"Cache-Control":"no-store"}});
  }
  if((scope!=="card"&&scope!=="rarity")||!target||target.length>160||setCode.length>12)throw new AdminError("Sélection invalide.",400);
  return NextResponse.json(await getPriceDetail(scope,target,setCode),{headers:{"Cache-Control":"no-store"}});
 }catch(error){return adminFailure(error);}
}
export async function PUT(request:Request){
 try{
  const session=await getAdminSession("economy.edit");if(!session)throw new AdminError("Permission insuffisante.");
  const detail=await savePriceRules(session.user,await adminBody(request));
  return NextResponse.json(detail,{headers:{"Cache-Control":"no-store"}});
 }catch(error){return adminFailure(error);}
}
