import {NextResponse} from "next/server";
import {mkdir,writeFile,stat,unlink,realpath} from "node:fs/promises";
import path from "node:path";
import {randomUUID} from "node:crypto";
import sharp from "sharp";
import {db} from "@/lib/db";
import {newsMedia} from "@/lib/news-schema";
import {adminAudit} from "@/lib/admin-schema";
import {getAdminSession,AdminError,lockAdminAccess} from "@/lib/admin-access";
import {adminFailure} from "@/lib/admin-http";
export async function POST(request:Request){
 let created:{file:string;ino:number}|undefined;
 try{
  const create=await getAdminSession("news.create"),session=create??await getAdminSession("news.edit");if(!session)throw new AdminError("Permission insuffisante.");
  if(request.headers.get("origin")!==new URL(process.env.BETTER_AUTH_URL??request.url).origin)throw new AdminError("Origine refusée.");
  const p=new URL(request.url).searchParams,alt=p.get("alt")??"",name=p.get("name")??"Illustration";
  if(!alt.trim()||alt.length>300||name.length>160)throw new AdminError("Description alternative requise (300 caractères maximum).",400);
  const max=8*1024*1024;if(Number(request.headers.get("content-length")??0)>max)throw new AdminError("Image limitée à 8 Mo.",413);
  const reader=request.body?.getReader();if(!reader)throw new AdminError("Image manquante.",400);let size=0;const chunks:Uint8Array[]=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new AdminError("Image limitée à 8 Mo.",413);}chunks.push(value);}
  let bytes:Buffer,width:number,height:number;
  try{const image=sharp(Buffer.concat(chunks),{limitInputPixels:25000000}),meta=await image.metadata();if(!["png","jpeg","webp"].includes(meta.format??"")||(meta.pages??1)>1||!meta.width||!meta.height)throw Error();const out=await image.rotate().resize({width:2000,height:1600,fit:"inside",withoutEnlargement:true}).webp({quality:85}).toBuffer({resolveWithObject:true});bytes=out.data;width=out.info.width;height=out.info.height;}catch{throw new AdminError("Image PNG, JPEG ou WebP statique invalide.",400);}
  const id=randomUUID(),filename=id+".webp",directory=path.join(process.cwd(),"Web","News");
  await mkdir(directory,{recursive:true});const webRoot=await realpath(path.join(process.cwd(),"Web")),actual=await realpath(directory);
  if(actual!==path.join(webRoot,"News"))throw new AdminError("Dossier d’images indisponible.",500);
  const file=path.join(actual,filename);
  await db.transaction(async tx=>{
   await lockAdminAccess(tx,session.user.id,create?"news.create":"news.edit");
   await writeFile(file,bytes,{flag:"wx"});created={file,ino:(await stat(file)).ino};
   await tx.insert(newsMedia).values({id,filename,name:name.replace(/[\u0000-\u001f]/g,""),alt:alt.trim(),width,height,createdBy:session.user.id});
   await tx.insert(adminAudit).values({actorId:session.user.id,actorName:session.user.username??session.user.name,action:"news.media",targetName:name,after:{mediaId:id}});
  });created=undefined;return NextResponse.json({id,name,alt,width,height},{headers:{"Cache-Control":"no-store"}});
 }catch(e){if(created){const owned=created;try{if((await stat(owned.file)).ino===owned.ino)await unlink(owned.file);}catch{}}return adminFailure(e);}
}
