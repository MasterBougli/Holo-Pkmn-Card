"use client";
import Link from "next/link";
import { useEffect,useId,useRef,useState } from "react";
import { Gift,Sparkles,ArrowRight,X,Layers3 } from "lucide-react";
import type { BoosterPack,BoosterComposition,OwnedCard } from "@/lib/booster-types";
import { finishLabels } from "@/lib/card-metadata";
import { activeDefectNames } from "@/lib/card-defects";
import { OwnedCardVisual } from "./owned-card-visual";
type Inventory={packs:BoosterPack[];total:number;unopened:number};
type Odds={name:string;setCode:string;composition:BoosterComposition|null;active:boolean;complete:boolean};
export function BoosterRoom({preview}:{preview?:OwnedCard[]}){
 const [inventory,setInventory]=useState<Inventory|null>(null),[page,setPage]=useState(0),[loading,setLoading]=useState(false),[error,setError]=useState("");
 const [pack,setPack]=useState<BoosterPack|null>(null),[odds,setOdds]=useState<Odds|null>(null),[cards,setCards]=useState<OwnedCard[]>([]),[step,setStep]=useState<"ready"|"opening"|"reveal"|"summary">("ready"),[index,setIndex]=useState(0),[faceUp,setFaceUp]=useState(false),[busy,setBusy]=useState(false),[skip,setSkip]=useState(false);
 const skipRequest=useRef(false);
 const dialog=useRef<HTMLDialogElement>(null),titleId=useId(),timer=useRef<ReturnType<typeof setTimeout>|null>(null),returnFocus=useRef<HTMLElement|null>(null),heading=useRef<HTMLHeadingElement|null>(null);
 async function json(url:string,options?:RequestInit){
  if(preview){const first=preview[0];if(!first)throw Error("Aucune carte complète pour la démonstration.");if(options?.method==="POST")return {cards:preview,replayed:false};if(url.includes("?id="))return {name:first.setName,setCode:first.setCode,active:true,complete:true,composition:{slots:[{count:preview.length,choices:[{rarity:"Exemples visuels",weight:1}]}],defectPpm:0}};return {packs:[{id:"preview",setCode:first.setCode,setName:first.setName,openedAt:null,createdAt:new Date().toISOString()}],total:1,unopened:1};}
  const r=await fetch(url,{cache:"no-store",...options}),d=await r.json();if(!r.ok)throw Error(d.error??"Connexion interrompue.");return d;}
 async function inventoryRefresh(){setLoading(true);try{setInventory(await json("/api/player/boosters?page="+page));}catch(e){setError((e as Error).message);}finally{setLoading(false);}}
 useEffect(()=>{const c=new AbortController();setLoading(true);setError("");json("/api/player/boosters?page="+page,{signal:c.signal}).then(d=>{if(!c.signal.aborted)setInventory(d);}).catch(e=>{if(!c.signal.aborted)setError(e.message);}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[page]);
 useEffect(()=>{
  if(!pack)return;const previous=document.body.style.overflow;document.body.style.overflow="hidden";dialog.current?.showModal();
  const c=new AbortController();setOdds(null);setCards([]);setStep("ready");setIndex(0);setFaceUp(false);setError("");setSkip(false);skipRequest.current=false;
  json("/api/player/boosters?id="+encodeURIComponent(pack.id),{signal:c.signal}).then(d=>{if(!c.signal.aborted)setOdds(d);}).catch(e=>{if(!c.signal.aborted)setError(e.message);});
  return()=>{c.abort();if(timer.current)clearTimeout(timer.current);document.body.style.overflow=previous;dialog.current?.close();returnFocus.current?.focus();};
 },[pack]);
 useEffect(()=>{if(step==="reveal"||step==="summary")heading.current?.focus();},[step,index,faceUp]);
 function reduced(){const motion=document.body.dataset.motion;return motion==="reduites"||motion==="desactivees"||(motion!=="normal"&&matchMedia("(prefers-reduced-motion: reduce)").matches);}
 async function open(){
  if(!pack||busy)return;setBusy(true);setError("");setStep("opening");
  try{const result=await json("/api/player/boosters",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:pack.id})});
   setCards(result.cards);await inventoryRefresh();
   if(result.replayed||reduced()||skipRequest.current){setStep("summary");}else timer.current=setTimeout(()=>{setStep("reveal");setFaceUp(false);},1400);
  }catch(e){setError((e as Error).message);setStep("ready");}finally{setBusy(false);}
 }
 function skipAnimation(){skipRequest.current=true;setSkip(true);if(timer.current)clearTimeout(timer.current);if(cards.length)setStep("summary");}
 function close(){if(busy)return;setPack(null);void inventoryRefresh();}
 const current=cards[index],totalCards=odds?.composition?.slots.reduce((n,s)=>n+s.count,0)??0;
 return <>
 <section className="booster-reserve"><Gift aria-hidden="true"/><div><strong>{preview?"Démonstration de l’animation":(inventory?.unopened??0)+" booster(s) prêt(s) à ouvrir"}</strong><p>{preview?"Cartes d’exemple fixes : aucun tirage réel, aucun booster consommé, aucune carte attribuée.":"Retrouve aussi tes ouvertures précédentes : leur contenu reste sauvegardé."}</p></div><Link className="button game-secondary" href="/collection">Voir ma collection <ArrowRight size={18}/></Link></section>
 {loading&&<p role="status">Chargement de ta réserve…</p>}
 {!loading&&inventory?.total===0&&<section className="booster-empty"><Layers3 size={44} aria-hidden="true"/><h2>Ta prochaine surprise se prépare</h2><p>Les boosters offerts apparaîtront ici. Explore les sets en attendant.</p><Link className="button game-secondary" href="/sets">Explorer les sets</Link></section>}
 <div className="booster-shelf">{inventory?.packs.map(p=><article className={"booster-pocket "+(p.openedAt?"is-opened":"")} key={p.id}><span className="booster-pocket-label">{p.openedAt?"SOUVENIR D’OUVERTURE":"À OUVRIR"}</span><div className="booster-packet" aria-hidden="true"><span className="packet-crimp"/><span className="packet-emblem"><Sparkles size={52}/></span><img src={"/media/Boosters/"+p.setCode+"/"+p.setCode+"-0.png"} alt="" onError={e=>{e.currentTarget.hidden=true;}}/><strong>{p.setCode}</strong><span className="packet-crimp bottom"/></div><h2>{p.setName}</h2><p>{new Date(p.createdAt).toLocaleDateString("fr-FR")}</p><button type="button" className={p.openedAt?"quiet-button":"button game-primary"} onClick={e=>{returnFocus.current=e.currentTarget;setPack(p);}}>{p.openedAt?"Revoir les cartes":"Choisir ce booster"}<ArrowRight size={18}/></button></article>)}</div>
 {inventory&&inventory.total>24&&<nav className="booster-pagination" aria-label="Pages de boosters"><button type="button" className="quiet-button" disabled={page===0||loading} onClick={()=>setPage(p=>p-1)}>Précédente</button><span>Page {page+1}</span><button type="button" className="quiet-button" disabled={(page+1)*24>=inventory.total||loading} onClick={()=>setPage(p=>p+1)}>Suivante</button></nav>}
 {error&&!pack&&<p role="alert">{error}</p>}
 {pack&&<dialog ref={dialog} className="booster-opening-dialog" aria-labelledby={titleId} onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.currentTarget===e.target)close();}}>
 <header className="booster-dialog-header"><span className="section-kicker">RITUEL D’OUVERTURE</span><button type="button" className="quiet-button" disabled={busy} aria-label="Fermer l’ouverture" onClick={close}><X size={22}/></button></header>
 <div className="booster-dialog-body" data-step={step} data-skip={skip}><div className="summon-lines" aria-hidden="true"/>
 {step==="ready"&&<section className="booster-ready"><h2 id={titleId}>{pack.setName}</h2><div className="booster-packet hero-packet" aria-hidden="true"><span className="packet-crimp"/><span className="packet-emblem"><Sparkles size={72}/></span><img src={"/media/Boosters/"+pack.setCode+"/"+pack.setCode+"-0.png"} alt="" onError={e=>{e.currentTarget.hidden=true;}}/><strong>{pack.setCode}</strong><span className="packet-crimp bottom"/></div>
 {odds?.composition?<><p>{totalCards} cartes dans ce booster · une finition fixe par carte.</p>{!preview&&<details className="booster-odds"><summary>Contenu et probabilités</summary>{odds.composition.slots.map((s,i)=><div key={i}><strong>Groupe {i+1} · {s.count} carte(s)</strong><ul>{s.choices.map(c=><li key={c.rarity}>{c.rarity} : {(100*c.weight/s.choices.reduce((n,v)=>n+v.weight,0)).toLocaleString("fr-FR",{maximumFractionDigits:4})} %</li>)}</ul></div>)}<p>Chaque carte est choisie avec la même chance au sein de sa rareté. Des doublons sont possibles.</p><p>Défaut : {odds.composition.defectPpm} par million de cartes. Le cumul de deux défauts utilise ce taux une seconde fois. Les défauts ne changent pas le prix de base.</p></details>}</>:<p>{odds?"Composition en attente de configuration.":"Chargement du contenu…"}</p>}
 {!pack.openedAt&&odds&&(!odds.active||!odds.complete)&&<p>Ce set est temporairement indisponible. Ton booster reste dans ta réserve.</p>}
 <button type="button" className="button game-primary opening-cta" disabled={busy||!odds||(!pack.openedAt&&(!odds.composition||!odds.active||!odds.complete))} onClick={open}><Sparkles size={20}/>{pack.openedAt?"Revoir mon tirage":"Ouvrir mon booster"}</button></section>}
 {step==="opening"&&<section className="booster-summoning"><h2 id={titleId} role="status">{busy?"Ouverture en cours…":"Tes cartes arrivent"}</h2><div className="summon-orbit" aria-hidden="true"/><div className="booster-packet hero-packet tearing-packet" aria-hidden="true"><span className="packet-crimp"/><span className="packet-emblem"><Sparkles size={72}/></span><strong>{pack.setCode}</strong></div><p>{preview?"Aperçu visuel uniquement.":"Les cartes sont enregistrées avant leur révélation."}</p></section>}
 {step==="reveal"&&current&&<section className="booster-reveal" key={index}><p className="reveal-counter">CARTE {index+1} / {cards.length}</p><h2 ref={heading} tabIndex={-1} id={titleId}>{faceUp?current.name:"Une nouvelle découverte"}</h2><div data-finish={current.finish} className={"reveal-card "+(faceUp?"is-revealed":"")}><div className="reveal-aura" aria-hidden="true"/>{faceUp?<OwnedCardVisual card={current}/>:<button type="button" className="reveal-back" aria-label={"Révéler la carte "+(index+1)} onClick={()=>setFaceUp(true)}><img src="/media/Cards/card-back.png" alt="Dos de carte"/><span>Toucher pour révéler</span></button>}</div>
 {faceUp&&<><p className="reveal-rarity"><Sparkles aria-hidden="true"/>{current.rarity} · {finishLabels[current.finish]}</p>{current.isNew&&<span className="discovery-stamp">NOUVEAU DANS TON CLASSEUR</span>}{current.defects&&<p>{activeDefectNames(current.defects.settings).join(" · ")}</p>}<p>{current.setName} · n°{current.localId}</p><button type="button" className="button game-primary" onClick={()=>{if(index+1===cards.length)setStep("summary");else{setIndex(i=>i+1);setFaceUp(false);}}}>{index+1===cards.length?"Voir mes trouvailles":"Carte suivante"}<ArrowRight size={18}/></button></>}</section>}
 {step==="summary"&&<section className="booster-summary"><span className="discovery-stamp">{preview?"DÉMONSTRATION SANS ATTRIBUTION":"AJOUTÉES À TA COLLECTION"}</span><h2 ref={heading} tabIndex={-1} id={titleId}>{cards.length} cartes, de nouvelles histoires</h2><p>{preview?"Ces cartes servent seulement à montrer l’animation. Elles n’ont pas été ajoutées à une collection.":"Ton tirage est sauvegardé. Les mêmes cartes seront affichées si tu reviens sur cette ouverture."}</p><div className="booster-summary-grid">{cards.map(c=><article key={c.id}><img src={"/media/Cards/"+c.setCode+"/"+c.cardId+".png"} alt={c.name} loading="lazy"/><h3>{c.name}</h3><p>{c.rarity} · {finishLabels[c.finish]}</p>{c.defects&&<p>{activeDefectNames(c.defects.settings).join(" · ")}</p>}{c.isNew&&<span>Nouveau</span>}</article>)}</div><div className="booster-summary-actions"><Link className="button game-primary" href="/collection">Ouvrir mon classeur</Link><button type="button" className="quiet-button" onClick={close}>Retour aux boosters</button></div></section>}
 {error&&<p className="booster-error" role="alert">{error}</p>}
 {(step==="opening"||step==="reveal")&&<button type="button" className="quiet-button skip-opening" onClick={skipAnimation}>{skip?"Animation désactivée":"Passer l’animation"}</button>}
 </div></dialog>}
 </>;
}
