import { NextResponse } from "next/server";
import { getAdminSession,AdminError } from "@/lib/admin-access";
import { adminBody,adminFailure } from "@/lib/admin-http";
import { readImportDashboard,queueCatalogueJob } from "@/lib/catalogue-import-management";
export async function GET(request:Request){try{if(!await getAdminSession("catalogue.read"))throw new AdminError("Permission insuffisante.");return NextResponse.json(await readImportDashboard(new URL(request.url).searchParams.get("report")??undefined),{headers:{"Cache-Control":"no-store"}});}catch(error){return adminFailure(error);}}
export async function POST(request:Request){try{const session=await getAdminSession("catalogue.import");if(!session)throw new AdminError("Permission insuffisante.");return NextResponse.json(await queueCatalogueJob(session.user,await adminBody(request)),{status:202});}catch(error){return adminFailure(error);}}
