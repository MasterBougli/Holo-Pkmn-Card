import { readdir,realpath } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
// Only return existing imported images inside the authorized asset directory.
export async function getBoosterArtwork(code:string,packId="preview"):Promise<string|null>{
 if(!/^[A-Z0-9-]{1,12}$/.test(code))return null;
 try{
  const root=await realpath(path.join(process.env.GAME_ASSETS_ROOT??path.join(process.cwd(),"Web"),"Boosters"));
  const folder=await realpath(path.join(root,code));
  if(!folder.startsWith(root+path.sep))return null;
  const names=(await readdir(folder,{withFileTypes:true})).filter(e=>e.isFile()&&/^[a-zA-Z0-9_. -]+\.(png|jpe?g|webp)$/i.test(e.name)).map(e=>e.name).sort((a,b)=>a.localeCompare(b,"fr",{numeric:true}));
  if(!names.length)return null;
  const index=createHash("sha256").update(packId).digest().readUInt32BE(0)%names.length;
  const actual=await realpath(path.join(folder,names[index]));
  if(!actual.startsWith(folder+path.sep))return null;
  return "/media/Boosters/"+encodeURIComponent(code)+"/"+encodeURIComponent(names[index]);
 }catch{return null;}
}
