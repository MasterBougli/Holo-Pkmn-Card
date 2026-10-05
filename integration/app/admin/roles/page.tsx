import { requireAdminPage } from "@/lib/admin-page";
import { listAdminRoles } from "@/lib/admin-management";
import { AdminShell } from "@/components/admin-shell";
import { AdminRoles } from "@/components/admin-roles";
export default async function RolesPage(){
 const session=await requireAdminPage("roles.read");
 return <AdminShell access={session.access} active="/admin/roles" title="Les missions de l’équipe" description="Crée des rôles et compose leurs permissions, action par action."><AdminRoles roles={await listAdminRoles()} access={session.access}/></AdminShell>;
}
