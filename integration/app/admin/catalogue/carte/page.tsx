import { getGameRarities } from "@/lib/rarity-catalogue";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin-page";
import { can } from "@/lib/admin-permissions";
import { getSetCompleteness } from "@/lib/catalogue-completeness";
import { AdminShell } from "@/components/admin-shell";
import { AdminPrices } from "@/components/admin-prices";
import { getPriceOverview } from "@/lib/card-price-management";
import { CardMetadataEditor } from "@/components/card-metadata-editor";
export default async function CardEditorPage({searchParams}:{searchParams:Promise<{set?:string;card?:string}>}){
 const session=await requireAdminPage("catalogue.read"),params=await searchParams,report=await getSetCompleteness(params.set??"");
 const card=report?.cards.find(card=>card.id===params.card);
 if(!report||!card)notFound();
 return <AdminShell access={session.access} active="/admin/catalogue" title={card.name||"Fiche de carte"} description="Complète les informations et règle les prix de cette carte depuis la même fiche.">
 <Link className="quiet-button" href="/admin/catalogue">Retour aux sets et cartes</Link>
 <nav className="admin-card-shortcuts" aria-label="Sections de la carte"><a href="#card-information">Informations</a>{can(session.access,"economy.read")&&<a href="#card-prices">Prix de revente</a>}{can(session.access,"holo.read")&&<Link href={"/admin/holo?"+new URLSearchParams({set:report.set.code,card:card.id})}>Effets holo de cette carte</Link>}</nav>
 <section className="admin-target-panel metadata-set-summary"><h2>{report.set.name} · {report.set.code}</h2><p>{report.incomplete} fiche(s) incomplète(s) sur {report.cards.length}. Les cartes exclues comptent aussi dans ce contrôle.</p><p>Une fiche complète ne déclenche pas l’activation automatique du set.</p></section>
 <section id="card-information" className="admin-card-section" aria-label="Informations de la carte"><CardMetadataEditor key={card.id} initial={card} rarityOptions={(await getGameRarities()).map(r=>r.name)} canEdit={can(session.access,"catalogue.edit")}/></section>
 {can(session.access,"economy.read")&&<section id="card-prices" className="admin-card-section" aria-label="Prix de revente"><AdminPrices key={card.id} initial={await getPriceOverview()} canEdit={can(session.access,"economy.edit")} startingCard={{setCode:report.set.code,target:card.id}} lockedCard/></section>}
 <section className="admin-target-panel metadata-next"><h2>Fiches restant à compléter</h2>{report.cards.some(card=>card.missing.length)?<ul>{report.cards.filter(card=>card.missing.length).slice(0,15).map(card=><li key={card.id}><Link href={"/admin/catalogue/carte?"+new URLSearchParams({set:report.set.code,card:card.id})}>{card.name||card.id} · n° {card.localId||"—"}</Link><span>{card.missing.join(", ")}</span></li>)}</ul>:<p>Toutes les fiches sont complètes.</p>}</section>
 </AdminShell>;
}
