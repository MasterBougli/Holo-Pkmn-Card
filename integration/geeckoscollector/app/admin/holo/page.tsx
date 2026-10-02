import { Layers3 } from "lucide-react";
import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-page";
import { AdminShell } from "@/components/admin-shell";
import { can } from "@/lib/admin-permissions";
import { getCatalogueSets,getCatalogueSetData } from "@/lib/catalogue";
import { getHoloSettings } from "@/lib/holo-settings";
import { HoloEditor } from "@/components/holo-editor";
export default async function HoloAdmin({searchParams}:{searchParams:Promise<{set?:string;card?:string}>}){
 const admin=await requireAdminPage("holo.read");
 const query=await searchParams;
 const catalogueSetData=await getCatalogueSets();
 const set=await getCatalogueSetData(query.set??"AOR")??catalogueSetData[0];
 const card=set.cards.find(card=>card.id===query.card);
 const settings=await getHoloSettings(set.code,card?.id??"");
 return <AdminShell access={admin.access} active="/admin/holo" title="Finitions & reflets" description="Donne à chaque collection sa signature holographique.">
 <section className="admin-target-panel" aria-labelledby="target-title">
 <div className="admin-section-heading"><Layers3 aria-hidden="true"/><div><h2 id="target-title">Choisir la collection</h2><p>Un réglage pour tout le set, ou une exception pour une carte.</p></div></div>
 <div className="admin-target-grid">
 <form className="holo-target" action="/admin/holo" method="get"><label>Set<select name="set" defaultValue={set.code}>{catalogueSetData.map(s=><option key={s.code} value={s.code}>{s.code} · {s.name}</option>)}</select></label><button className="quiet-button">Choisir ce set</button></form>
 <form className="holo-target" action="/admin/holo" method="get"><input type="hidden" name="set" value={set.code}/><label>Carte<select name="card" defaultValue={card?.id??""}><option value="">Réglage général du set</option>{set.cards.map(c=><option key={c.id} value={c.id}>{c.localId} · {c.name}</option>)}</select></label><button className="quiet-button">Ouvrir les réglages</button></form>
 </div></section>
 <div className="admin-edit-heading"><div><span className="admin-context-tag">{card?"EXCEPTION PAR CARTE":"PROFIL DU SET"} · {set.code}</span><h2>{card?card.name:set.name}</h2></div><p>{card?"Les autres cartes conservent les réglages du set.":"Les cartes héritent de ces profils, sauf exception."}</p></div>
 <HoloEditor canEdit={can(admin.access,"holo.edit")} key={set.code+":"+(card?.id??"")} setCode={set.code} setName={set.name} card={card??set.cards[0]} targetCardId={card?.id??""} baseWindow={settings.baseWindow} inherited={card?settings.set:{}} initial={card?settings.card:settings.set}/>
 <p className="admin-source-link"><Link href="/a-propos#open-source">Sources et crédits des effets</Link></p>
 </AdminShell>;
}
