import { requireAdminPage } from "@/lib/admin-page";
import { listAdminAccounts,listAdminRoles } from "@/lib/admin-management";
import { AdminShell } from "@/components/admin-shell";
import { AdminAccounts } from "@/components/admin-accounts";
export default async function AccountsPage({searchParams}:{searchParams:Promise<{q?:string;page?:string}>}){
 const session=await requireAdminPage("users.read"),params=await searchParams;
 const query=(params.q??"").trim().slice(0,60),page=Math.min(10000,Math.max(0,Math.floor(Number(params.page)||0)));
 const [result,roles]=await Promise.all([listAdminAccounts(query,page),listAdminRoles()]);
 return <AdminShell access={session.access} active="/admin/comptes" title="L’équipe et les joueurs" description="Retrouve un compte et attribue les rôles correspondant à ses missions."><AdminAccounts {...result} roles={roles} access={session.access} query={query} page={page}/></AdminShell>;
}
