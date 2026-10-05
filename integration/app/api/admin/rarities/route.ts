import { NextResponse } from "next/server";
import { getAdminSession,AdminError } from "@/lib/admin-access";
import { can } from "@/lib/admin-permissions";
import { adminBody,adminFailure } from "@/lib/admin-http";
import { changeRarity,getRarityOverview } from "@/lib/rarity-management";
const options={headers:{"Cache-Control":"private, no-store"}};
export async function GET(){try{const s=await getAdminSession("rarities.read");if(!s)throw new AdminError("Permission insuffisante.");return NextResponse.json(await getRarityOverview(undefined,can(s.access,"economy.read")),options);}catch(e){return adminFailure(e);}}
export async function POST(request:Request){try{
 const s=await getAdminSession("rarities.read");if(!s)throw new AdminError("Permission insuffisante.");
 await changeRarity(s.user,await adminBody(request));
 return NextResponse.json(await getRarityOverview(undefined,can(s.access,"economy.read")),options);
}catch(e){return adminFailure(e);}}
