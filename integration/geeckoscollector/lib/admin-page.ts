import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-access";
import type { AdminPermission } from "@/lib/admin-permissions";
export async function requireAdminPage(permission:AdminPermission){
 const session=await getAdminSession(permission);if(session)return session;
 const base=await getAdminSession();redirect(base?"/admin":"/compte");
}
