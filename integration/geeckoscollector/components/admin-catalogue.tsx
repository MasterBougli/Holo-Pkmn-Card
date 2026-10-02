"use client";
import { useEffect,useRef,useState } from "react";
import Link from "next/link";
import { Layers3,Search,RefreshCw } from "lucide-react";
import type { AdminCardView,AdminSetView } from "@/lib/catalogue-management";
type Detail={set:AdminSetView;cards:AdminCardView[]};
const pageSize=24;
export function AdminCatalogue({initialSets,canActivate,canEdit}:{initialSets:AdminSetView[];canActivate:boolean;canEdit:boolean}){
 const [sets,setSets]=useState(initialSets),[query,setQuery]=useState(""),[status,setStatus]=useState("all"),[page,setPage]=useState(0);
 const [code,setCode]=useState(""),[detail,setDetail]=useState<Detail|null>(null),[cardQuery,setCardQuery]=useState(""),[cardStatus,setCardStatus]=useState("all"),[cardPage,setCardPage]=useState(0);
 const [loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState(""),[reload,setReload]=useState(0);
 const detailHeading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{
  if(!code)return;
  const controller=new AbortController();
  setLoading(true);setDetail(null);setError("");setCardQuery("");setCardStatus("all");setCardPage(0);
  fetch("/api/admin/catalogue?set="+encodeURIComponent(code),{cache:"no-store",signal:controller.signal}).then(async response=>{
   const data=await response.json();if(!response.ok)throw new Error(data.error??"Impossible de charger ce set.");
   setDetail(data);setSets(previous=>previous.map(set=>set.code===code?data.set:set));
  }).catch(reason=>{if(!controller.signal.aborted)setError(reason.message??"Chargement impossible.");}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[code,reload]);
 const norm=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 const filtered=sets.filter(set=>norm(set.name+" "+set.code+" "+set.seriesName).includes(norm(query))&&(status==="all"||(status==="active"?set.active:!set.active)));
 const visible=filtered.slice(page*pageSize,(page+1)*pageSize);
 const cards=(detail?.cards??[]).filter(card=>norm(card.name+" "+card.localId+" "+card.rarity).includes(norm(cardQuery))&&(cardStatus==="all"||(cardStatus==="excluded"?card.excluded:!card.excluded)));
 async function save(body:Record<string,unknown>){
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/admin/catalogue",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const data=await response.json();if(!response.ok)throw new Error(data.error??"Enregistrement impossible.");
   if(data.kind==="set"){
    setSets(previous=>previous.map(set=>set.code===data.code?{...set,active:data.active,revision:data.revision}:set));
    setDetail(previous=>previous&&previous.set.code===data.code?{...previous,set:{...previous.set,active:data.active,revision:data.revision}}:previous);
    setNotice(data.active?"Set activé. Ses cartes non exclues sont autorisées à l’obtention.":"Set désactivé. Il reste visible dans le catalogue public.");
   }else{
    setDetail(previous=>previous?{...previous,cards:previous.cards.map(card=>card.id===data.cardId?{...card,excluded:data.excluded,revision:data.revision}:card)}:previous);
    setNotice(data.excluded?"Carte exclue de l’obtention. Elle reste visible publiquement.":"Exclusion retirée. La carte suit le statut de son set.");
   }
  }catch(reason){setError(reason instanceof Error?reason.message:"Enregistrement impossible.");}
  finally{setBusy(false);}
 }
 function openSet(value:string){
  setCode(value);setNotice("");if(value===code)setReload(value=>value+1);
  requestAnimationFrame(()=>{detailHeading.current?.focus();detailHeading.current?.scrollIntoView({block:"start",behavior:"auto"});});
 }
 return <>
 <div className="admin-config-summary"><div><span>SETS DU CATALOGUE</span><strong>{sets.length} sets</strong></div><div><span>OBTENTION AUTORISÉE</span><strong>{sets.filter(set=>set.active).length} sets actifs</strong></div><div><span>CATALOGUE PUBLIC</span><strong>Tous les sets restent visibles</strong></div></div>
 <section className="admin-target-panel"><h2>La disponibilité des cartes</h2><p>Un set actif autorise ses cartes, sauf les exclusions individuelles. Les futures ouvertures de boosters utiliseront ces réglages ; le système de boosters reste à développer.</p><p>La désactivation ne retire aucun exemplaire déjà possédé. Les réglages holo sont indépendants.</p>{!canActivate&&!canEdit&&<p><strong>Consultation seule : tes permissions ne permettent pas de modifier ces réglages.</strong></p>}</section>
 <section className="admin-target-panel admin-catalogue-library" aria-labelledby="catalogue-heading">
 <header><h2 id="catalogue-heading"><Layers3 aria-hidden="true"/>Les sets</h2><Link href="/sets" className="quiet-button">Catalogue public</Link></header>
 <div className="admin-catalogue-filters"><label><span><Search aria-hidden="true"/>Rechercher un set</span><input value={query} onChange={event=>{setQuery(event.target.value);setPage(0);}} placeholder="Nom, code ou série"/></label><label>Statut<select value={status} onChange={event=>{setStatus(event.target.value);setPage(0);}}><option value="all">Tous les sets</option><option value="active">Actifs</option><option value="inactive">Inactifs</option></select></label></div>
 <p className="admin-helper">{filtered.length} set{filtered.length>1?"s":""} trouvé{filtered.length>1?"s":""}</p>
 <div className="admin-catalogue-sets">{visible.map(set=><article key={set.code} className="admin-catalogue-set"><div><span className="admin-context-tag">{set.code} · {set.active?"Actif":"Inactif"}</span><h3>{set.name}</h3><p>{set.seriesName||"Série non renseignée"} · {set.totalCardCount} cartes</p></div><button type="button" className="quiet-button" disabled={busy} onClick={()=>openSet(set.code)}>Voir les cartes</button></article>)}</div>
 {!visible.length&&<p>Aucun set ne correspond à la recherche.</p>}
 <nav className="admin-pagination" aria-label="Pages des sets"><button className="quiet-button" disabled={page===0||busy} onClick={()=>setPage(value=>value-1)}>Précédente</button><span>Page {page+1} / {Math.max(1,Math.ceil(filtered.length/pageSize))}</span><button className="quiet-button" disabled={(page+1)*pageSize>=filtered.length||busy} onClick={()=>setPage(value=>value+1)}>Suivante</button></nav>
 </section>
 <section className="admin-target-panel admin-catalogue-detail" aria-labelledby="selected-set-heading" aria-busy={loading||busy}>
 <h2 id="selected-set-heading" ref={detailHeading} tabIndex={-1}>{detail?detail.set.name:"Les cartes du set"}</h2>
 {!code&&<p>Sélectionne un set pour consulter ses cartes et régler leur disponibilité.</p>}
 {loading&&<p role="status">Chargement du set…</p>}
 {code&&!loading&&<button className="quiet-button" disabled={busy} onClick={()=>setReload(value=>value+1)}><RefreshCw aria-hidden="true"/>Recharger ce set</button>}
 {error&&<p className="admin-catalogue-error" role="alert">{error}</p>}
 {notice&&<p className="admin-catalogue-notice" role="status">{notice}</p>}
 {detail&&<>
 <div className="admin-catalogue-set-state"><div><strong>{detail.set.code} · Set {detail.set.active?"actif":"inactif"}</strong><p>{detail.cards.filter(card=>!card.excluded).length} cartes non exclues · {detail.cards.filter(card=>card.excluded).length} exclusions individuelles</p>{!detail.set.active&&<p>L’obtention est bloquée pour toutes les cartes de ce set, même celles sans exclusion.</p>}</div>{canActivate&&<button className="button game-primary" disabled={busy} onClick={()=>save({kind:"set",code:detail.set.code,revision:detail.set.revision,active:!detail.set.active})}>{busy?"Enregistrement…":detail.set.active?"Désactiver ce set":"Activer ce set"}</button>}</div>
 <div className="admin-catalogue-filters"><label>Rechercher une carte<input value={cardQuery} onChange={event=>{setCardQuery(event.target.value);setCardPage(0);}} placeholder="Nom, numéro ou rareté"/></label><label>Exclusions<select value={cardStatus} onChange={event=>{setCardStatus(event.target.value);setCardPage(0);}}><option value="all">Toutes les cartes</option><option value="allowed">Sans exclusion</option><option value="excluded">Exclues individuellement</option></select></label></div>
 <p className="admin-helper">{cards.length} carte{cards.length>1?"s":""} trouvée{cards.length>1?"s":""}. « Sans exclusion » ne permet l’obtention que si le set est actif.</p>
 <div className="admin-catalogue-cards">{cards.slice(cardPage*pageSize,(cardPage+1)*pageSize).map(card=><article key={card.id} className="admin-catalogue-card"><div><span className="admin-context-tag">N° {card.localId} · {card.rarity||"Rareté non renseignée"}</span><h3>{card.name}</h3><p><strong>{card.excluded?"Exclue individuellement":detail.set.active?"Obtention autorisée":"Obtention bloquée : set inactif"}</strong></p></div>{canEdit&&<button className="quiet-button" disabled={busy} aria-label={(card.excluded?"Retirer l’exclusion de ":"Exclure de l’obtention ")+card.name+" n°"+card.localId} onClick={()=>save({kind:"card",code:detail.set.code,cardId:card.id,revision:card.revision,excluded:!card.excluded})}>{card.excluded?"Retirer l’exclusion":"Exclure de l’obtention"}</button>}</article>)}</div>
 {!cards.length&&<p>Aucune carte ne correspond à la recherche.</p>}
 <nav className="admin-pagination" aria-label="Pages des cartes"><button className="quiet-button" disabled={cardPage===0||busy} onClick={()=>setCardPage(value=>value-1)}>Précédente</button><span>Page {cardPage+1} / {Math.max(1,Math.ceil(cards.length/pageSize))}</span><button className="quiet-button" disabled={(cardPage+1)*pageSize>=cards.length||busy} onClick={()=>setCardPage(value=>value+1)}>Suivante</button></nav>
 <Link href={"/sets/"+detail.set.code} className="quiet-button">Voir ce set dans le catalogue public</Link>
 </>}
 </section>
 </>;
}
