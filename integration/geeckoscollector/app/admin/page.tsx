import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-access";
import { can } from "@/lib/admin-permissions";
import { AdminShell } from "@/components/admin-shell";
export default async function AdminHome(){
 const session=await getAdminSession();if(!session)redirect("/compte");
 for(const [permission,path] of [["config.read","/admin/configuration"],["roles.read","/admin/roles"],["holo.read","/admin/holo"],["users.read","/admin/comptes"],["audit.read","/admin/journal"]] as const)if(can(session.access,permission))redirect(path);
 return <AdminShell access={session.access} active="/admin" title="Bienvenue dans l’équipe" description="Ton espace suit les permissions qui te sont attribuées."><section className="admin-target-panel"><h2>Aucun module disponible pour le moment</h2><p>Les droits du CMS et des événements sont prêts à être attribués. Leurs outils seront ajoutés aux prochaines étapes.</p></section></AdminShell>;
}
