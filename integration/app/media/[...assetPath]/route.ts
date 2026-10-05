import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const root=process.env.GAME_ASSETS_ROOT ? path.resolve(process.env.GAME_ASSETS_ROOT) : null;
const allowed=new Set(["Binder","Boosters","Cards","CNI"]);
const mime:Record<string,string>={".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp",".gif":"image/gif"};
export async function GET(_request:Request,{params}:{params:Promise<{assetPath:string[]}>}){
  const {assetPath}=await params;
  if(!root||!assetPath.length||!allowed.has(assetPath[0]))return new NextResponse("Not found",{status:404});
  const target=path.resolve(root,...assetPath);
  if(!target.startsWith(path.resolve(root,assetPath[0])+path.sep))return new NextResponse("Not found",{status:404});
  const type=mime[path.extname(target).toLowerCase()];if(!type)return new NextResponse("Not found",{status:404});
  try{const bytes=await readFile(target);return new NextResponse(bytes,{headers:{"Content-Type":type,"Cache-Control":"public, max-age=3600"}})}catch{return new NextResponse("Not found",{status:404})}
}
