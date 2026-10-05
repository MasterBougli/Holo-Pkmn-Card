import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-access";
import { visibleAdminGroups } from "@/lib/admin-navigation";
import { AdminShell } from "@/components/admin-shell";
export default async function AdminHome(){
 const session=await getAdminSession();if(!session)redirect("/compte");
 const groups=visibleAdminGroups(session.access);
 return <AdminShell access={session.access} active="/admin" title="L’atelier du jeu" description="Choisis un espace pour gérer les cartes, animer le jeu ou organiser l’équipe.">
 <div className="admin-overview-grid">{groups.map(group=><section className="admin-target-panel admin-overview-card" key={group.id}><h2>{group.label}</h2><p>{group.description}</p><ul>{group.sections.map(section=><li key={section.href}><Link href={section.href}>{section.label}<span aria-hidden="true"> →</span></Link></li>)}</ul></section>)}</div>
 {!groups.length&&<section className="admin-target-panel"><h2>Aucun outil accessible</h2><p>Un administrateur peut attribuer les permissions nécessaires à ton rôle.</p></section>}
 </AdminShell>;
}
