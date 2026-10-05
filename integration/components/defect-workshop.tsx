"use client";
import { useEffect,useRef,useState } from "react";
import type { PointerEvent,ChangeEvent } from "react";
import { Download,RotateCcw,FlaskConical } from "lucide-react";
import type { CatalogueCard } from "@/lib/catalogue";
import { cardFinishes,holoEffects,type CardFinish,type HoloEffect,type ResolvedAppearance } from "@/lib/card-appearance";
import { defaultDefects,activeDefectNames,parseDefectScenario,type DefectSettings,type DefectScenario } from "@/lib/card-defects";
import { DefectSurface } from "@/components/defect-surface";
import { HoloSurface } from "@/components/holo-surface";
import { CardThickness } from "@/components/card-thickness";
type Target={setCode:string;cardId:string};
type Detail={set:{code:string;name:string;cards:CatalogueCard[]};card:CatalogueCard;profiles:Record<CardFinish,ResolvedAppearance>};
const finishes={normal:"Normale",reverse:"Reverse",fullart:"Full art"};
const effects={none:"Aucun",classic:"Classique",illusion:"Illusion",glitter:"Glitter",rainbow:"Rainbow",galaxy:"Cosmos"};
export function DefectWorkshop({sets}:{sets:{code:string;name:string}[]}){
 const [target,setTarget]=useState<Target>({setCode:sets.find(set=>set.code==="AOR")?.code??sets[0]?.code??"",cardId:""});
 const [detail,setDetail]=useState<Detail|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[status,setStatus]=useState("");
 const [settings,setSettings]=useState(defaultDefects),[neighborId,setNeighborId]=useState("");
 const [finish,setFinish]=useState<CardFinish>("normal"),[effect,setEffect]=useState<HoloEffect>("none");
 const [original,setOriginal]=useState(false),[rotation,setRotation]=useState({x:0,y:0});
 const drag=useRef<{x:number;y:number;rx:number;ry:number}|null>(null),pending=useRef<DefectScenario|null>(null);
 useEffect(()=>{
  const controller=new AbortController();
  setLoading(true);setError("");setDetail(null);
  fetch("/api/admin/defects?set="+encodeURIComponent(target.setCode)+(target.cardId?"&card="+encodeURIComponent(target.cardId):""),{signal:controller.signal,cache:"no-store"})
  .then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error??"Chargement impossible.");return data as Detail;})
  .then(data=>{
   const scenario=pending.current;
   if(scenario&&scenario.setCode===data.set.code&&scenario.cardId===data.card.id){
    pending.current=null;
    if(!data.set.cards.some(card=>card.id===scenario.neighborId))throw new Error("La carte voisine du scénario n’appartient pas à ce set.");
    setSettings(scenario.settings);setNeighborId(scenario.neighborId);setFinish("normal");setEffect("none");setOriginal(false);setStatus("Scénario importé. Les défauts et leurs positions ont été restaurés.");
   }else{setNeighborId(data.set.cards.find(card=>card.id!==data.card.id)?.id??data.card.id);setStatus("");}
   setDetail(data);setRotation({x:0,y:0});
  }).catch(reason=>{if(!controller.signal.aborted)setError(reason.message??"Chargement impossible.");})
  .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[target]);
 function update<K extends keyof DefectSettings>(key:K,value:DefectSettings[K]){setSettings(previous=>({...previous,[key]:value}));setStatus("");}
 function number(label:string,value:number,min:number,max:number,step:number,change:(value:number)=>void){
  return <label>{label}<input type="number" value={value} min={min} max={max} step={step} onChange={event=>{const value=event.target.valueAsNumber;if(Number.isFinite(value))change(Math.max(min,Math.min(max,value)));}}/></label>;
 }
 function preset(kind:"cut"|"color"|"all"){
  const next=defaultDefects();next.miscut.enabled=kind!=="color";next.registration.enabled=kind!=="cut";
  if(kind==="all"){next.miscut.y=-8;next.stain.enabled=true;next.printLine.enabled=true;}
  setSettings(next);setOriginal(false);setStatus("Exemple chargé. Tu peux ajuster chaque défaut.");
 }
 function exportScenario(){
  if(!detail)return;
  const scenario:DefectScenario={version:1,setCode:detail.set.code,cardId:detail.card.id,neighborId,settings};
  const url=URL.createObjectURL(new Blob([JSON.stringify(scenario,null,2)],{type:"application/json"}));
  const link=document.createElement("a");link.href=url;link.download="defauts-"+detail.set.code+"-"+detail.card.localId+".json";link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);setStatus("Scénario exporté. Les finitions holo sont des aperçus séparés, non inclus dans ce fichier.");
 }
 async function importScenario(event:ChangeEvent<HTMLInputElement>){
  const file=event.target.files?.[0];event.target.value="";if(!file)return;
  try{
   if(file.size>16384)throw new Error("Le fichier doit faire moins de 16 Ko.");
   const scenario=parseDefectScenario(JSON.parse(await file.text()));
   if(!scenario||!sets.some(set=>set.code===scenario.setCode))throw new Error("Scénario invalide ou set absent du catalogue.");
   pending.current=scenario;setTarget({setCode:scenario.setCode,cardId:scenario.cardId});
  }catch(reason){setError(reason instanceof Error?reason.message:"Import impossible.");}
 }
 function move(event:PointerEvent<HTMLDivElement>){
  if(!drag.current)return;
  setRotation({x:Math.max(-40,Math.min(40,drag.current.rx-(event.clientY-drag.current.y)*.2)),y:drag.current.ry+(event.clientX-drag.current.x)*.8});
 }
 const names=activeDefectNames(settings),profile=detail?{...detail.profiles[finish],effect}:null;
 const backVisible=Math.cos(rotation.y*Math.PI/180)<0;
 return <>
 <section className="admin-target-panel defect-intro"><FlaskConical aria-hidden="true"/><div><h2>Un laboratoire pour tes essais</h2><p>Aperçu uniquement : aucune carte n’est attribuée, aucun taux de rareté ni tarif de revente n’est modifié. Les scans d’origine restent intacts.</p><p>Les effets simulent des défauts visuels. La carte voisine représente une planche fictive du même set, pas une planche d’impression réelle.</p></div></section>
 <section className="admin-target-panel defect-target" aria-label="Choisir les cartes de démonstration">
 <label>Set<select value={target.setCode} onChange={event=>{pending.current=null;setTarget({setCode:event.target.value,cardId:""});}}>{sets.map(set=><option key={set.code} value={set.code}>{set.code} · {set.name}</option>)}</select></label>
 <label>Carte à examiner<select disabled={!detail||loading} value={detail?.card.id??""} onChange={event=>{pending.current=null;setTarget({setCode:target.setCode,cardId:event.target.value});}}>{!detail&&<option value="">Chargement…</option>}{detail?.set.cards.map(card=><option key={card.id} value={card.id}>{card.localId} · {card.name}</option>)}</select></label>
 </section>
 {error&&<div className="admin-catalogue-error"><p role="alert">{error}</p><button className="quiet-button" onClick={()=>{pending.current=null;setTarget({...target});}}>Recharger la carte</button></div>}
 <div className="defect-layout">
 <section className="admin-settings-panel defect-controls" aria-label="Réglages des défauts">
 <h2>Composer les défauts</h2><div className="defect-presets"><button className="quiet-button" onClick={()=>preset("cut")}>Exemple de découpe</button><button className="quiet-button" onClick={()=>preset("color")}>Exemple de couleurs</button><button className="quiet-button" onClick={()=>preset("all")}>Exemple de cumul</button></div>
 <fieldset><legend><label className="defect-check"><input type="checkbox" checked={settings.miscut.enabled} onChange={event=>update("miscut",{...settings.miscut,enabled:event.target.checked})}/>Découpe décalée</label></legend><div className="defect-fields">
 <label>Carte voisine du même set<select disabled={!settings.miscut.enabled||!detail} value={neighborId} onChange={event=>setNeighborId(event.target.value)}>{detail?.set.cards.map(card=><option key={card.id} value={card.id}>{card.localId} · {card.name}</option>)}</select></label>
 {number("Décalage horizontal (%)",settings.miscut.x,-30,30,1,value=>update("miscut",{...settings.miscut,x:value}))}
 {number("Décalage vertical (%)",settings.miscut.y,-30,30,1,value=>update("miscut",{...settings.miscut,y:value}))}
 {number("Angle de découpe (°)",settings.miscut.angle,-6,6,.1,value=>update("miscut",{...settings.miscut,angle:value}))}</div><p>Valeurs positives : déplacement vers la droite ou le bas. La voisine apparaît du côté opposé.</p></fieldset>
 <fieldset><legend><label className="defect-check"><input type="checkbox" checked={settings.registration.enabled} onChange={event=>update("registration",{...settings.registration,enabled:event.target.checked})}/>Décalage des couleurs</label></legend><div className="defect-fields">{number("Séparation des couleurs (pixels du scan)",settings.registration.offset,0,30,1,value=>update("registration",{...settings.registration,offset:value}))}</div><p>Simulation des couches cyan, magenta et jaune mal alignées.</p></fieldset>
 <fieldset><legend><label className="defect-check"><input type="checkbox" checked={settings.missingInk.enabled} onChange={event=>update("missingInk",{...settings.missingInk,enabled:event.target.checked})}/>Encre manquante</label></legend><div className="defect-fields"><label>Couche concernée<select value={settings.missingInk.channel} onChange={event=>update("missingInk",{...settings.missingInk,channel:event.target.value as DefectSettings["missingInk"]["channel"]})}><option value="cyan">Cyan</option><option value="magenta">Magenta</option><option value="yellow">Jaune</option><option value="black">Toutes · impression pâlie</option></select></label>{number("Encre manquante (%)",Math.round(settings.missingInk.strength*100),0,100,1,value=>update("missingInk",{...settings.missingInk,strength:value/100}))}</div></fieldset>
 <fieldset><legend><label className="defect-check"><input type="checkbox" checked={settings.stain.enabled} onChange={event=>update("stain",{...settings.stain,enabled:event.target.checked})}/>Taches d’impression</label></legend><div className="defect-fields">{number("Nombre de taches",settings.stain.count,1,12,1,value=>update("stain",{...settings.stain,count:Math.round(value)}))}{number("Taille maximale (pixels du scan)",settings.stain.size,1,40,1,value=>update("stain",{...settings.stain,size:value}))}{number("Graine de position",settings.seed,0,1000000000,1,value=>update("seed",Math.round(value)))}</div><p>Une même graine reproduit les mêmes positions.</p></fieldset>
 <fieldset><legend><label className="defect-check"><input type="checkbox" checked={settings.printLine.enabled} onChange={event=>update("printLine",{...settings.printLine,enabled:event.target.checked})}/>Ligne d’impression</label></legend><div className="defect-fields"><label>Direction<select value={settings.printLine.direction} onChange={event=>update("printLine",{...settings.printLine,direction:event.target.value as DefectSettings["printLine"]["direction"]})}><option value="vertical">Verticale</option><option value="horizontal">Horizontale</option></select></label>{number("Position (%)",settings.printLine.position,0,100,1,value=>update("printLine",{...settings.printLine,position:value}))}{number("Largeur (pixels du scan)",settings.printLine.width,.5,20,.5,value=>update("printLine",{...settings.printLine,width:value}))}</div></fieldset>
 <div className="defect-actions"><button className="quiet-button" onClick={()=>{setSettings(defaultDefects());setOriginal(false);setRotation({x:0,y:0});setStatus("Défauts réinitialisés.");}}><RotateCcw aria-hidden="true"/>Réinitialiser</button><button className="button game-primary" disabled={!detail} onClick={exportScenario}><Download aria-hidden="true"/>Exporter le scénario</button><label className="defect-import">Importer un scénario JSON<input type="file" accept=".json,application/json" disabled={loading} onChange={importScenario}/></label></div>
 <p role="status" aria-live="polite">{status}</p>
 </section>
 <aside className="admin-preview-panel defect-preview" aria-label="Aperçu de l’exemplaire">
 <h2>{detail?.card.name??"Chargement de la carte…"}</h2>{detail&&<p className="admin-helper">{detail.set.name} · n° {detail.card.localId} · {detail.card.rarity}</p>}
 {loading&&<p role="status">Chargement…</p>}
 {detail&&profile&&<>
 <div className="defect-mat"><div className="defect-stage" tabIndex={0} role="group" aria-label={"Exemplaire de démonstration de "+detail.card.name+", rotation à 360 degrés"} aria-describedby="defect-rotation-help" onKeyDown={event=>{if(!["ArrowLeft","ArrowRight","Home"].includes(event.key))return;event.preventDefault();setRotation(value=>({x:0,y:event.key==="Home"?0:value.y+(event.key==="ArrowLeft"?-90:90)}));}} onPointerDown={event=>{if(event.button!==0)return;event.currentTarget.focus();event.currentTarget.setPointerCapture(event.pointerId);drag.current={x:event.clientX,y:event.clientY,rx:rotation.x,ry:rotation.y};}} onPointerMove={move} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}>
 <div className="card-rotator" style={{transform:"rotateX("+rotation.x+"deg) rotateY("+rotation.y+"deg)"}}><CardThickness/><HoloSurface profile={profile} rotation={rotation} hidden={backVisible}><DefectSurface setCode={detail.set.code} cardId={detail.card.id} neighborId={neighborId} settings={settings} original={original}/></HoloSurface><div className="card-face card-back" aria-hidden={!backVisible}><img src="/media/Cards/card-back.png" alt="Dos de la carte Pokémon" draggable={false}/></div></div>
 </div></div>
 <p id="defect-rotation-help" className="admin-helper">Glisser pour tourner · Flèches gauche/droite au clavier · Début pour le recto</p>
 <label className="defect-check"><input type="checkbox" checked={original} onChange={event=>setOriginal(event.target.checked)}/>Comparer : afficher le scan sans défaut</label>
 <div className="defect-fields"><label>Finition de l’aperçu<select value={finish} onChange={event=>{const value=event.target.value as CardFinish;setFinish(value);setEffect(detail.profiles[value].effect);}}>{cardFinishes.map(value=><option key={value} value={value}>{finishes[value]}</option>)}</select></label><label>Effet holo de l’aperçu<select value={effect} onChange={event=>setEffect(event.target.value as HoloEffect)}>{holoEffects.map(value=><option key={value} value={value}>{effects[value]}</option>)}</select></label></div>
 <section className="defect-summary"><h3>Défauts de cet aperçu</h3>{names.length?<ul>{names.map(name=><li key={name}>{name}</li>)}</ul>:<p>Aucun défaut activé.</p>}<p>Prix de revente de base inchangé. La valeur d’échange reste à l’appréciation des collectionneurs.</p><p className="admin-helper">Exemplaire de démonstration · non enregistré dans une collection</p></section>
 </>}
 </aside></div></>;
}
