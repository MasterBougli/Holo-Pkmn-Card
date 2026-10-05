"use client";
import Link from "next/link";
import { useEffect,useId,useRef,useState } from "react";
import type { CSSProperties } from "react";
import { Gift,Sparkles,ArrowRight,X,Layers3,ChevronLeft,ChevronRight,Scissors } from "lucide-react";
import type { BoosterPack,BoosterComposition,OwnedCard } from "@/lib/booster-types";
import { finishLabels } from "@/lib/card-metadata";
import { activeDefectNames } from "@/lib/card-defects";
import { OwnedCardVisual } from "./owned-card-visual";
import { CardViewer } from "./card-viewer";
import { DefectSurface } from "./defect-surface";
import { revealStyle,type RevealStyles } from "@/lib/booster-reveal";
import { BoosterPacket } from "./booster-packet";
type Inventory={packs:BoosterPack[];total:number;unopened:number};
type Odds={name:string;setCode:string;composition:BoosterComposition|null;active:boolean;complete:boolean};
type Step="ready"|"charging"|"opening"|"reveal"|"summary";
export function BoosterRoom({preview,previewArtwork,revealStyles={}}:{preview?:OwnedCard[];previewArtwork?:string|null;revealStyles?:RevealStyles}){
 const [inventory,setInventory]=useState<Inventory|null>(null),[page,setPage]=useState(0),[loading,setLoading]=useState(false),[error,setError]=useState("");
 const [pack,setPack]=useState<BoosterPack|null>(null),[odds,setOdds]=useState<Odds|null>(null),[cards,setCards]=useState<OwnedCard[]>([]),[step,setStep]=useState<Step>("ready");
 const [index,setIndex]=useState(0),[faceUp,setFaceUp]=useState(false),[review,setReview]=useState<number|null>(null),[revealed,setRevealed]=useState(0),[flipping,setFlipping]=useState(false);
 const [busy,setBusy]=useState(false),[skip,setSkip]=useState(false),[cut,setCut]=useState(0);
 const skipRequest=useRef(false),openingRequest=useRef(false);
 const dialog=useRef<HTMLDialogElement>(null),titleId=useId(),timer=useRef<ReturnType<typeof setTimeout>|null>(null),flipTimer=useRef<ReturnType<typeof setTimeout>|null>(null),returnFocus=useRef<HTMLElement|null>(null),mainCard=useRef<HTMLButtonElement|null>(null),heading=useRef<HTMLHeadingElement|null>(null),carousel=useRef<HTMLDivElement|null>(null);
 async function json(url:string,options?:RequestInit){
  if(preview){const first=preview[0];if(!first)throw Error("Aucune carte complète pour la démonstration.");
   if(options?.method==="POST")return {cards:preview,replayed:false};
   if(url.includes("?id="))return {name:first.setName,setCode:first.setCode,active:true,complete:true,composition:{slots:[{count:preview.length,choices:[{rarity:"Exemples visuels",weight:1}]}],defectPpm:0}};
   return {packs:[{id:"preview",setCode:first.setCode,setName:first.setName,artwork:previewArtwork??null,openedAt:null,createdAt:new Date().toISOString()}],total:1,unopened:1};
  }
  const r=await fetch(url,{cache:"no-store",...options}),d=await r.json();if(!r.ok)throw Error(d.error??"Connexion interrompue.");return d;
 }
 async function inventoryRefresh(){setLoading(true);try{setInventory(await json("/api/player/boosters?page="+page));}catch(e){setError((e as Error).message);}finally{setLoading(false);}}
 useEffect(()=>{const c=new AbortController();setLoading(true);setError("");json("/api/player/boosters?page="+page,{signal:c.signal}).then(d=>{if(!c.signal.aborted)setInventory(d);}).catch(e=>{if(!c.signal.aborted)setError(e.message);}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[page,preview,previewArtwork]);
 useEffect(()=>{
  if(!pack)return;const previous=document.body.style.overflow;document.body.style.overflow="hidden";dialog.current?.showModal();
  const c=new AbortController();setOdds(null);setCards([]);setStep("ready");setIndex(0);setFaceUp(false);setReview(null);setRevealed(0);setFlipping(false);setCut(0);setError("");setSkip(false);skipRequest.current=false;openingRequest.current=false;
  json("/api/player/boosters?id="+encodeURIComponent(pack.id),{signal:c.signal}).then(d=>{if(!c.signal.aborted)setOdds(d);}).catch(e=>{if(!c.signal.aborted)setError(e.message);});
  return()=>{c.abort();if(timer.current)clearTimeout(timer.current);if(flipTimer.current)clearTimeout(flipTimer.current);document.body.style.overflow=previous;dialog.current?.close();returnFocus.current?.focus();};
 },[pack]);
 useEffect(()=>{if(step==="reveal")mainCard.current?.focus();else if(step==="summary")heading.current?.focus();},[step,index]);
 useEffect(()=>{const rail=carousel.current;if(rail)rail.scrollTo({left:rail.scrollWidth,behavior:reduced()?"auto":"smooth"});},[revealed]);
 function reduced(){const motion=document.body.dataset.motion;return motion==="reduites"||motion==="desactivees"||(motion!=="normal"&&matchMedia("(prefers-reduced-motion: reduce)").matches);}
 async function open(){
  if(!pack||openingRequest.current)return;openingRequest.current=true;setBusy(true);setError("");setCut(100);setStep("charging");
  try{
   const result=await json("/api/player/boosters",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:pack.id})});setCards(result.cards);void inventoryRefresh();
   if(result.replayed||reduced()||skipRequest.current){setRevealed(result.cards.length);setStep("summary");}
   else{setStep("opening");timer.current=setTimeout(()=>{setStep("reveal");setFaceUp(false);},2600);}
  }catch(e){setError((e as Error).message);setStep("ready");setCut(0);openingRequest.current=false;}finally{setBusy(false);}
 }
 function skipAnimation(){skipRequest.current=true;setSkip(true);if(timer.current)clearTimeout(timer.current);if(cards.length){setRevealed(cards.length);setStep("summary");}}
 function close(){if(busy)return;setPack(null);void inventoryRefresh();}
 function activateCard(){
  if(flipping)return;
  if(review!==null){setReview(null);mainCard.current?.focus();return;}
  if(!faceUp){setFaceUp(true);setRevealed(n=>Math.max(n,index+1));if(!reduced()){setFlipping(true);flipTimer.current=setTimeout(()=>setFlipping(false),650);}return;}
  if(index+1===cards.length)setStep("summary");else{setIndex(i=>i+1);setFaceUp(false);}
 }
 function scrollCards(direction:number){const rail=carousel.current;rail?.scrollBy({left:direction*Math.max(180,rail.clientWidth*.65),behavior:reduced()?"auto":"smooth"});}
 const displayIndex=review??index,current=cards[displayIndex],shown=review!==null||faceUp,totalCards=odds?.composition?.slots.reduce((n,s)=>n+s.count,0)??0;
 const effect=current?revealStyle(current.rarity,revealStyles):null,special=shown&&!!effect?.enabled;
 const canOpen=!!odds&&(!!pack?.openedAt||!!odds.composition&&odds.active&&odds.complete);
 return <>
 <section className="booster-reserve"><Gift aria-hidden="true"/><div><strong>{preview?"Démonstration de l’animation":(inventory?.unopened??0)+" booster(s) prêt(s) à ouvrir"}</strong><p>{preview?"Cartes d’exemple fixes : aucun tirage réel, aucun booster consommé, aucune carte attribuée.":"Retrouve aussi tes ouvertures précédentes : leur contenu reste sauvegardé."}</p></div><Link className="button game-secondary" href="/collection">Voir ma collection <ArrowRight size={18}/></Link></section>
 {loading&&<p role="status">Chargement de ta réserve…</p>}
 {!loading&&inventory?.total===0&&<section className="booster-empty"><Layers3 size={44} aria-hidden="true"/><h2>Ta prochaine surprise se prépare</h2><p>Les boosters offerts apparaîtront ici. Explore les sets en attendant.</p><Link className="button game-secondary" href="/sets">Explorer les sets</Link></section>}
 <div className="booster-shelf">{inventory?.packs.map(p=><article className={"booster-pocket "+(p.openedAt?"is-opened":"")} key={p.id}><span className="booster-pocket-label">{p.openedAt?"SOUVENIR D’OUVERTURE":"À OUVRIR"}</span><BoosterPacket artwork={p.artwork} code={p.setCode}/><h2>{p.setName}</h2><p>{new Date(p.createdAt).toLocaleDateString("fr-FR")}</p><button type="button" className={p.openedAt?"quiet-button":"button game-primary"} onClick={e=>{returnFocus.current=e.currentTarget;setPack(p);}}>{p.openedAt?"Revoir les cartes":"Choisir ce booster"}<ArrowRight size={18}/></button></article>)}</div>
 {inventory&&inventory.total>24&&<nav className="booster-pagination" aria-label="Pages de boosters"><button type="button" className="quiet-button" disabled={page===0||loading} onClick={()=>setPage(p=>p-1)}>Précédente</button><span>Page {page+1}</span><button type="button" className="quiet-button" disabled={(page+1)*24>=inventory.total||loading} onClick={()=>setPage(p=>p+1)}>Suivante</button></nav>}
 {error&&!pack&&<p role="alert">{error}</p>}
 {pack&&<dialog ref={dialog} className="booster-opening-dialog" aria-labelledby={titleId} onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.currentTarget===e.target)close();}}>
 <header className="booster-dialog-header"><div><span className="section-kicker">{preview?"APERÇU · SANS ATTRIBUTION":"LA TABLE D’OUVERTURE"}</span><h2 id={titleId}>{pack.setName}</h2></div><button type="button" className="quiet-button" disabled={busy} aria-label="Fermer l’ouverture" onClick={close}><X size={22}/></button></header>
 <div className="booster-dialog-body" data-step={step} data-skip={skip}>
 {(step==="ready"||step==="charging"||step==="opening")&&<section className="booster-ritual">
 <div className="ritual-spotlight" aria-hidden="true"/><div className="ritual-ring" aria-hidden="true"/>
 <p className="ritual-instruction" role="status">{step==="charging"?"Préparation de tes cartes…":step==="opening"?"Le sceau est rompu. Tes cartes arrivent.":pack.openedAt?"Ton tirage est conservé.":"Glisse sur la bande collée pour ouvrir le paquet."}</p>
 <div className="ritual-pack-stage" data-cut={cut>=96} data-opening={step==="opening"}>
 <BoosterPacket artwork={pack.artwork} code={pack.setCode} cut={cut} opening={step==="opening"}/>
 {step==="ready"&&!pack.openedAt&&<label className="packet-seam-slider"><span className="sr-only">Couper le haut du booster : glisser vers la droite, ou utiliser les flèches et Fin au clavier</span><input type="range" min={0} max={100} step={1} value={cut} disabled={!canOpen||busy} aria-valuetext={cut+" % de la bande découpée"} onChange={e=>{const n=Number(e.target.value);setCut(n);if(n>=96)void open();}}/><span className="seam-hint" aria-hidden="true"><Scissors size={18}/>GLISSE POUR DÉCOUPER<ArrowRight size={18}/></span></label>}
 {step==="opening"&&<><div className="emerging-card-stack" aria-hidden="true">{Array.from({length:Math.min(totalCards||5,5)},(_,i)=><img key={i} src="/media/Cards/card-back.png" alt="" style={{"--fan":(i-2)*8+"deg","--order":i} as CSSProperties}/>)}</div><div className="ritual-particles" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{"--ray":i*30+"deg","--delay":(i%3)*.12+"s"} as CSSProperties}/>)}</div></>}
 </div>
 {step==="ready"&&<><p className="ritual-pack-count">{totalCards?totalCards+" cartes à découvrir":"Contenu en préparation"}</p>
 <button type="button" className={pack.openedAt?"button game-primary":"quiet-button opening-alternative"} disabled={!canOpen||busy} onClick={open}>{pack.openedAt?"Revoir mon tirage":"Ouvrir sans glisser"}<ArrowRight size={18}/></button>
 {!pack.openedAt&&odds&&(!odds.active||!odds.complete)&&<p>Ce set est temporairement indisponible. Ton booster est conservé.</p>}
 {odds?.composition&&!preview&&<details className="booster-odds"><summary>Contenu et probabilités</summary>{odds.composition.slots.map((s,i)=><div key={i}><strong>Groupe {i+1} · {s.count} carte(s)</strong><ul>{s.choices.map(c=><li key={c.rarity}>{c.rarity} : {(100*c.weight/s.choices.reduce((n,v)=>n+v.weight,0)).toLocaleString("fr-FR",{maximumFractionDigits:4})} %</li>)}</ul></div>)}<p>Cartes équiprobables au sein d’une rareté ; doublons possibles.</p><p>Défaut : {odds.composition.defectPpm} par million. Un second tirage au même taux permet le cumul. Le prix de base ne change pas.</p></details>}</>}
 {(step==="charging"||step==="opening")&&<p className="ritual-save-note">{preview?"Démonstration visuelle : aucun exemplaire attribué.":"Tes cartes sont sauvegardées avant leur révélation."}</p>}
 </section>}
 {step==="reveal"&&current&&<section className="booster-reveal">
 <div className="reveal-heading" aria-live="polite"><p className="reveal-counter">{review!==null?"CARTE RECONSULTÉE":"CARTE "+(index+1)+" / "+cards.length}</p><h3>{shown?current.name:"Une carte attend d’être révélée"}</h3></div>
 <div className="reveal-stage" data-finish={shown?current.finish:"hidden"} data-special={special} data-celebrate={special&&review===null} style={special?{"--rarity-color":effect!.color} as CSSProperties:undefined}>
 <div className="reveal-aura" aria-hidden="true"/>{special&&<div className="rarity-reveal-rays" key={displayIndex} aria-hidden="true">{Array.from({length:8},(_,i)=><i key={i} style={{"--ray":i*45+"deg"} as CSSProperties}/>)}</div>}
 <button ref={mainCard} type="button" className={"turn-card "+(shown?"is-face-up":"")} aria-label={review!==null?"Revenir à la carte en cours":!faceUp?"Révéler la carte "+(index+1):index+1===cards.length?"Voir le récapitulatif":"Passer à la carte suivante"} aria-describedby={titleId+"-card-help"} aria-disabled={flipping} onClick={activateCard}>
 <span className="turn-card-inner" key={displayIndex}><span className="turn-card-back" aria-hidden={shown}><img src="/media/Cards/card-back.png" alt="Dos de carte" draggable={false}/></span><span className="turn-card-front" aria-hidden={!shown}><OwnedCardVisual card={current}/></span></span>
 </button></div>
 <div className="reveal-caption" aria-live="polite">{shown?<><p className="reveal-rarity"><Sparkles aria-hidden="true"/>{current.rarity} · {finishLabels[current.finish]}</p>{current.isNew&&<span className="discovery-stamp">NOUVEAU DANS TON CLASSEUR</span>}{current.defects&&<p>{activeDefectNames(current.defects.settings).join(" · ")}</p>}<p>{current.setCode} · n°{current.localId}</p></>:<span className="reveal-secret">Le prochain souvenir de ta collection</span>}
 <p id={titleId+"-card-help"} className="reveal-click-help">{review!==null?"Clique sur la carte pour reprendre l’ouverture.":faceUp?"Reclique sur la carte pour continuer.":"Clique sur la carte pour la retourner."} <span>Entrée ou Espace au clavier</span></p></div>
 {revealed>0&&<section className="reveal-history" aria-label="Cartes déjà révélées"><div className="history-heading"><h3>Tes découvertes</h3><span>{revealed} / {cards.length}</span></div><div className="history-navigation"><button type="button" className="quiet-button" aria-label="Défiler les cartes précédentes vers la gauche" onClick={()=>scrollCards(-1)}><ChevronLeft/></button><div ref={carousel} className="reveal-carousel" tabIndex={0} aria-label="Carrousel des cartes révélées" onKeyDown={e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();scrollCards(e.key==="ArrowLeft"?-1:1);}}}>{cards.slice(0,revealed).map((c,i)=><button type="button" className="revealed-mini-card" key={c.id} aria-label={"Revoir "+c.name+" · carte "+(i+1)} aria-pressed={review===i} onClick={()=>{setReview(i);setFlipping(false);}}><img src={"/media/Cards/"+c.setCode+"/"+c.cardId+".png"} alt="" loading="lazy"/><span>{c.name}</span></button>)}</div><button type="button" className="quiet-button" aria-label="Défiler les cartes précédentes vers la droite" onClick={()=>scrollCards(1)}><ChevronRight/></button></div></section>}
 </section>}
 {step==="summary"&&<section className="booster-summary"><span className="discovery-stamp">{preview?"DÉMONSTRATION SANS ATTRIBUTION":"AJOUTÉES À TA COLLECTION"}</span><h3 ref={heading} tabIndex={-1}>{cards.length} cartes, de nouvelles histoires</h3><p>{preview?"Ces exemples n’ont pas été ajoutés à une collection.":"Ton tirage est sauvegardé. Tu peux retrouver ces mêmes cartes dans l’historique."}</p><div className="booster-summary-grid">{cards.map(c=><article key={c.id}>{preview?<img src={"/media/Cards/"+c.setCode+"/"+c.cardId+".png"} alt={c.name} loading="lazy"/>:<CardViewer card={{id:c.cardId,name:c.name,localId:c.localId,rarity:c.rarity}} setCode={c.setCode} setName={c.setName} owned={c}><span className="booster-summary-art">{c.defects?<DefectSurface setCode={c.setCode} cardId={c.cardId} neighborId={c.defects.neighborId} settings={c.defects.settings}/>:<img src={"/media/Cards/"+c.setCode+"/"+c.cardId+".png"} alt={c.name} loading="lazy"/>}</span></CardViewer>}<h4>{c.name}</h4><p>{c.rarity} · {finishLabels[c.finish]}</p>{c.defects&&<p>{activeDefectNames(c.defects.settings).join(" · ")}</p>}{c.isNew&&<span>Nouveau</span>}</article>)}</div><div className="booster-summary-actions"><Link className="button game-primary" href="/collection">Ouvrir mon classeur</Link><button type="button" className="quiet-button" onClick={close}>Retour aux boosters</button></div></section>}
 {error&&<p className="booster-error" role="alert">{error}</p>}
 </div>
 {(step==="charging"||step==="opening"||step==="reveal")&&<footer className="booster-dialog-footer"><span>{preview?"Aperçu sans attribution":"Ton tirage est sauvegardé"}</span><button type="button" className="quiet-button" onClick={skipAnimation}>{skip?"Animation désactivée":"Voir toutes les cartes"}</button></footer>}
 </dialog>}
 </>;
}
