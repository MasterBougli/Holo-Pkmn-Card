import { requireAdminPage } from "@/lib/admin-page";
import { AdminShell } from "@/components/admin-shell";
import { DefectWorkshop } from "@/components/defect-workshop";
import { getCatalogueSets } from "@/lib/catalogue";
export default async function DefectsPage(){
 const session=await requireAdminPage("defects.preview");
 const catalogueSetData=await getCatalogueSets();
 return <AdminShell access={session.access} active="/admin/defauts" title="L’atelier des défauts" description="Explore les erreurs d’impression et de découpe sur un exemplaire de démonstration.">
 <DefectWorkshop sets={catalogueSetData.filter(set=>set.cards.length).map(set=>({code:set.code,name:set.name}))}/></AdminShell>;
}
