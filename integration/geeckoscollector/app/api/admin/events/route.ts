import {NextResponse} from "next/server";
import {getAdminSession,AdminError} from "@/lib/admin-access";
import {adminBody,adminFailure} from "@/lib/admin-http";
import {listEvents,mutateEvent} from "@/lib/event-management";
import {getCatalogueSets,getCatalogueSetData} from "@/lib/catalogue";
const options={headers:{"Cache-Control":"no-store"}};
export async function GET(request:Request){try{if(!await getAdminSession("events.read"))throw new AdminError("Permission insuffisante.");const p=new URL(request.url).searchParams;if(p.has("sets"))return NextResponse.json({sets:(await getCatalogueSets()).map(s=>({code:s.code,name:s.name}))},options);if(p.has("cards"))return NextResponse.json({cards:(await getCatalogueSetData(p.get("cards")??""))?.cards??[]},options);return NextResponse.json({events:await listEvents(p.get("archived")==="1")},options);}catch(e){return adminFailure(e);}}
export async function POST(request:Request){try{const s=await getAdminSession();if(!s)throw new AdminError("Permission insuffisante.");return NextResponse.json(await mutateEvent(s.user,await adminBody(request)),options);}catch(e){return adminFailure(e);}}
