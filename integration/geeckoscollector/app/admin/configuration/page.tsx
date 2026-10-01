import { requireAdminPage } from "@/lib/admin-page";
import { can } from "@/lib/admin-permissions";
import { getSiteSettings } from "@/lib/site-settings";
import { AdminShell } from "@/components/admin-shell";
import { AdminConfiguration } from "@/components/admin-configuration";
export default async function ConfigurationPage(){
 const session=await requireAdminPage("config.read"),config=await getSiteSettings();
 return <AdminShell access={session.access} active="/admin/configuration" title="Préparer la prochaine ouverture" description="Gère la disponibilité du jeu et l’accueil des nouveaux collectionneurs."><AdminConfiguration initial={config} canEdit={can(session.access,"config.edit")}/></AdminShell>;
}
