import { requireAdminPage } from "@/lib/admin-page";
import { can } from "@/lib/admin-permissions";
import { getRarityOverview } from "@/lib/rarity-management";
import { AdminShell } from "@/components/admin-shell";
import { AdminRarities } from "@/components/admin-rarities";
export default async function Page(){
 const s=await requireAdminPage("rarities.read");
 return <AdminShell access={s.access} active="/admin/raretes" title="Les raretés du jeu" description="Crée tes raretés, corrige leurs noms et regroupe les doublons en choisissant leur remplacement."><AdminRarities initial={await getRarityOverview(undefined,can(s.access,"economy.read"))} canCreate={can(s.access,"rarities.create")} canEdit={can(s.access,"rarities.edit")} canDelete={can(s.access,"rarities.delete")} canReviewPrices={can(s.access,"economy.read")}/></AdminShell>;
}
