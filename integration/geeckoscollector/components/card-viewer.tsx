"use client";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { X } from "lucide-react";
import { CardThickness } from "@/components/card-thickness";
import { HoloSurface } from "@/components/holo-surface";
import { resolveCardAppearance,type AppearanceOverrides,type CardFinish,type HoloEffect } from "@/lib/card-appearance";
import { availableFinishes,finishLabels,type AvailableFinish } from "@/lib/card-metadata";
import type { ResolvedPrice } from "@/lib/card-prices";
import type { CatalogueCard } from "@/lib/catalogue";

type CardDetails = { availableFinishes?:AvailableFinish[]; illustrator?:string; rarity?:string; set?:{cardCount?:{official?:number}}; variants?:{holo?:boolean;reverse?:boolean;normal?:boolean} };
const finishNames={normal:"Normale",reverse:"Reverse",fullart:"Full art"};
const effectNames={none:"Sans effet",classic:"Classique",illusion:"Illusion",glitter:"Glitter · paillettes",rainbow:"Rainbow",galaxy:"Cosmos · galaxy"};
export function CardViewer({card,setCode,setName,children,previewProfiles}:{card:CatalogueCard;setCode:string;setName:string;children:React.ReactNode;previewProfiles?:AppearanceOverrides}) {
  const uid=useId();
  const dialog=useRef<HTMLDialogElement>(null);
  const trigger=useRef<HTMLButtonElement>(null);
  const drag=useRef<{x:number;y:number;rx:number;ry:number}|null>(null);
  const [open,setOpen]=useState(false);
  const [rotation,setRotation]=useState({x:0,y:0});
  const [finish,setFinish]=useState<CardFinish>("normal");
  const [effect,setEffect]=useState<HoloEffect>("none");
  const [profiles,setProfiles]=useState<AppearanceOverrides>({});
  const [details,setDetails]=useState<CardDetails|null>(null);
  const [prices,setPrices]=useState<Partial<Record<AvailableFinish,ResolvedPrice>>>({});
  const [priceFinish,setPriceFinish]=useState<AvailableFinish>("normal");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const [frontMissing,setFrontMissing]=useState(false);
  const [backMissing,setBackMissing]=useState(false);
  useEffect(()=>{
    if(!open)return;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const controller=new AbortController();
    dialog.current?.showModal();
    setPrices({});setPriceFinish("normal");setLoading(true);setError("");setDetails(null);setRotation({x:0,y:0});setFinish("normal");setEffect("none");
    fetch("/api/catalogue/"+encodeURIComponent(setCode)+"/"+encodeURIComponent(card.id),{signal:controller.signal})
      .then(async response=>{if(!response.ok)throw new Error();return response.json()})
       .then(data=>{
        setDetails(data.details);setPrices(data.prices??{});
        const next=previewProfiles??data.appearance??{};
        setProfiles(next);
        const start:CardFinish=/full.?art|illustration rare/i.test(data.details?.rarity??"")?"fullart":"normal";
        setFinish(start);setEffect(resolveCardAppearance(start,next).effect);
      })
      .catch(()=>{if(!controller.signal.aborted)setError("Certaines informations ne sont pas disponibles.")})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
    return()=>{controller.abort();drag.current=null;document.body.style.overflow=previousOverflow;dialog.current?.close();trigger.current?.focus()};
  },[open,card.id,setCode,previewProfiles]);
  function move(event:PointerEvent<HTMLDivElement>){
    if(!drag.current)return;
    setRotation({x:Math.max(-40,Math.min(40,drag.current.rx-(event.clientY-drag.current.y)*0.2)),y:drag.current.ry+(event.clientX-drag.current.x)*0.8});
  }
  const saleVersions=(details?.availableFinishes??[]).filter(version=>availableFinishes.includes(version));
  const saleVersion=saleVersions.includes(priceFinish)?priceFinish:saleVersions[0];
  const salePrice=saleVersion?prices[saleVersion]:undefined;
  const showPrice=(value:number|null|undefined)=>value==null?"À définir":value.toLocaleString("fr-FR");
  const profile={...resolveCardAppearance(finish,profiles),effect};
  const backVisible=Math.cos(rotation.y*Math.PI/180)<0;
  return <>
    <button ref={trigger} type="button" className="card-open" onClick={()=>setOpen(true)} aria-label={"Voir "+card.name+" en grand et consulter ses informations"}>{children}</button>
    {open&&<dialog ref={dialog} className="card-dialog" aria-labelledby={uid+"-title"} onCancel={event=>{event.preventDefault();setOpen(false)}} onClick={event=>{if(event.target===event.currentTarget)setOpen(false)}}>
      <header className="card-dialog-header"><h2 id={uid+"-title"}>Fiche de carte</h2><button className="quiet-button" type="button" onClick={()=>setOpen(false)} aria-label="Fermer la fiche de la carte" autoFocus><X aria-hidden="true"/></button></header>
      <div className="card-dialog-scroll"><section className="card-inspection" aria-label="Illustration de la carte">
        <div className="card-stage" tabIndex={0} role="group" aria-label={"Carte "+card.name+", rotation à 360 degrés"} aria-describedby={uid+"-help"} onKeyDown={event=>{
          if(!["ArrowLeft","ArrowRight","Home"].includes(event.key))return;
          event.preventDefault();
          setRotation(v=>({x:0,y:event.key==="Home"?0:v.y+(event.key==="ArrowLeft"?-90:90)}));
        }} onPointerDown={event=>{if(event.button!==0)return;event.currentTarget.focus();event.currentTarget.setPointerCapture(event.pointerId);drag.current={x:event.clientX,y:event.clientY,rx:rotation.x,ry:rotation.y}}} onPointerMove={move} onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}} onLostPointerCapture={()=>{drag.current=null}}>
          <div className="card-rotator" style={{transform:"rotateX("+rotation.x+"deg) rotateY("+rotation.y+"deg)"}}>
            <CardThickness/>
            <HoloSurface hidden={backVisible} profile={profile} rotation={rotation}>{frontMissing?<p>Illustration indisponible</p>:<Image src={"/media/Cards/"+setCode+"/"+card.id+".png"} width={600} height={825} unoptimized alt={card.name+", recto"} draggable={false} onError={()=>setFrontMissing(true)}/>}</HoloSurface>
            <div className="card-face card-back" aria-hidden={!backVisible}>{backMissing?<p>Dos de carte indisponible</p>:<Image src="/media/Cards/card-back.png" width={600} height={825} unoptimized alt="Dos de la carte Pokémon" draggable={false} onError={()=>setBackMissing(true)}/>}</div>
          </div>
        </div>
        <p id={uid+"-help"} className="card-view-help">Glisser pour tourner · Flèches gauche/droite au clavier · Début pour le recto</p>
        <label className="card-finish" htmlFor={uid+"-finish"}>Aperçu de finition<select id={uid+"-finish"} value={finish} onChange={event=>{const next=event.target.value as CardFinish;setFinish(next);setEffect(resolveCardAppearance(next,profiles).effect)}}>{Object.entries(finishNames).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        <label className="card-finish" htmlFor={uid+"-effect"}>Aperçu de l’effet<select id={uid+"-effect"} value={effect} onChange={event=>setEffect(event.target.value as HoloEffect)}>{Object.entries(effectNames).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        <p className="card-finish-note">Aperçu visuel ; disponibilité des versions à confirmer. <a href="/a-propos#open-source">Sources et crédits</a></p>
      </section>
      <section className="card-information" aria-label="Informations de la carte" aria-busy={loading}>
        <dl className="card-summary">
          <div className="card-summary-wide"><dt>Set</dt><dd>{setName} ({setCode})</dd></div>
          <div><dt>Numéro / Max</dt><dd>{card.localId} / {details?.set?.cardCount?.official??"—"}</dd></div>
          <div><dt>Nom</dt><dd>{card.name}</dd></div>
          <div><dt>Rareté</dt><dd>{details?.rarity||card.rarity||"Non renseignée"}</dd></div>
          <div><dt>Illustrateur</dt><dd>{details?.illustrator|| (loading?"Chargement…":"Non renseigné")}</dd></div>
          {saleVersions.length>0&&<div className="card-summary-wide"><dt><label htmlFor={uid+"-sale-version"}>Tarifs de la version</label></dt><dd><select id={uid+"-sale-version"} style={{maxWidth:"100%",minHeight:44,padding:"8px 12px",font:"inherit",color:"var(--ink)",background:"var(--card)",border:"1px solid var(--line)",borderRadius:10}} value={saleVersion} onChange={event=>setPriceFinish(event.target.value as AvailableFinish)}>{saleVersions.map(version=><option key={version} value={version}>{finishLabels[version]}</option>)}</select></dd></div>}
          <div><dt>Revente en pièces</dt><dd>{showPrice(salePrice?.coins)}</dd></div>
          <div><dt>Revente en gemmes</dt><dd>{showPrice(salePrice?.gems)}</dd></div>
        </dl>
        {error&&<p role="status">{error}</p>}
      </section></div>
    </dialog>}
  </>;
}
