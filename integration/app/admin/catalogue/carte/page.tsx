import { getGameRarities } from "@/lib/rarity-catalogue";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin-page";
import { can } from "@/lib/admin-permissions";
import { getSetCompleteness } from "@/lib/catalogue-completeness";
import { AdminShell } from "@/components/admin-shell";
import { CardMetadataEditor } from "@/components/card-metadata-editor";
export default async function CardEditorPage({searchParams}:{searchParams:Promise<{set?:string;card?:string}>}){
 const session=await requireAdminPage("catalogue.read"),params=await searchParams,report=await getSetCompleteness(params.set??"");
 const card=report?.cards.find(card=>card.id===params.card);
 if(!report||!card)notFound();
 return <AdminShell access={session.access} active="/admin/catalogue" title="Compléter une fiche de carte" description="Les six informations obligatoires doivent être présentes pour activer le set.">
 <Link className="quiet-button" href="/admin/catalogue">Retour aux sets et cartes</Link>
 {can(session.access,"economy.read")&&<Link className="quiet-button" href={"/admin/prix?"+new URLSearchParams({set:report.set.code,card:card.id})}>Régler les prix de cette carte</Link>}
 <section className="admin-target-panel metadata-set-summary"><h2>{report.set.name} · {report.set.code}</h2><p>{report.incomplete} fiche(s) incomplète(s) sur {report.cards.length}. Les cartes exclues comptent aussi dans ce contrôle.</p><p>Une fiche complète ne déclenche pas l’activation automatique du set.</p></section>
 <CardMetadataEditor key={card.id} initial={card} rarityOptions={(await getGameRarities()).map(r=>r.name)} canEdit={can(session.access,"catalogue.edit")}/>
 <section className="admin-target-panel metadata-next"><h2>Fiches restant à compléter</h2>{report.cards.some(card=>card.missing.length)?<ul>{report.cards.filter(card=>card.missing.length).slice(0,15).map(card=><li key={card.id}><Link href={"/admin/catalogue/carte?"+new URLSearchParams({set:report.set.code,card:card.id})}>{card.name||card.id} · n° {card.localId||"—"}</Link><span>{card.missing.join(", ")}</span></li>)}</ul>:<p>Toutes les fiches sont complètes.</p>}</section>
 </AdminShell>;
}
