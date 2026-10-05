import { NextResponse } from "next/server";
import { getCatalogueSetData } from "@/lib/catalogue";
import { getPublicCardDetails } from "@/lib/catalogue-completeness";
import { getResolvedCardPrices } from "@/lib/card-price-management";
import { getHoloSettings } from "@/lib/holo-settings";
export async function GET(_request:Request,{params}:{params:Promise<{code:string;cardId:string}>}){
 const {code,cardId}=await params,set=await getCatalogueSetData(code);
 if(!set||!set.cards.some(card=>card.id===cardId))return NextResponse.json({error:"Carte inconnue"},{status:404});
 const details=await getPublicCardDetails(set.code,cardId);
 if(!details)return NextResponse.json({error:"Fiche indisponible"},{status:404});
 const appearance=await getHoloSettings(set.code,cardId);
 const prices=await getResolvedCardPrices(cardId,String(details.rarity??""));
 return NextResponse.json({details,prices,appearance:appearance.profiles},{headers:{"Cache-Control":"no-store"}});
}
