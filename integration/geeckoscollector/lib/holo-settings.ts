import { and,eq,inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { holoProfiles } from "@/lib/holo-schema";
import { cardFinishes,resolveCardAppearance,isAppearanceOverrides,type AppearanceOverrides } from "@/lib/card-appearance";
export async function getHoloSettings(setCode:string,cardId=""){
 const rows=await db.select().from(holoProfiles).where(and(eq(holoProfiles.setCode,setCode),inArray(holoProfiles.cardId,cardId?["",cardId]:[""])));
 const valid=(id:string):AppearanceOverrides=>{const value=rows.find(row=>row.cardId===id)?.settings;return isAppearanceOverrides(value)?value:{}};
 const set=valid(""); const card=cardId?valid(cardId):{};
 return {set,card,profiles:Object.fromEntries(cardFinishes.map(finish=>[finish,resolveCardAppearance(finish,set,card)]))};
}
