import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { can,type AdminPermission } from "@/lib/admin-permissions";
import { getAdminAccess } from "@/lib/admin-authorisation";
export { getAdminAccess,isAdminUser,AdminError,lockAdminAccess,type AdminTransaction } from "@/lib/admin-authorisation";
export { isSuperAdmin } from "@/lib/admin-identity";
export async function getAdminSession(permission:AdminPermission="admin.access"){
 const session=await auth.api.getSession({headers:await headers()});
 if(!session)return null;
 const access=await getAdminAccess(session.user.id);
 return can(access,"admin.access")&&can(access,permission)?{...session,access}:null;
}
