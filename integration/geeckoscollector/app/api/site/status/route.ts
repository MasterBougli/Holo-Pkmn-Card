import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGameAccess } from "@/lib/game-access";
export async function GET(){
 const session=await auth.api.getSession({headers:await headers()});
 const {config,allowed}=await getGameAccess(session?.user.id);
 const {maintenanceEnabled,maintenanceMessage,registrationsEnabled,registrationMessage}=config;
 return NextResponse.json({maintenanceEnabled,maintenanceMessage,registrationsEnabled,registrationMessage,canPlay:allowed},{headers:{"Cache-Control":"private, no-store","Vary":"Cookie"}});
}
