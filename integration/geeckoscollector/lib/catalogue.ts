import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { gameSets,catalogueCards } from "@/lib/catalogue-schema";
import catalogue from "@/lib/catalogue-data.json";

export type CatalogueCard = {
  id: string;
  name: string;
  localId: string;
  rarity: string;
};

export type CatalogueSetData = {
  code: string;
  name: string;
  series: string;
  releaseDate: string;
  officialCount: number;
  totalCount: number;
  cards: CatalogueCard[];
};

const data = catalogue as { sets: CatalogueSetData[] };
function sortedCards(cards:CatalogueCard[]){return cards.sort((a,b)=>a.localId.localeCompare(b.localId,"fr",{numeric:true})||a.id.localeCompare(b.id,"fr",{numeric:true}));}

type Connection=Pick<typeof db,"select">;
export async function getCatalogueSets(connection:Connection=db):Promise<CatalogueSetData[]>{
 const [sets,overrides]=await Promise.all([connection.select().from(gameSets),connection.select().from(catalogueCards)]);
 return sets.map(set=>{
  const base=data.sets.find(item=>item.code===set.code);
  const cards=new Map((base?.cards??[]).map(card=>[card.id,card]));
  for(const row of overrides.filter(row=>row.setCode===set.code))cards.set(row.id,{id:row.id,name:row.name,localId:row.localId,rarity:row.rarity});
  return {code:set.code,name:set.name,series:set.seriesName,releaseDate:set.releaseDate??"",officialCount:set.officialCardCount,totalCount:set.totalCardCount,cards:sortedCards([...cards.values()])};
 }).sort((a,b)=>a.code.localeCompare(b.code));
}
export async function getCatalogueSetData(code:string,connection:Connection=db):Promise<CatalogueSetData|undefined>{
 const [set]=await connection.select().from(gameSets).where(eq(gameSets.code,code.toUpperCase())).limit(1);
 if(!set)return;
 const overrides=await connection.select().from(catalogueCards).where(eq(catalogueCards.setCode,set.code));
 const cards=new Map((data.sets.find(item=>item.code===set.code)?.cards??[]).map(card=>[card.id,card]));
 for(const row of overrides)cards.set(row.id,{id:row.id,name:row.name,localId:row.localId,rarity:row.rarity});
 return {code:set.code,name:set.name,series:set.seriesName,releaseDate:set.releaseDate??"",officialCount:set.officialCardCount,totalCount:set.totalCardCount,cards:sortedCards([...cards.values()])};
}
