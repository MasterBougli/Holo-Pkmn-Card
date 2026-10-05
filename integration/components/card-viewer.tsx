"use client";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { X } from "lucide-react";
import type { OwnedCard } from "@/lib/booster-types";
import { DefectSurface } from "@/components/defect-surface";
import { activeDefectNames } from "@/lib/card-defects";
import { CardThickness } from "@/components/card-thickness";
import { HoloSurface } from "@/components/holo-surface";
import { resolveCardAppearance,type AppearanceOverrides,type CardFinish,type HoloEffect } from "@/lib/card-appearance";
import { availableFinishes,finishLabels,type AvailableFinish } from "@/lib/card-metadata";
import type { ResolvedPrice } from "@/lib/card-prices";
import type { CatalogueCard } from "@/lib/catalogue";
import { CollectionFavorite } from "./collection-favorite";
import { CollectionCopies } from "./collection-copies";
import type { CollectionGroupContext } from "@/lib/collection-copy-types";

type CardDetails = { availableFinishes?:AvailableFinish[]; illustrator?:string; rarity?:string; set?:{cardCount?:{official?:number}}; variants?:{holo?:boolean;reverse?:boolean;normal?:boolean} };
const finishNames={normal:"Normale",reverse:"Reverse",fullart:"Full art"};
const effectNames={none:"Sans effet",classic:"Classique",illusion:"Illusion",glitter:"Glitter · paillettes",rainbow:"Rainbow",galaxy:"Cosmos · galaxy"};
export function CardViewer({card,setCode,setName,children,previewProfiles,owned:initialOwned,collectionGroup,allowFavorites=false,onFavoritesChanged}:{card:CatalogueCard;setCode:string;setName:string;children:React.ReactNode;previewProfiles?:AppearanceOverrides;owned?:OwnedCard;collectionGroup?:CollectionGroupContext;allowFavorites?:boolean;onFavoritesChanged?:()=>void}) {
  const uid=useId();
  const dialog=useRef<HTMLDialogElement>(null);
  const trigger=useRef<HTMLButtonElement>(null);
  const drag=useRef<{x:number;y:number;rx:number;ry:number}|null>(null);
  const [open,setOpen]=useState(false);
  const [selectedOwned,setSelectedOwned]=useState<OwnedCard|null>(null);
  const owned=selectedOwned??initialOwned;
  const favoritesChanged=useRef(false);
  const [rotation,setRotation]=useState({x:0,y:0});
  const [finish,setFinish]=useState<CardFinish>("normal");
  const [effect,setEffect]=useState<HoloEffect>("none");
  const [profiles,setProfiles]=useState<AppearanceOverrides>({});
  const [details,setDetails]=useState<CardDetails|null>(null);
  const [prices,setPrices]=useState<Partial<Record<AvailableFinish,ResolvedPrice>>>({});
  const [circulation,setCirculation]=useState<string|null>(null);
  const [circulationError,setCirculationError]=useState(false);

  useEffect(()=>{
    if(!open||!owned)return;
    const controller=new AbortController();
    setCirculation(null);setCirculationError(false);
    const query=new URLSearchParams({setCode,cardId:card.id});
    fetch("/api/player/cards/circulation?"+query,{cache:"no-store",signal:controller.signal})
      .then(async response=>{if(!response.ok)throw Error();const data=await response.json();if(typeof data.total!=="string"||!/^\d+$/.test(data.total))throw Error();return data.total as string;})
      .then(total=>{if(!controller.signal.aborted)setCirculation(total);})
      .catch(()=>{if(!controller.signal.aborted)setCirculationError(true);});
    return()=>controller.abort();
  },[open,!!owned,setCode,card.id]);

  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const [frontMissing,setFrontMissing]=useState(false);
  const [backMissing,setBackMissing]=useState(false);
  useEffect(()=>{
    if(!open){setSelectedOwned(null);if(favoritesChanged.current){favoritesChanged.current=false;onFavoritesChanged?.();}return;}
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    dialog.current?.showModal();
    return()=>{drag.current=null;document.body.style.overflow=previousOverflow;dialog.current?.close();trigger.current?.focus()};
  },[open]);
  useEffect(()=>{
    if(!open)return;
    const controller=new AbortController();
    setPrices({});setLoading(true);setError("");setDetails(null);setRotation({x:0,y:0});setFinish("normal");setEffect("none");
    fetch("/api/catalogue/"+encodeURIComponent(setCode)+"/"+encodeURIComponent(card.id),{signal:controller.signal})
      .then(async response=>{if(!response.ok)throw new Error();return response.json()})
       .then(data=>{
        setDetails(data.details);setPrices(data.prices??{});
        const next=previewProfiles??data.appearance??{};
        setProfiles(next);
        const fixed=owned?.finish??(data.details?.availableFinishes?.length===1?data.details.availableFinishes[0]:null);
        const start:CardFinish=fixed==="reverse"?"reverse":fixed==="fullart"?"fullart":"normal";
        setFinish(start);setEffect(fixed==="normal"||!fixed?"none":resolveCardAppearance(start,next).effect);
      })
      .catch(()=>{if(!controller.signal.aborted)setError("Certaines informations ne sont pas disponibles.")})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
    return()=>controller.abort();
  },[open,card.id,setCode,previewProfiles,owned?.finish]);
  function move(event:PointerEvent<HTMLDivElement>){
    if(!drag.current)return;
    setRotation({x:Math.max(-40,Math.min(40,drag.current.rx-(event.clientY-drag.current.y)*0.2)),y:drag.current.ry+(event.clientX-drag.current.x)*0.8});
  }
  const saleVersions=owned?[owned.finish]:(details?.availableFinishes?.length===1?details.availableFinishes:[]).filter(version=>availableFinishes.includes(version));
  const saleVersion=saleVersions[0];
  const salePrice=saleVersion?prices[saleVersion]:undefined;
  const showPrice=(value:number|null|undefined)=>value==null?"À définir":value.toLocaleString("fr-FR");
  const profile={...resolveCardAppearance(finish,profiles),effect};
  const backVisible=Math.cos(rotation.y*Math.PI/180)<0;
  return <>
    <button ref={trigger} type="button" className="card-open" onClick={()=>setOpen(true)} aria-label={"Voir "+card.name+" en grand et consulter ses informations"}>{children}</button>
    {open&&createPortal(<dialog ref={dialog} className="card-dialog" aria-labelledby={uid+"-title"} onCancel={event=>{event.preventDefault();setOpen(false)}} onClick={event=>{if(event.target===event.currentTarget)setOpen(false)}}>
      <header className="card-dialog-header"><h2 id={uid+"-title"}>Fiche de carte</h2><button className="quiet-button" type="button" onClick={()=>setOpen(false)} aria-label="Fermer la fiche de la carte" autoFocus><X aria-hidden="true"/></button></header>
      <div className="card-dialog-scroll"><section className="card-inspection" aria-label="Illustration de la carte">
        <div className="card-stage" tabIndex={0} role="group" aria-label={"Carte "+card.name+", rotation à 360 degrés"} aria-describedby={uid+"-help"} onKeyDown={event=>{
          if(!["ArrowLeft","ArrowRight","Home"].includes(event.key))return;
          event.preventDefault();
          setRotation(v=>({x:0,y:event.key==="Home"?0:v.y+(event.key==="ArrowLeft"?-90:90)}));
        }} onPointerDown={event=>{if(event.button!==0)return;event.currentTarget.focus();event.currentTarget.setPointerCapture(event.pointerId);drag.current={x:event.clientX,y:event.clientY,rx:rotation.x,ry:rotation.y}}} onPointerMove={move} onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}} onLostPointerCapture={()=>{drag.current=null}}>
          <div className="card-rotator" style={{transform:"rotateX("+rotation.x+"deg) rotateY("+rotation.y+"deg)"}}>
            <CardThickness/>
            <HoloSurface hidden={backVisible} profile={profile} rotation={rotation}>{owned?.defects?<DefectSurface setCode={setCode} cardId={card.id} neighborId={owned.defects.neighborId} settings={owned.defects.settings}/>:frontMissing?<p>Illustration indisponible</p>:<Image src={"/media/Cards/"+setCode+"/"+card.id+".png"} width={600} height={825} unoptimized alt={card.name+", recto"} draggable={false} onError={()=>setFrontMissing(true)}/>}</HoloSurface>
            <div className="card-face card-back" aria-hidden={!backVisible}>{backMissing?<p>Dos de carte indisponible</p>:<Image src="/media/Cards/card-back.png" width={600} height={825} unoptimized alt="Dos de la carte Pokémon" draggable={false} onError={()=>setBackMissing(true)}/>}</div>
          </div>
        </div>
        <p id={uid+"-help"} className="card-view-help">Glisser pour tourner · Flèches gauche/droite au clavier · Début pour le recto</p>
        {previewProfiles&&<><label className="card-finish" htmlFor={uid+"-finish"}>Aperçu de finition<select id={uid+"-finish"} value={finish} onChange={event=>{const next=event.target.value as CardFinish;setFinish(next);setEffect(resolveCardAppearance(next,profiles).effect)}}>{Object.entries(finishNames).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        <label className="card-finish" htmlFor={uid+"-effect"}>Aperçu de l’effet<select id={uid+"-effect"} value={effect} onChange={event=>setEffect(event.target.value as HoloEffect)}>{Object.entries(effectNames).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        <p className="card-finish-note">Prévisualisation administrative. <a href="/a-propos#open-source">Sources et crédits</a></p></>}
      </section>
      <section className="card-information" aria-label="Informations de la carte" aria-busy={loading}>
        <dl className="card-summary">
          <div className="card-summary-wide"><dt>Set</dt><dd>{owned?.setName??setName} ({setCode})</dd></div>
          <div><dt>Numéro / Max</dt><dd>{owned?.localId??card.localId} / {owned?.max??details?.set?.cardCount?.official??"—"}</dd></div>
          <div><dt>Nom</dt><dd>{owned?.name??card.name}</dd></div>
          <div><dt>Rareté</dt><dd>{owned?.rarity||details?.rarity||card.rarity||"Non renseignée"}</dd></div>
          <div><dt>Illustrateur</dt><dd>{owned?.illustrator||details?.illustrator|| (loading?"Chargement…":"Non renseigné")}</dd></div>
          <div><dt>Finition</dt><dd>{saleVersion?finishLabels[saleVersion]:"À définir"}</dd></div>
          {owned&&<div className="card-summary-wide"><dt>Exemplaires en circulation</dt><dd aria-live="polite">{circulationError?"Indisponible":circulation===null?"Chargement…":BigInt(circulation).toLocaleString("fr-FR")}</dd><dd className="card-finish-note">Toutes les collections de joueurs, exemplaires avec défauts inclus.</dd></div>}
          {owned?.defects&&<div className="card-summary-wide"><dt>Défauts de cet exemplaire</dt><dd>{activeDefectNames(owned.defects.settings).join(" · ")}</dd></div>}
          <div><dt>Revente en pièces</dt><dd>{showPrice(salePrice?.coins)}</dd></div>
          <div><dt>Revente en gemmes</dt><dd>{showPrice(salePrice?.gems)}</dd></div>
        </dl>
        {error&&<p role="status">{error}</p>}
        {allowFavorites&&owned&&<CollectionFavorite key={owned.id} id={owned.id} onChange={()=>{if(dialog.current?.open)favoritesChanged.current=true;else onFavoritesChanged?.();}}/>}
        {collectionGroup&&owned&&<CollectionCopies group={collectionGroup} selectedId={owned.id} onSelect={copy=>{setSelectedOwned(copy);setRotation({x:0,y:0});}}/>}
      </section></div>
    </dialog>,document.body)}
  </>;
}
