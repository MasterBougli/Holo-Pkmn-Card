"use client";
import { useEffect,useState } from "react";
import Image from "next/image";
import { Coins,Gem,Save,RotateCcw,RefreshCw } from "lucide-react";
import { availableFinishes,finishLabels } from "@/lib/card-metadata";
import { maxCardPrice,type PriceOverview,type PriceDetail,type PriceRule,type PriceScope } from "@/lib/card-prices";
import type { CatalogueCard } from "@/lib/catalogue";
type Draft={finish:PriceRule["finish"];coins:string;gems:string;revision:number};
const drafts=(detail:PriceDetail)=>detail.rules.map(rule=>({...rule,coins:rule.coins===null?"":String(rule.coins),gems:rule.gems===null?"":String(rule.gems)}));
const format=(value:number|null)=>value===null?"À définir":value.toLocaleString("fr-FR");
function amount(value:string){return value.trim()===""?null:/^\d+$/.test(value.trim())?Number(value.trim()):NaN;}
export function AdminPrices({initial,canEdit,startingCard}:{initial:PriceOverview;canEdit:boolean;startingCard?:{setCode:string;target:string}}){
 const [selection,setSelection]=useState(startingCard?{scope:"card" as PriceScope,...startingCard}:{scope:"card" as PriceScope,target:"",setCode:initial.sets[0]?.code??""});
 const [cards,setCards]=useState<CatalogueCard[]>([]),[cardQuery,setCardQuery]=useState("");
 const [detail,setDetail]=useState<PriceDetail|null>(null),[draft,setDraft]=useState<Draft[]>([]);
 const [loading,setLoading]=useState(false),[cardsLoading,setCardsLoading]=useState(false),[busy,setBusy]=useState(false);
 const [status,setStatus]=useState(""),[error,setError]=useState(""),[conflict,setConflict]=useState(false),[reload,setReload]=useState(0);
 const dirty=!!detail&&JSON.stringify(draft)!==JSON.stringify(drafts(detail));
 function choose(next:typeof selection){
  if(busy||(dirty&&!window.confirm("Changer de sélection et abandonner les tarifs non enregistrés ?")))return;
  setDetail(null);setDraft([]);setStatus("");setError("");setConflict(false);setSelection(next);
 }
 useEffect(()=>{
  if(selection.scope!=="card"||!selection.setCode){setCards([]);setCardsLoading(false);return;}
  const controller=new AbortController();setCardsLoading(true);setCards([]);setError("");
  fetch("/api/admin/prices?"+new URLSearchParams({set:selection.setCode}),{cache:"no-store",signal:controller.signal})
   .then(async response=>{const data=await response.json();if(!response.ok)throw Error(data.error??"Chargement impossible.");return data.cards as CatalogueCard[];})
   .then(values=>{if(controller.signal.aborted)return;setCards(values);setSelection(current=>({...current,target:values.some(card=>card.id===current.target)?current.target:values[0]?.id??""}));})
   .catch(error=>{if(!controller.signal.aborted)setError(error.message??"Impossible de charger les cartes.");})
   .finally(()=>{if(!controller.signal.aborted)setCardsLoading(false);});
  return()=>controller.abort();
 },[selection.scope,selection.setCode]);
 useEffect(()=>{
  if(!selection.target){setDetail(null);setDraft([]);setLoading(false);return;}
  const controller=new AbortController();setLoading(true);setDetail(null);setDraft([]);setError("");setConflict(false);
  fetch("/api/admin/prices?"+new URLSearchParams({scope:selection.scope,target:selection.target,set:selection.setCode}),{cache:"no-store",signal:controller.signal})
   .then(async response=>{const data=await response.json();if(!response.ok)throw Error(data.error??"Chargement impossible.");return data as PriceDetail;})
   .then(data=>{if(!controller.signal.aborted){setDetail(data);setDraft(drafts(data));}})
   .catch(error=>{if(!controller.signal.aborted)setError(error.message??"Impossible de charger les tarifs.");})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[selection.scope,selection.target,selection.setCode,reload]);
 async function save(){
  if(!detail||!canEdit||busy||!dirty)return;
  const rules=draft.map(rule=>({...rule,coins:amount(rule.coins),gems:amount(rule.gems)}));
  if(rules.some(rule=>[rule.coins,rule.gems].some(value=>value!==null&&(!Number.isSafeInteger(value)||value<0||value>maxCardPrice)))){setError("Saisis des nombres entiers de 0 à 1 000 000 000, ou laisse les champs vides.");return;}
  setBusy(true);setError("");setStatus("");setConflict(false);
  try{
   const response=await fetch("/api/admin/prices",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({scope:detail.scope,target:detail.target,setCode:detail.setCode,rules})});
   const data=await response.json();
   if(!response.ok){setError(data.error??"Enregistrement impossible.");setConflict(response.status===409);return;}
   setDetail(data);setDraft(drafts(data));setStatus("Tarifs enregistrés.");
  }catch{setError("Connexion interrompue. Réessaie.");}finally{setBusy(false);}
 }
 function refresh(){
  if(busy||(dirty&&!window.confirm("Recharger et abandonner les modifications non enregistrées ?")))return;
  setStatus("");setReload(value=>value+1);
 }
 const visibleCards=cards.filter(card=>(card.name+" "+card.localId+" "+card.rarity).toLocaleLowerCase("fr").includes(cardQuery.toLocaleLowerCase("fr")));
 const selectedCard=cards.find(card=>card.id===selection.target);
 return <>
 <section className="admin-target-panel price-intro"><div><span className="admin-context-tag">ÉQUILIBRAGE DE LA COLLECTION</span><h2>Fixer le prix de chaque carte</h2><p>Choisis un set, puis une carte pour régler ses prix en pièces et en gemmes, finition par finition. Un tarif non renseigné reste « À définir ». Zéro est un tarif explicite.</p></div><div className="price-currencies"><span><Coins aria-hidden="true"/>Pièces</span><span><Gem aria-hidden="true"/>Gemmes</span></div><p>Les défauts d’impression et de découpe ne modifient pas ces prix de base. Les échanges entre joueurs pourront avoir leurs propres offres.</p></section>
 <section className="admin-settings-panel price-selection"><h2>Choisir les tarifs à régler</h2><div className="price-tabs" role="group" aria-label="Type de tarif">
 <button type="button" className="quiet-button" aria-pressed={selection.scope==="rarity"} disabled={busy} onClick={()=>{setCardQuery("");choose({scope:"rarity",target:initial.rarities[0]??"",setCode:""});}}>Par rareté</button>
 <button type="button" className="quiet-button" aria-pressed={selection.scope==="card"} disabled={busy} onClick={()=>{setCardQuery("");choose({scope:"card",target:"",setCode:initial.sets[0]?.code??""});}}>Par carte</button></div>
 {selection.scope==="rarity"?<label>Rareté du catalogue<select disabled={busy} value={selection.target} onChange={event=>choose({...selection,target:event.target.value})}>{!initial.rarities.length&&<option value="">Aucune rareté renseignée</option>}{initial.rarities.map(rarity=><option key={rarity} value={rarity}>{rarity}</option>)}</select></label>:
 <div className="price-selector-grid"><label>Set<select disabled={busy} value={selection.setCode} onChange={event=>{setCardQuery("");choose({...selection,setCode:event.target.value,target:""});}}>{!initial.sets.length&&<option value="">Aucun set disponible</option>}{initial.sets.map(set=><option key={set.code} value={set.code}>{set.code} · {set.name}</option>)}</select></label>
 <label>Rechercher une carte<input value={cardQuery} disabled={busy||cardsLoading} placeholder="Nom, numéro ou rareté" onChange={event=>setCardQuery(event.target.value)}/></label>
 <label>Carte<select disabled={busy||cardsLoading} value={selection.target} onChange={event=>choose({...selection,target:event.target.value})}>{!visibleCards.some(card=>card.id===selection.target)&&selectedCard&&<option value={selectedCard.id}>n°{selectedCard.localId} · {selectedCard.name} (sélection actuelle)</option>}{!cards.length&&<option value="">{cardsLoading?"Chargement…":"Aucune carte"}</option>}{visibleCards.map(card=><option key={card.id} value={card.id}>n°{card.localId} · {card.name}</option>)}</select></label>
 <p className="admin-helper">{visibleCards.length} carte(s) dans la recherche.</p></div>}
 <p className="admin-helper">{selection.scope==="card"?"Ces prix s’appliquent uniquement à la carte choisie et à sa finition. Un champ vide reprend le tarif de sa rareté.":"Le tarif s’applique à toutes les cartes de cette rareté et de cette finition, sauf exception enregistrée."}</p>
 </section>
 <form className="admin-settings-panel price-editor" onSubmit={event=>{event.preventDefault();void save();}} aria-busy={loading||busy}>
 <header className="price-editor-heading"><div><span className="admin-context-tag">{selection.scope==="card"?"PRIX DE CETTE CARTE":"TARIFS GÉNÉRAUX"}</span><h2>{detail?.name??"Sélectionne une carte ou une rareté"}</h2>{detail?.scope==="card"&&<p>Rareté : {detail.rarity||"Non renseignée"}</p>}</div>{detail?.scope==="card"&&<Image src={"/media/Cards/"+detail.setCode+"/"+detail.target+".png"} width={85} height={117} unoptimized alt={detail.name}/>}</header>
 {loading&&<p role="status">Chargement des tarifs…</p>}
 {detail&&<div className="price-finish-grid">{draft.map((rule,index)=>{
 const inherited=detail.scope==="card",current=detail.effective[rule.finish];
 return <fieldset className="price-finish" key={rule.finish} disabled={!canEdit||busy}><legend>{finishLabels[rule.finish]}</legend><label><span><Coins aria-hidden="true"/>Prix en pièces</span><input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={10} value={rule.coins} placeholder={inherited?"Tarif général":"À définir"} onChange={event=>{setDraft(values=>values.map((v,i)=>i===index?{...v,coins:event.target.value}:v));setStatus("");setError("");}}/></label>
 <label><span><Gem aria-hidden="true"/>Prix en gemmes</span><input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={10} value={rule.gems} placeholder={inherited?"Tarif général":"À définir"} onChange={event=>{setDraft(values=>values.map((v,i)=>i===index?{...v,gems:event.target.value}:v));setStatus("");setError("");}}/></label>
 <div className="price-effective"><strong>Tarif actuellement appliqué</strong><span>Pièces : {format(current.coins)} · Gemmes : {format(current.gems)}</span>{inherited&&<small>Pièces : {current.coinsSource==="card"?"prix de cette carte":current.coinsSource==="rarity"?"tarif général":"à définir"} · Gemmes : {current.gemsSource==="card"?"prix de cette carte":current.gemsSource==="rarity"?"tarif général":"à définir"}</small>}</div>
 {canEdit&&<button type="button" className="quiet-button" disabled={busy||(rule.coins===""&&rule.gems==="")} onClick={()=>{setDraft(values=>values.map((v,i)=>i===index?{...v,coins:"",gems:""}:v));setStatus("");}}>{inherited?"Reprendre les tarifs généraux":"Effacer les deux tarifs"}</button>}
 </fieldset>;
 })}</div>}
 <p className="admin-helper">Les montants sont entiers. Les changements s’appliquent après enregistrement ; aucune vente ni modification de solde n’est effectuée ici.</p>
 {error&&<p className="admin-catalogue-error" role="alert">{error}</p>}
 <div className="admin-save-bar"><div role="status" aria-live="polite"><strong>{status||(!canEdit?"Consultation des tarifs":dirty?"Modifications non enregistrées":"Tarifs à jour")}</strong><span>{conflict?"Recharge pour obtenir les dernières valeurs.":"Les prix de marché réels ne sont pas convertis en monnaie du jeu."}</span></div><div className="admin-save-actions"><button type="button" className="quiet-button" disabled={busy||loading||!detail} onClick={refresh}><RefreshCw aria-hidden="true"/>Recharger</button><button type="button" className="quiet-button" disabled={!canEdit||busy||!dirty} onClick={()=>{if(detail)setDraft(drafts(detail));setError("");setStatus("");setConflict(false);}}><RotateCcw aria-hidden="true"/>Annuler</button><button type="submit" className="button game-primary" disabled={!canEdit||busy||loading||!detail||!dirty}><Save aria-hidden="true"/>{busy?"Enregistrement…":"Enregistrer les tarifs"}</button></div></div>
 </form>
 </>;
}
