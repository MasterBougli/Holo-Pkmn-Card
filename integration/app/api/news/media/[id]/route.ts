import {readFile} from "node:fs/promises";
import path from "node:path";
import {eq} from "drizzle-orm";
import {db} from "@/lib/db";
import {newsMedia} from "@/lib/news-schema";
import {newsUuid} from "@/lib/news-types";
import {publicNewsMedia} from "@/lib/news-management";
import {getAdminSession} from "@/lib/admin-access";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!newsUuid(id))return new Response(null,{status:404});
 if(!await getAdminSession("news.read")&&!await publicNewsMedia(id))return new Response(null,{status:404});
 const [media]=await db.select().from(newsMedia).where(eq(newsMedia.id,id)).limit(1);
 if(!media||media.filename!==id+".webp")return new Response(null,{status:404});
 try{return new Response(new Uint8Array(await readFile(path.join(process.cwd(),"Web","News",media.filename))),{headers:{"Content-Type":"image/webp","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});}catch{return new Response(null,{status:404});}
}
