import { NextResponse } from "next/server";
import { mkdir,realpath,writeFile,stat,unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { db } from "@/lib/db";
import { catalogueCards } from "@/lib/catalogue-schema";
import { adminAudit } from "@/lib/admin-schema";
import { getAdminSession,AdminError,lockAdminAccess } from "@/lib/admin-access";
import { adminFailure } from "@/lib/admin-http";
import { getSetCompleteness } from "@/lib/catalogue-completeness";
const maxBytes=8*1024*1024;
export async function POST(request:Request){
 let created:{target:string;ino:number}|undefined;
 try{
  const session=await getAdminSession("catalogue.edit");if(!session)throw new AdminError("Permission insuffisante.");
  if(request.headers.get("origin")!==new URL(process.env.BETTER_AUTH_URL??request.url).origin)throw new AdminError("Origine refusée.");
  const query=new URL(request.url).searchParams,code=query.get("set")??"",id=query.get("card")??"",revision=Number(query.get("revision"));
  if(!/^[A-Z0-9-]{1,12}$/.test(code)||!/^[a-zA-Z0-9_.-]{1,100}$/.test(id)||query.get("revision")===null||!Number.isSafeInteger(revision)||revision<0)throw new AdminError("Carte invalide.",400);
  if(Number(request.headers.get("content-length")??0)>maxBytes)throw new AdminError("Image limitée à 8 Mo.",413);
  const reader=request.body?.getReader();if(!reader)throw new AdminError("Image manquante.",400);
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>maxBytes){await reader.cancel();throw new AdminError("Image limitée à 8 Mo.",413);}chunks.push(value);}
  let bytes:Buffer;
  try{const image=sharp(Buffer.concat(chunks),{limitInputPixels:25000000});const info=await image.metadata();if(!["png","jpeg","webp"].includes(info.format??"")||!info.width||!info.height||info.width<50||info.height<50||(info.pages??1)>1)throw new Error();bytes=await image.rotate().png().toBuffer();if(bytes.length>20*1024*1024)throw new Error();}catch{throw new AdminError("Choisis une image PNG, JPEG ou WebP valide, sans animation.",400);}
  await db.transaction(async tx=>{
   await lockAdminAccess(tx,session.user.id,"catalogue.edit");
   const report=await getSetCompleteness(code,tx),card=report?.cards.find(card=>card.id===id);
   if(!card)throw new AdminError("Carte introuvable.",404);
   if(card.imageAvailable)throw new AdminError("Une image existe déjà. Elle est conservée.",409);
   if(card.revision!==revision)throw new AdminError("La fiche a changé. Recharge avant de continuer.",409);
   const root=await realpath(path.join(process.env.GAME_ASSETS_ROOT??path.join(process.cwd(),"Web"),"Cards"));
   const directory=path.join(root,code);await mkdir(directory,{recursive:true});const actual=await realpath(directory);
   if(!actual.startsWith(root+path.sep))throw new AdminError("Dossier invalide.",400);
   const target=path.join(actual,id+".png");
   try{await writeFile(target,bytes,{flag:"wx"});created={target,ino:(await stat(target)).ino};}catch(error){if((error as NodeJS.ErrnoException).code==="EEXIST")throw new AdminError("Une image existe déjà. Elle est conservée.",409);throw error;}
   const value={id,setCode:code,name:card.name,localId:card.localId,rarity:card.rarity,illustrator:card.illustrator,finishes:card.finishes,revision:revision+1,updatedBy:session.user.id,updatedAt:new Date()};
   await tx.insert(catalogueCards).values({...value,source:"manual"}).onConflictDoUpdate({target:catalogueCards.id,set:value});
   await tx.insert(adminAudit).values({actorId:session.user.id,actorName:session.user.username??session.user.name,action:"catalogue.image",targetName:card.name+" · "+code+" n°"+card.localId,before:{imageAvailable:false},after:{imageAvailable:true}});
  });
  created=undefined;
  return NextResponse.json((await getSetCompleteness(code))?.cards.find(card=>card.id===id),{headers:{"Cache-Control":"no-store"}});
 }catch(error){if(created){const owned=created;try{if((await stat(owned.target)).ino===owned.ino)await unlink(owned.target);}catch{/* Only remove this request's new file after a database rollback. */}}return adminFailure(error);}
}
