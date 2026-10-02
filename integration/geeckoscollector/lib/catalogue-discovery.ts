import { createRequire } from "node:module";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { importJobs,discoveryItems,importMappings } from "@/lib/catalogue-import-schema";
import { getCatalogueSets } from "@/lib/catalogue";
import { readBaseDetails } from "@/lib/catalogue-completeness";
import { normalName,normalNumber,codePattern,type SourceCard,type DiscoveryItem } from "@/lib/catalogue-import-types";
import { sourceCardLabel,sourceCardNumbers } from "./catalogue-source-label";
export async function publicJson(url:string){
 const response=await fetch(url,{signal:AbortSignal.timeout(20000),headers:{"User-Agent":"GeeckosCollector-catalogue/1.0"},redirect:"error"});
 if(!response.ok)throw new Error("TCGdex indisponible ("+response.status+").");
 if(Number(response.headers.get("content-length")??0)>8000000)throw new Error("Réponse trop volumineuse.");
 const text=await response.text();if(text.length>8000000)throw new Error("Réponse trop volumineuse.");return JSON.parse(text);
}
export async function openSourceBrowser(){
 const {chromium}=createRequire("/opt/catalogue-worker/package.json")("playwright");
 return chromium.launch({headless:true,chromiumSandbox:true,env:{PATH:process.env.PATH??"",HOME:"/tmp",LANG:"fr_FR.UTF-8",PLAYWRIGHT_BROWSERS_PATH:process.env.PLAYWRIGHT_BROWSERS_PATH??"/opt/catalogue-worker/browsers"}});
}
export async function sourcePage(browser:any){
 const page=await browser.newPage({viewport:{width:1280,height:1800},locale:"fr-FR"});
 // Only metadata is collected during discovery. Empty image responses avoid both image downloads and lazy-image error fallbacks.
 await page.route("**/*",(route:any)=>{const type=route.request().resourceType();return type==="image"?route.fulfill({status:200,contentType:"image/png",body:Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aVTUAAAAASUVORK5CYII=","base64")}):["media","font"].includes(type)?route.abort():route.continue();});
 return page;
}
export async function readSeries(page:any){
 const response=await page.goto("https://www.pokecardex.com/series/",{waitUntil:"domcontentloaded",timeout:45000});
 if(!response?.ok())throw new Error("Pokécardex refuse la liste des séries.");
 await page.waitForFunction(()=>document.querySelectorAll('a[href*="/series/"]').length>50,{},{timeout:20000});
 const list=await page.evaluate(()=>Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href*="/series/"]')).flatMap(a=>{
  const match=a.href.match(/^https:\/\/www\.pokecardex\.com\/series\/([A-Z0-9-]+)$/);if(!match)return [];
  const names=Array.from(a.querySelectorAll('img')).map(img=>img.alt).filter(alt=>alt&&alt!==match[1]);
  return [{code:match[1],name:names[0]??a.innerText.trim()??match[1]}];
 }));
 const result=[...new Map<string,{code:string;name:string}>(list.map((s:{code:string;name:string})=>[s.code,s])).values()];
 if(result.length<100||result.length>1000)throw new Error("Liste source inattendue : couverture non confirmée.");return result;
}
export async function readChecklist(page:any,code:string){
 const response=await page.goto("https://www.pokecardex.com/series/"+code,{waitUntil:"domcontentloaded",timeout:45000});
 if(!response?.ok())throw new Error("Pokécardex indisponible ("+(response?.status()??0)+").");
 await page.waitForSelector('h1',{timeout:20000});
 await page.waitForFunction((code:string)=>Array.from(document.querySelectorAll("img")).some(img=>(img.getAttribute("src")??"").includes("/sets/"+code+"/FR/")),code,{timeout:20000});
 await page.evaluate(()=>window.scrollTo(0,0));
 const cards=new Map<string,Omit<SourceCard,"number">>();let expected=0,steps=0,lastHeight=0;
 while(steps++<250){
  const observed=await page.evaluate(()=>({text:document.body.innerText,images:Array.from(document.querySelectorAll('img')).map(img=>({src:img.getAttribute('src')??"",alt:img.alt})),height:document.documentElement.scrollHeight,y:window.scrollY}));
  expected=Number(observed.text.match(/(\d+)\s+cartes/i)?.[1]??0);
  for(const img of observed.images){
   const match=img.src.match(/^https:\/\/pokecardex-scans\.b-cdn\.net\/sets\/([A-Z0-9-]+)\/FR\/([a-zA-Z0-9_.-]+)\.jpg(?:\?.*)?$/);
   const label=sourceCardLabel(img.alt);
   if(match?.[1]===code&&label)cards.set(match[2],{...label,scanId:match[2]});
  }
  if(observed.y+1800>=observed.height&&observed.height===lastHeight)break;
  lastHeight=observed.height;await page.evaluate(()=>window.scrollBy(0,1400));await page.waitForTimeout(500);
 }
 const values=sourceCardNumbers([...cards.values()],code);return {cards:values,expected,complete:expected>0&&values.length===expected};
}
export async function discoverCatalogue(jobId:string){
 const browser=await openSourceBrowser();
 try{
  const page=await sourcePage(browser);
  const sources=await readSeries(page);await page.close();
  const local=await getCatalogueSets(),saved=await db.select().from(importMappings);
  let tcgSets:{id:string;name:string}[]=[];let tcgError="";
  try{tcgSets=await publicJson("https://api.tcgdex.net/v2/fr/sets");if(!Array.isArray(tcgSets))throw new Error();}catch{tcgError="Liste TCGdex indisponible : correspondances à vérifier.";}
  const known=new Map<string,string>();
  for(const set of local){const base=await readBaseDetails(set.code),first=Object.values(base)[0];const id=first?._local as {tcgdex_set_id?:string}|undefined;const tcg=(first?.set as {id?:string}|undefined)?.id??id?.tcgdex_set_id;if(tcg)known.set(tcg,set.code);}
  const special:Record<string,string>={"30C":"30th","LOR":"swsh11","SIT":"swsh12","PRSWSH":"swshp","PRSM":"smp","PRXY":"xyp","PRBW":"bwp","PRHS":"hgssp","PRDP":"dpp","PRNI":"np","PRWC":"basep"};
  await db.update(importJobs).set({total:sources.length,progress:0,summary:"Lecture des checklists publiques."}).where(eq(importJobs.id,jobId));
  const previous=await db.select().from(discoveryItems).where(eq(discoveryItems.reportId,jobId));
  const savedItems=new Map(previous.map(row=>[row.sourceCode,row.data]));
  let errors=0;
  for(const [index,source] of sources.entries()){
   const cached=savedItems.get(source.code);
   if(cached?.complete&&cached.readerVersion===2){
    await db.update(importJobs).set({progress:index+1,summary:source.code+" · reprise · "+(index+1)+" / "+sources.length+" checklists"}).where(eq(importJobs.id,jobId));
    continue;
   }
   const explicit=saved.find(m=>m.sourceCode===source.code),matches=tcgSets.filter(s=>normalName(s.name)===normalName(source.name));
   const tcgdexId=explicit?.tcgdexId??special[source.code]??(matches.length===1?matches[0].id:"");
   const localCode=explicit?.localCode??known.get(tcgdexId)??(source.code==="LOR"?"LOR-MAIN":source.code==="SIT"?"SIT-MAIN":source.code);
   const item:DiscoveryItem={readerVersion:2,sourceCode:source.code,name:source.name,localCode,tcgdexId,cards:[],missing:0,existing:0,expected:0,complete:false,issues:tcgError?[tcgError]:[],mapping:explicit?"Correspondance validée":tcgdexId?"Correspondance proposée, à valider":"Sans correspondance TCGdex"};
   const page=await sourcePage(browser);
   try{
    Object.assign(item,await readChecklist(page,source.code));
    const current=local.find(s=>s.code===localCode),numbers=new Set((current?.cards??[]).map(c=>normalNumber(c.localId)));
    item.existing=item.cards.filter(card=>numbers.has(normalNumber(card.number))).length;item.missing=item.cards.length-item.existing;
    if(!item.complete)item.issues.push("Checklist partielle : "+item.cards.length+" / "+item.expected+" cartes lues.");
    if(current&&!explicit&&normalName(current.name)!==normalName(source.name)&&!known.has(tcgdexId)){item.issues.push("Code interne déjà utilisé par un autre set : choisir un autre code.");item.mapping="Association ambiguë";}
    if(!tcgdexId)item.issues.push("Informations TCGdex absentes : les fiches devront être complétées manuellement.");
   }catch(error){item.issues.push(error instanceof Error?error.message:"Lecture impossible.");}finally{await page.close();}
   if(!item.complete)errors++;
   await db.insert(discoveryItems).values({reportId:jobId,sourceCode:source.code,data:item}).onConflictDoUpdate({target:[discoveryItems.reportId,discoveryItems.sourceCode],set:{data:item}});
   await db.update(importJobs).set({progress:index+1,summary:source.code+" · "+(index+1)+" / "+sources.length+" checklists"}).where(eq(importJobs.id,jobId));
   await new Promise(resolve=>setTimeout(resolve,300));
  }
  return {status:errors||tcgError?"partial":"complete",summary:sources.length+" séries étudiées · "+errors+" checklist(s) incomplète(s)."};
 }finally{await browser.close();}
}
