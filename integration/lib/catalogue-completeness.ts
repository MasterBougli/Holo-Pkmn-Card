import { getGameRarities,canonicalRarity,findRarity } from "./rarity-catalogue";
import { readFile,realpath,stat } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { catalogueCards } from "@/lib/catalogue-schema";
import { getCatalogueSetData } from "@/lib/catalogue";
import { availableFinishes,singleFinish,missingMetadata,type CardMetadataFields,type CardMetadataView } from "@/lib/card-metadata";
type Connection=Pick<typeof db,"select">;
type Detail={name?:string;localId?:string;rarity?:string;illustrator?:string;variants?:Record<string,boolean>;[key:string]:unknown};
export async function readBaseDetails(code:string):Promise<Record<string,Detail>>{
 if(!/^[A-Z0-9-]{1,12}$/.test(code))return {};
 try{return JSON.parse(await readFile(path.join(process.cwd(),"Web/CardDetails",code+".json"),"utf8"));}
 catch{return {};}
}
export async function hasCardImage(code:string,id:string){
 if(!/^[A-Z0-9-]{1,12}$/.test(code)||!/^[a-zA-Z0-9_.-]{1,100}$/.test(id))return false;
 try{
  const base=await realpath(path.join(process.env.GAME_ASSETS_ROOT??path.join(process.cwd(),"Web"),"Cards"));
  const target=await realpath(path.join(base,code,id+".png"));
  if(!target.startsWith(base+path.sep))return false;
  const info=await stat(target);return info.isFile()&&info.size>0;
 }catch{return false;}
}
export async function getSetCompleteness(code:string,connection:Connection=db){
 const set=await getCatalogueSetData(code,connection);if(!set)return null;
 const [base,rows,rarities]=await Promise.all([readBaseDetails(set.code),connection.select().from(catalogueCards).where(eq(catalogueCards.setCode,set.code)),getGameRarities(connection)]);
 const overrides=new Map(rows.map(row=>[row.id,row]));
 const cards:CardMetadataView[]=[];
 // Bound file probes rather than issuing one unbounded request per card.
 for(let index=0;index<set.cards.length;index+=16){
  cards.push(...await Promise.all(set.cards.slice(index,index+16).map(async card=>{
   const detail=base[card.id]??{},row=overrides.get(card.id);
   const raw=row?{name:row.name,localId:row.localId,rarity:row.rarity,illustrator:row.illustrator,finishes:row.finishes}:
    {name:detail.name??card.name,localId:detail.localId??card.localId,rarity:detail.rarity??card.rarity,illustrator:detail.illustrator??"",finishes:availableFinishes.filter(finish=>finish!=="fullart"&&detail.variants?.[finish]===true)};
   const fields:CardMetadataFields={...raw,rarity:canonicalRarity(raw.rarity,rarities),finishes:singleFinish(raw.finishes)};
   const imageAvailable=await hasCardImage(set.code,card.id);
   return {...fields,id:card.id,setCode:set.code,setName:set.name,revision:row?.revision??0,imageAvailable,missing:[...missingMetadata(fields,imageAvailable),...(fields.rarity.trim()&&!findRarity(fields.rarity,rarities)?["Rareté du jeu à choisir"]:[])],source:row?.source??"tcgdex"};
  })));
 }
 const incomplete=cards.filter(card=>card.missing.length);
 const absent=Math.max(0,set.totalCount-cards.length);
 return {set,cards,incomplete:incomplete.length+absent,complete:cards.length>0&&absent===0&&incomplete.length===0};
}
export async function getPublicCardDetails(code:string,id:string,connection:Connection=db){
 const set=await getCatalogueSetData(code,connection);if(!set||!set.cards.some(card=>card.id===id))return null;
 const [base,rows,rarities]=await Promise.all([readBaseDetails(set.code),connection.select().from(catalogueCards).where(eq(catalogueCards.id,id)).limit(1),getGameRarities(connection)]);
 const row=rows[0],brief=set.cards.find(card=>card.id===id)!;
 if(!base[id]&&!row)return null;
 const {_local,...details}=base[id]??{};
 void _local;
 const {_local:privateLocal,...stored}=row?.details??{};void privateLocal;
 return {...details,...stored,set:{name:set.name,cardCount:{official:set.officialCount,total:set.totalCount}},name:row?.name??details.name??brief.name,localId:row?.localId??details.localId??brief.localId,rarity:canonicalRarity(row?.rarity??details.rarity??brief.rarity,rarities),illustrator:row?.illustrator??details.illustrator,availableFinishes:singleFinish(row?.finishes??availableFinishes.filter(finish=>finish!=="fullart"&&(details.variants as Record<string,boolean>|undefined)?.[finish]===true))};
}
