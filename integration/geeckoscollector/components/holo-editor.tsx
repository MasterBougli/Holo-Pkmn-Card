"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import { Eye, Save, RotateCcw, Sparkles } from "lucide-react";
import { HoloSurface } from "@/components/holo-surface";
import { cardFinishes,holoEffects,resolveCardAppearance,isAppearanceOverrides,type AppearanceOverrides,type CardFinish,type HoloProfile,type ArtworkWindow } from "@/lib/card-appearance";
import { artworkLayouts,type ArtworkLayout } from "@/lib/card-layouts";
import type { CatalogueCard } from "@/lib/catalogue";
import { CardViewer } from "@/components/card-viewer";
const labels={normal:"Normale",reverse:"Reverse",fullart:"Full art"};
const effects={none:"Aucun",classic:"Classique",illusion:"Illusion",glitter:"Glitter · paillettes",rainbow:"Rainbow",galaxy:"Cosmos · galaxy"};
export function HoloEditor({setCode,setName,card,targetCardId,inherited,initial,baseWindow}:{setCode:string;setName:string;card:CatalogueCard;targetCardId:string;inherited:AppearanceOverrides;initial:AppearanceOverrides;baseWindow:ArtworkWindow}){
 const [settings,setSettings]=useState<AppearanceOverrides>(initial);
 const [saved,setSaved]=useState<AppearanceOverrides>(initial);
 const [activeFinish,setActiveFinish]=useState<CardFinish>("normal");
 const dirty=JSON.stringify(settings)!==JSON.stringify(saved);
 const [status,setStatus]=useState("");const [saving,setSaving]=useState(false);
 function change(finish:CardFinish,patch:Partial<HoloProfile>){
  setSettings(value=>{
    const merged={...resolveCardAppearance(finish,inherited,value,baseWindow),...patch};
    return {...value,[finish]:{effect:merged.effect,intensity:merged.intensity,artworkWindow:merged.artworkWindow}};
  });
  setStatus("");
 }
 async function save(){
  if(!isAppearanceOverrides(settings)){setStatus("Vérifie les valeurs et la zone de l’illustration.");return;}
  setSaving(true);setStatus("");
  try{
   const result=await fetch("/api/admin/holo",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({setCode,cardId:targetCardId,settings})});
   const body=await result.json();
   if(result.ok)setSaved(settings);
   setStatus(result.ok?"Réglages enregistrés.":body.error??"Enregistrement impossible.");
  }catch{setStatus("Enregistrement impossible. Réessaie.");}finally{setSaving(false);}
 }
 const preview=useMemo(()=>Object.fromEntries(cardFinishes.map(finish=>{
 const {effect,intensity,artworkWindow}=resolveCardAppearance(finish,inherited,settings,baseWindow);
 return [finish,{effect,intensity,artworkWindow}];
})) as AppearanceOverrides,[inherited,settings,baseWindow]);
 const activeProfile=resolveCardAppearance(activeFinish,inherited,settings,baseWindow);
 return <div className="holo-editor admin-holo-editor">
 <section className="admin-settings-panel" aria-label="Réglages des finitions">
 <div className="admin-section-heading"><Sparkles aria-hidden="true"/><div><h3>Composer le reflet</h3><p>Chaque finition garde ses propres réglages.</p></div></div>
 <div className="admin-finish-tabs" role="group" aria-label="Finition à modifier">{cardFinishes.map(finish=><button type="button" key={finish} aria-pressed={activeFinish===finish} onClick={()=>setActiveFinish(finish)}>{labels[finish]}<span>{settings[finish]?"Personnalisée":"Héritée"}</span></button>)}</div>
 <div className="admin-frame-picker">
 <label>Appliquer un cadre de référence<select disabled={saving} defaultValue="" onChange={event=>{
 const key=event.target.value as ArtworkLayout;
 if(!(key in artworkLayouts))return;
 const artworkWindow={...artworkLayouts[key].window};
 setSettings(value=>Object.fromEntries(cardFinishes.map(finish=>{
  if(finish==="fullart")return [finish,value[finish]];
  const profile=resolveCardAppearance(finish,inherited,value,baseWindow);
  return [finish,{effect:profile.effect,intensity:profile.intensity,artworkWindow}];
 }).filter(([,profile])=>profile!==undefined)) as AppearanceOverrides);
 setStatus("");event.target.value="";
 }}><option value="">Choisir un cadre pour normale et reverse</option>{Object.entries(artworkLayouts).map(([key,layout])=><option key={key} value={key}>{layout.label}</option>)}</select></label>
 <p>Le cadre règle ensemble la zone holo normale et le trou reverse. Ajuste les pourcentages par finition pour les cartes avec un cadre particulier.</p>
 </div>
 {[activeFinish].map(finish=>{const profile=resolveCardAppearance(finish,inherited,settings,baseWindow);const custom=Boolean(settings[finish]);return <fieldset className="holo-profile-row" key={finish} disabled={saving}><legend>{labels[finish]}</legend>
 <label><span><input type="checkbox" checked={custom} onChange={event=>{if(event.target.checked)change(finish,profile);else setSettings(value=>{const next={...value};delete next[finish];return next;});setStatus("");}}/> Utiliser un réglage spécifique</span></label>
 <p>{custom?"Profil personnalisé":targetCardId?"Hérite du set":"Utilise le cadre de référence du set, sans effet"}</p>
 <label>Effet<select value={profile.effect} disabled={!custom} onChange={event=>change(finish,{effect:event.target.value as HoloProfile["effect"]})}>{holoEffects.map(effect=><option key={effect} value={effect}>{effects[effect]}</option>)}</select></label>
 <label>Intensité (0 à 100 %)<input type="number" min={0} max={100} step={1} disabled={!custom} value={Math.round(profile.intensity*100)} onChange={event=>change(finish,{intensity:Number(event.target.value)/100})}/></label>
 {finish!=="fullart"&&<div className="holo-window-fields">{(["top","left","width","height"] as const).map(key=><label key={key}>{{top:"Haut",left:"Gauche",width:"Largeur",height:"Hauteur"}[key]} (%)<input type="number" min={key==="width"||key==="height"?1:0} max={100} step={0.1} disabled={!custom} value={profile.artworkWindow[key]} onChange={event=>change(finish,{artworkWindow:{...profile.artworkWindow,[key]:Number(event.target.value)}})}/></label>)}</div>}
 </fieldset>})}
 </section>
 <aside className="admin-preview-panel" aria-label="Prévisualisation de la carte">
 <div className="admin-section-heading"><Eye aria-hidden="true"/><div><h3>Aperçu du rendu</h3><p>{labels[activeFinish]} · {effects[activeProfile.effect]}</p></div></div>
 <div className="admin-preview-mat"><CardViewer card={card} setCode={setCode} setName={setName} previewProfiles={preview}><div className="admin-preview-card"><HoloSurface profile={activeProfile} rotation={{x:0,y:0}}><Image src={"/media/Cards/"+setCode+"/"+card.id+".png"} width={600} height={825} unoptimized alt={"Prévisualiser "+card.name}/></HoloSurface></div></CardViewer></div>
 <h3 className="admin-preview-name">{card.name}</h3><p className="admin-preview-set">{setName} · n° {card.localId}</p>
 <p className="admin-preview-help">Clique sur la carte pour l’agrandir et la tourner. Les modifications sont visibles avant l’enregistrement.</p>
 <div className="admin-inheritance-note"><strong>Priorité des réglages</strong><span>Carte → Set → Cadre de référence</span></div>
 </aside>
 <div className="admin-save-bar">
 <div role="status" aria-live="polite"><strong>{status||(dirty?"Modifications non enregistrées":"Réglages à jour")}</strong><span>Les trois finitions sont enregistrées ensemble.</span></div>
 <div className="admin-save-actions"><button type="button" className="quiet-button" disabled={saving||!dirty} onClick={()=>{setSettings(saved);setStatus("");}}><RotateCcw aria-hidden="true"/>Annuler les modifications</button><button type="button" className="button game-primary" disabled={saving||!dirty} onClick={save}><Save aria-hidden="true"/>{saving?"Enregistrement…":"Enregistrer"}</button></div>
 </div>
 </div>;
}
