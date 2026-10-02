import { NextResponse } from "next/server";
import { and,eq } from "drizzle-orm";
import { getAdminSession,lockAdminAccess } from "@/lib/admin-access";
import { adminFailure } from "@/lib/admin-http";
import { getCatalogueSetData } from "@/lib/catalogue";
import { isAppearanceOverrides } from "@/lib/card-appearance";
import { db } from "@/lib/db";
import { holoProfiles,holoProfileHistory } from "@/lib/holo-schema";
export async function PUT(request:Request){
 const session=await getAdminSession("holo.edit");
 if(!session)return NextResponse.json({error:"Accès réservé à l’administration."},{status:403});
 const expected=new URL(process.env.BETTER_AUTH_URL??request.url).origin;
 if(request.headers.get("origin")!==expected)return NextResponse.json({error:"Origine refusée."},{status:403});
 let body;try { body=await request.json(); } catch { return NextResponse.json({error:"Données invalides."},{status:400}); }
 if(!body||typeof body!=="object"||typeof body.setCode!=="string"||typeof body.cardId!=="string"||!isAppearanceOverrides(body.settings))return NextResponse.json({error:"Profil invalide."},{status:400});
 const set=await getCatalogueSetData(body.setCode);
 if(!set||(body.cardId&&!set.cards.some(card=>card.id===body.cardId)))return NextResponse.json({error:"Set ou carte introuvable."},{status:404});
 try{await db.transaction(async tx=>{
  await lockAdminAccess(tx,session.user.id,"holo.edit");
  const [previous]=await tx.select().from(holoProfiles).where(and(eq(holoProfiles.setCode,set.code),eq(holoProfiles.cardId,body.cardId))).limit(1);
  if(Object.keys(body.settings).length===0){
   await tx.delete(holoProfiles).where(and(eq(holoProfiles.setCode,set.code),eq(holoProfiles.cardId,body.cardId)));
  }else{
   await tx.insert(holoProfiles).values({setCode:set.code,cardId:body.cardId,settings:body.settings,updatedBy:session.user.id}).onConflictDoUpdate({target:[holoProfiles.setCode,holoProfiles.cardId],set:{settings:body.settings,updatedBy:session.user.id,updatedAt:new Date()}});
  }
  await tx.insert(holoProfileHistory).values({setCode:set.code,cardId:body.cardId,previous:previous?.settings??null,settings:body.settings,actorId:session.user.id});
 });}catch(error){return adminFailure(error);}
 return NextResponse.json({ok:true});
}
