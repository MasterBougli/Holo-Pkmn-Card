import { requireAdminPage } from "@/lib/admin-page";
import { can } from "@/lib/admin-permissions";
import { getPriceOverview } from "@/lib/card-price-management";
import { getCatalogueSetData } from "@/lib/catalogue";
import { AdminShell } from "@/components/admin-shell";
import { AdminPrices } from "@/components/admin-prices";
export default async function PricesPage({searchParams}:{searchParams:Promise<{set?:string;card?:string}>}){
 const session=await requireAdminPage("economy.read"),params=await searchParams;
 const set=params.set&&params.set.length<=12?await getCatalogueSetData(params.set):undefined;
 const startingCard=set&&params.card&&set.cards.some(card=>card.id===params.card)?{setCode:set.code,target:params.card}:undefined;
 return <AdminShell access={session.access} active="/admin/prix" title="Les tarifs de la collection" description="Règle la revente en pièces et en gemmes, par rareté ou pour une carte précise."><AdminPrices initial={await getPriceOverview()} canEdit={can(session.access,"economy.edit")} startingCard={startingCard}/></AdminShell>;
}
