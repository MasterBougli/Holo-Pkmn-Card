import { requireAdminPage } from "@/lib/admin-page";
import { listCatalogueSets } from "@/lib/catalogue-management";
import { can } from "@/lib/admin-permissions";
import { AdminShell } from "@/components/admin-shell";
import { AdminCatalogue } from "@/components/admin-catalogue";
export default async function CatalogueAdminPage(){
 const session=await requireAdminPage("catalogue.read");
 return <AdminShell access={session.access} active="/admin/catalogue" title="Le catalogue du jeu" description="Choisis les sets disponibles et les cartes qui pourront être obtenues.">
 <AdminCatalogue initialSets={await listCatalogueSets()} canActivate={can(session.access,"catalogue.activate")} canEdit={can(session.access,"catalogue.edit")}/></AdminShell>;
}
