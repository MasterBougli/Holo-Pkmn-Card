import { Sparkles, Layers3, Settings2, Newspaper, ShieldCheck, Download, ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/admin-access";
import { catalogueSetData,getCatalogueSetData } from "@/lib/catalogue";
import { getHoloSettings } from "@/lib/holo-settings";
import { HoloEditor } from "@/components/holo-editor";
import { PlayerChrome } from "@/components/player-ui";
export default async function HoloAdmin({searchParams}:{searchParams:Promise<{set?:string;card?:string}>}){
 const admin=await getAdminSession();if(!admin)redirect("/connexion");
 const query=await searchParams;
 const set=getCatalogueSetData(query.set??"AOR")??catalogueSetData[0];
 const card=set.cards.find(card=>card.id===query.card);
 const settings=await getHoloSettings(set.code,card?.id??"");
 return <><PlayerChrome/><main className="admin-workspace">
 <aside className="admin-sidebar" aria-label="Navigation administration">
 <div className="admin-brand"><ShieldCheck aria-hidden="true"/><div><strong>Administration</strong><span>GeeckosCollector</span></div></div>
 <span className="admin-nav-label">ATELIER DU JEU</span>
 <nav><Link href="/admin/holo" aria-current="page"><Sparkles aria-hidden="true"/>Apparence des cartes</Link></nav>
 <span className="admin-nav-label">PROCHAINS MODULES</span>
 <ul className="admin-future">{[[Settings2,"Configuration"],[Download,"Imports"],[Newspaper,"Actualités & événements"],[ShieldCheck,"Comptes & modération"]].map(([Icon,label])=>{const Glyph=Icon as typeof Settings2;return <li key={label as string}><Glyph aria-hidden="true"/><span>{label as string}</span><small>À venir</small></li>})}</ul>
 <Link className="admin-return" href="/compte"><ArrowLeft aria-hidden="true"/>Retour au jeu</Link>
 </aside>
 <div className="admin-content">
 <header className="admin-page-header"><div><span className="section-kicker">ATELIER · CARTES</span><h1>Finitions & reflets</h1><p>Donne à chaque collection sa signature holographique.</p></div><span className="admin-access-badge"><ShieldCheck aria-hidden="true"/>Accès administrateur</span></header>
 <section className="admin-target-panel" aria-labelledby="target-title">
 <div className="admin-section-heading"><Layers3 aria-hidden="true"/><div><h2 id="target-title">Choisir la collection</h2><p>Un réglage pour tout le set, ou une exception pour une carte.</p></div></div>
 <div className="admin-target-grid">
 <form className="holo-target" action="/admin/holo" method="get"><label>Set<select name="set" defaultValue={set.code}>{catalogueSetData.map(s=><option key={s.code} value={s.code}>{s.code} · {s.name}</option>)}</select></label><button className="quiet-button">Choisir ce set</button></form>
 <form className="holo-target" action="/admin/holo" method="get"><input type="hidden" name="set" value={set.code}/><label>Carte<select name="card" defaultValue={card?.id??""}><option value="">Réglage général du set</option>{set.cards.map(c=><option key={c.id} value={c.id}>{c.localId} · {c.name}</option>)}</select></label><button className="quiet-button">Ouvrir les réglages</button></form>
 </div></section>
 <div className="admin-edit-heading"><div><span className="admin-context-tag">{card?"EXCEPTION PAR CARTE":"PROFIL DU SET"} · {set.code}</span><h2>{card?card.name:set.name}</h2></div><p>{card?"Les autres cartes conservent les réglages du set.":"Les cartes héritent de ces profils, sauf exception."}</p></div>
 <HoloEditor key={set.code+":"+(card?.id??"")} setCode={set.code} setName={set.name} card={card??set.cards[0]} targetCardId={card?.id??""} baseWindow={settings.baseWindow} inherited={card?settings.set:{}} initial={card?settings.card:settings.set}/>
 <p className="admin-source-link"><Link href="/a-propos#open-source">Sources et crédits des effets</Link></p>
 </div></main></>;
}
