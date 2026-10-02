import { and,eq,inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { gameSets,cardAvailability } from "@/lib/catalogue-schema";
import { catalogueSetData } from "@/lib/catalogue";

// Future booster issuance must read this inside its own transaction.
// This does not remove owned copies or change their resale price.
export async function getObtainableCatalogueCards(connection:Pick<typeof db,"select">=db){
 const sets=await connection.select({code:gameSets.code}).from(gameSets).where(eq(gameSets.active,true));
 const codes=sets.map(set=>set.code);
 if(!codes.length)return [];
 const exclusions=await connection.select({id:cardAvailability.cardId}).from(cardAvailability).where(and(eq(cardAvailability.excluded,true),inArray(cardAvailability.setCode,codes)));
 const allowed=new Set(codes),excluded=new Set(exclusions.map(row=>row.id));
 return catalogueSetData.filter(set=>allowed.has(set.code)).flatMap(set=>set.cards.filter(card=>!excluded.has(card.id)).map(card=>({...card,setCode:set.code})));
}
