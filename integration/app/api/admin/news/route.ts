import {NextResponse} from "next/server";
import {getAdminSession,AdminError} from "@/lib/admin-access";
import {adminBody,adminFailure} from "@/lib/admin-http";
import {listNews,listNewsVersions,mutateNews,listNewsMedia} from "@/lib/news-management";
const options={headers:{"Cache-Control":"no-store"}};
export async function GET(request:Request){try{if(!await getAdminSession("news.read"))throw new AdminError("Permission insuffisante.");const p=new URL(request.url).searchParams;if(p.has("versions"))return NextResponse.json({versions:await listNewsVersions(p.get("versions")??"")},options);if(p.has("media"))return NextResponse.json({media:await listNewsMedia()},options);return NextResponse.json({articles:await listNews(p.get("trash")==="1")},options);}catch(e){return adminFailure(e);}}
export async function POST(request:Request){try{const s=await getAdminSession();if(!s)throw new AdminError("Permission insuffisante.");return NextResponse.json(await mutateNews(s.user,await adminBody(request)),options);}catch(e){return adminFailure(e);}}
