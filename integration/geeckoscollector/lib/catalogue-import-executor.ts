import { createRequire } from "node:module";
import { mkdir,realpath,writeFile,readFile,stat,unlink } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { eq,and } from "drizzle-orm";
import { db } from "@/lib/db";
import { importJobs,discoveryItems,importMappings } from "@/lib/catalogue-import-schema";
import { catalogueCards,gameSets } from "@/lib/catalogue-schema";
import { adminAudit } from "@/lib/admin-schema";
import { AdminError,lockAdminAccess } from "@/lib/admin-authorisation";
import { getCatalogueSetData } from "@/lib/catalogue";
import { availableFinishes,singleFinish } from "@/lib/card-metadata";
import { normalNumber,normalName,codePattern,tcgdexPattern } from "@/lib/catalogue-import-types";
import { publicJson } from "@/lib/catalogue-discovery";
import { validSourceScanId } from "./catalogue-source-scan";
const hash=(bytes:Buffer)=>createHash("sha256").update(bytes).digest("hex");
async function scanImage(sourceCode:string,scanId:string):Promise<Buffer>{
 if(!codePattern.test(sourceCode)||!validSourceScanId(scanId))throw new Error("Référence de scan invalide.");
 const response=await fetch("https://pokecardex-scans.b-cdn.net/sets/"+sourceCode+"/FR/"+scanId+".jpg?class=hd",{signal:AbortSignal.timeout(25000),redirect:"error"});
 if(!response.ok)throw new Error("Scan indisponible ("+response.status+").");
 if(Number(response.headers.get("content-length")??0)>8*1024*1024)throw new Error("Scan trop volumineux.");
 const reader=response.body?.getReader();if(!reader)throw new Error("Scan vide.");const chunks:Uint8Array[]=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>8*1024*1024){await reader.cancel();throw new Error("Scan trop volumineux.");}chunks.push(value);}
 const sharp=createRequire("/opt/catalogue-worker/package.json")("sharp"),image=sharp(Buffer.concat(chunks),{limitInputPixels:25000000});const info=await image.metadata();
 if(!["jpeg","png","webp"].includes(info.format??"")||(info.pages??1)>1||!info.width||!info.height||info.width<50||info.height<50)throw new Error("Scan invalide.");
 const result:Buffer=await image.rotate().png().toBuffer();if(result.length>20*1024*1024)throw new Error("Scan trop volumineux.");return result;
}
export async function executeCatalogueImport(jobId:string){
 const [job]=await db.select().from(importJobs).where(eq(importJobs.id,jobId)).limit(1),request=job?.payload;
 if(!job?.actorId||!request||!codePattern.test(request.localCode)||(request.tcgdexId&&!tcgdexPattern.test(request.tcgdexId)))throw new Error("Validation d’import absente.");
 const actorId=job.actorId;
 const [row]=await db.select().from(discoveryItems).where(and(eq(discoveryItems.reportId,request.reportId),eq(discoveryItems.sourceCode,request.sourceCode))).limit(1);
 if(!row?.data.complete||!row.data.cards.length)throw new Error("Checklist incomplète.");
 const [report]=await db.select().from(importJobs).where(eq(importJobs.id,request.reportId)).limit(1);
 if(!report||Date.now()-report.createdAt.getTime()>8*24*3600000)throw new Error("Rapport trop ancien : relance la recherche.");
 const source=row.data;let tcg:any=null;
 if(request.tcgdexId){try{tcg=await publicJson("https://api.tcgdex.net/v2/fr/sets/"+encodeURIComponent(request.tcgdexId));if(!Array.isArray(tcg.cards))throw new Error();}catch{throw new Error("Correspondance TCGdex indisponible : corrige-la ou valide sans TCGdex.");}}
 await db.transaction(async tx=>{
  await lockAdminAccess(tx,actorId,"catalogue.import");
  const existing=await getCatalogueSetData(request.localCode,tx);
  if(existing&&normalName(existing.name)!==normalName(source.name)&&normalName(existing.name)!==normalName(tcg?.name??""))throw new AdminError("Ce code interne désigne un autre set. Choisis un code distinct.",409);
  if(!existing){await tx.insert(gameSets).values({code:request.localCode,name:source.name,seriesName:typeof tcg?.serie?.name==="string"?tcg.serie.name:"",officialCardCount:Number(tcg?.cardCount?.official)||source.expected,totalCardCount:source.cards.length,releaseDate:/^\d{4}-\d{2}-\d{2}$/.test(tcg?.releaseDate??"")?tcg.releaseDate:null,active:false});
   await tx.insert(adminAudit).values({actorId,actorName:job.actorName,action:"catalogue.import.set",targetName:source.name,after:{importSummary:"Set créé inactif : "+request.localCode,jobId}});
  }
  else{
   const numbers=new Set(existing.cards.map(card=>normalNumber(card.localId)));
   const additions=source.cards.filter(card=>!numbers.has(normalNumber(card.number))).length;
   const [set]=await tx.select().from(gameSets).where(eq(gameSets.code,existing.code)).limit(1);
   if(additions){await tx.update(gameSets).set({active:false,totalCardCount:existing.cards.length+additions,revision:set.revision+1,updatedAt:new Date()}).where(eq(gameSets.code,set.code));
    if(set.active)await tx.insert(adminAudit).values({actorId,actorName:job.actorName,action:"catalogue.set",targetName:set.name,before:{availability:{kind:"set",active:true}},after:{availability:{kind:"set",active:false},reason:"Nouvelles cartes à compléter après import"}});
   }
  }
  await tx.insert(importMappings).values({sourceCode:request.sourceCode,localCode:request.localCode,tcgdexId:request.tcgdexId,updatedBy:actorId}).onConflictDoUpdate({target:importMappings.sourceCode,set:{localCode:request.localCode,tcgdexId:request.tcgdexId,updatedBy:actorId,updatedAt:new Date()}});
 });
 let added=0,skipped=0,errors=0;const issues:string[]=[];
 await db.update(importJobs).set({total:source.cards.length,progress:0}).where(eq(importJobs.id,jobId));
 for(const [index,card] of source.cards.entries()){
  const current=await getCatalogueSetData(request.localCode);
  if(current?.cards.some(existing=>normalNumber(existing.localId)===normalNumber(card.number))){skipped++;}
  else{
   let created:{target:string;ino:number}|undefined;let inserted=false;
   try{
    let details:any={};const match=tcg?.cards?.find((item:any)=>normalNumber(String(item.localId??""))===normalNumber(card.number));
    if(match&&normalName(String(match.name??""))===normalName(card.name)){
     try{details=await publicJson("https://api.tcgdex.net/v2/fr/cards/"+encodeURIComponent(match.id));}catch{issues.push(card.number+" : informations TCGdex à compléter.");}
    }
    const id=request.localCode+"-"+(/^\d+$/.test(card.number)?card.number.padStart(3,"0"):card.number);
    if(!/^[a-zA-Z0-9_.-]{1,100}$/.test(id))throw new Error("Numéro non pris en charge.");
    const fields={name:card.name.slice(0,160),localId:card.number.slice(0,160),rarity:typeof details.rarity==="string"?details.rarity.slice(0,160):"",illustrator:typeof details.illustrator==="string"?details.illustrator.slice(0,160):"",finishes:singleFinish(availableFinishes.filter(finish=>finish!=="fullart"&&details.variants?.[finish]===true))};
    const image=await scanImage(request.sourceCode,card.scanId);
    await db.transaction(async tx=>{
     await lockAdminAccess(tx,actorId,"catalogue.import");
     const fresh=await getCatalogueSetData(request.localCode,tx);
     if(fresh?.cards.some(existing=>normalNumber(existing.localId)===normalNumber(card.number))){skipped++;return;}
     const root=await realpath(path.join(process.env.GAME_ASSETS_ROOT??path.join(process.cwd(),"Web"),"Cards"));
     const folder=path.join(root,request.localCode);await mkdir(folder,{recursive:true});const actual=await realpath(folder);
     if(!actual.startsWith(root+path.sep))throw new Error("Dossier d’images invalide.");
     const target=path.join(actual,id+".png");
     try{await writeFile(target,image,{flag:"wx"});created={target,ino:(await stat(target)).ino};}
     catch(error){if((error as NodeJS.ErrnoException).code!=="EEXIST")throw error;if(hash(await readFile(target))!==hash(image))throw new Error("Un scan différent existe déjà : conservé.");}
     const {_local,...publicDetails}=details;void _local;
     await tx.insert(catalogueCards).values({...fields,id,setCode:request.localCode,details:publicDetails,source:"pokecardex+tcgdex",updatedBy:actorId});inserted=true;
     await tx.insert(adminAudit).values({actorId,actorName:job.actorName,action:"catalogue.import.card",targetName:fields.name+" · "+request.localCode+" n°"+fields.localId,after:{importSummary:"Carte ajoutée depuis "+request.sourceCode,jobId}});
    });
    created=undefined;if(inserted)added++;
   }catch(error){if(created){const owned=created;try{if((await stat(owned.target)).ino===owned.ino)await unlink(owned.target);}catch{}}
    if(error instanceof AdminError)throw error;
    errors++;issues.push(card.number+" : "+(error instanceof Error?error.message:"Ajout impossible."));
   }
  }
  await db.update(importJobs).set({progress:index+1,summary:added+" ajout(s), "+skipped+" déjà présente(s), "+errors+" échec(s)."}).where(eq(importJobs.id,jobId));
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 await db.transaction(async tx=>{await lockAdminAccess(tx,actorId,"catalogue.import");await tx.insert(adminAudit).values({actorId,actorName:job.actorName,action:"catalogue.import.finish",targetName:source.name,after:{importSummary:added+" ajout(s), "+skipped+" conservée(s), "+errors+" échec(s).",jobId}});});
 return {status:errors?"partial":"complete",summary:added+" ajout(s), "+skipped+" conservée(s), "+errors+" échec(s). "+issues.slice(0,8).join(" · ")};
}
