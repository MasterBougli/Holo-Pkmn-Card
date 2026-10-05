"use client";
import { SiteAvailabilityProvider,SiteAvailabilityNotice,useSiteAvailability } from "@/components/site-availability";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Accessibility, CalendarDays, Home, Layers3, Newspaper, UserRound, X } from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export function Brand() {
  return <Link className="brand" href="/" prefetch={false}><span className="brand-mark" aria-hidden="true">G</span><span>Geeckos<span style={{color:"#168ca3"}}>Collector</span></span></Link>;
}

export function Topbar({variant}:{variant?:"collection"}) {
  return <header className={`topbar shell ${variant==="collection"?"collection-topbar":""}`}><Brand/><div className="top-actions"><select className="locale" aria-label="Langue"><option>FR</option><option>EN</option><option>ES</option></select><button className="quiet-button" aria-label="Ouvrir les réglages d’accessibilité" onClick={()=>window.dispatchEvent(new Event("open-accessibility"))}><Accessibility size={17}/><span>Accessibilité</span></button></div></header>;
}

export function BottomNav({active="home",variant}:{active?:string;variant?:"collection"}) {
  const {data:session,isPending}=authClient.useSession();
  const availability=useSiteAvailability();
  const pathname=usePathname();
  const current=pathname?.startsWith("/actualites")?"news":active;
  const accountHome=session&&(!availability?.maintenanceEnabled||availability.canPlay)?"/compte":"/";
  const items=[{id:"home",href:"/",label:"Accueil",Icon:Home},{id:"news",href:"/actualites",label:"Actualités",Icon:Newspaper},{id:"events",href:accountHome+"#evenements",label:"Événements",Icon:CalendarDays},{id:"sets",href:"/sets",label:"Sets",Icon:Layers3},{id:"login",href:session||isPending?"/compte":"/connexion",label:session?"Mon compte":isPending?"Compte…":"Connexion",Icon:UserRound}];
  return <><nav className={`bottom-nav ${variant==="collection"?"collection-bottom-nav":""}`} aria-label="Navigation principale"><div className="nav-inner">{items.map(({id,href,label,Icon})=><Link key={id} className={`nav-item ${(current===id||(id==="login"&&current==="account"))?"active":""}`} href={href} prefetch={false} aria-current={(current===id||(id==="login"&&current==="account"))?"page":undefined}><Icon aria-hidden="true"/><span>{label}</span></Link>)}</div></nav><div className="page-bottom"/></>;
}

const settingKeys=["theme","colorAid","contrast","textSize","font","motion"] as const;
type SettingKey=(typeof settingKeys)[number];
const defaultSettings:Record<SettingKey,string>={theme:"clair",colorAid:"aucune",contrast:"standard",textSize:"normal",font:"systeme",motion:"systeme"};
const options:Record<SettingKey,{label:string;values:[string,string][]}>={
  theme:{label:"Thème",values:[["clair","Clair"],["sombre","Sombre"]]},
  colorAid:{label:"Aide de perception des couleurs",values:[["aucune","Aucune"],["rouge-vert","Rouge-vert"],["bleu-jaune","Bleu-jaune"],["monochrome","Monochrome"]]},
  contrast:{label:"Contraste",values:[["standard","Standard"],["renforce","Renforcé"]]},
  textSize:{label:"Taille du texte",values:[["normal","Normal"],["petit","Petit"],["grand","Grand"],["tres-grand","Très grand"]]},
  font:{label:"Police d’écriture",values:[["systeme","Système"],["atkinson","Atkinson Hyperlegible"],["inclusive","Inclusive Sans"],["open-dyslexic","OpenDyslexic"]]},
  motion:{label:"Animations",values:[["systeme","Comme le système"],["normal","Normales"],["reduites","Réduites"],["desactivees","Désactivées"]]},
};
export function AccessibilityGate(){
  const accessDialog=useRef<HTMLDialogElement>(null);
  const [open,setOpen]=useState(false); const [values,setValues]=useState<Record<SettingKey,string>>(defaultSettings);
  const {data:session,isPending}=authClient.useSession();
  const [loadedUser,setLoadedUser]=useState<string|null>(null);
  const [saving,setSaving]=useState(false),[saveError,setSaveError]=useState("");
  const saveQueue=useRef<Promise<void>>(Promise.resolve()),saveSequence=useRef(0);
  const pathname=usePathname();
  useEffect(()=>{if(pathname==="/"&&!isPending&&!session&&!sessionStorage.getItem("accessibility-intro-seen"))setOpen(true)},[pathname,isPending,session]);
  useEffect(()=>{const listener=()=>setOpen(true);window.addEventListener("open-accessibility",listener);return()=>window.removeEventListener("open-accessibility",listener)},[]);
  useEffect(()=>{document.body.dataset.theme=values.theme==="sombre"?"dark":"light";document.body.classList.toggle("dark",values.theme==="sombre");document.body.dataset.text=values.textSize;document.body.dataset.font=values.font;document.body.dataset.contrast=values.contrast;document.body.dataset.colorAid=values.colorAid;document.body.dataset.motion=values.motion},[values]);
  useEffect(()=>{
    setLoadedUser(null);
    if(!session?.user.id)return;
    let active=true;
    void fetch("/api/player/preferences",{cache:"no-store"}).then(response=>response.ok?response.json():null).then(data=>{
      if(!active)return;
      if(data?.preferences)setValues(data.preferences);
      setLoadedUser(session.user.id);
    }).catch(()=>{});
    return()=>{active=false};
  },[session?.user.id]);
  useEffect(()=>{
    if(!session?.user.id||loadedUser!==session.user.id)return;
    const sequence=++saveSequence.current;setSaving(true);setSaveError("");
    saveQueue.current=saveQueue.current.catch(()=>{}).then(async()=>{
      const response=await fetch("/api/player/preferences",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(values),keepalive:true});
      if(!response.ok)throw Error("Tes réglages n’ont pas pu être enregistrés. Réessaie avant de quitter cette page.");
    }).catch(error=>{if(sequence===saveSequence.current)setSaveError(error.message);}).finally(()=>{if(sequence===saveSequence.current)setSaving(false);});
  },[session?.user.id,loadedUser,values]);
  useEffect(()=>{
    if(!open)return;
    const previous=document.activeElement as HTMLElement|null;
    const overflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    accessDialog.current?.showModal();
    return()=>{document.body.style.overflow=overflow;accessDialog.current?.close();previous?.focus()};
  },[open]);
  if(!open)return null;
  const close=()=>{sessionStorage.setItem("accessibility-intro-seen","true");setOpen(false)};
  return <dialog ref={accessDialog} className="modal" aria-labelledby="access-title" aria-describedby="access-desc" onCancel={event=>{event.preventDefault();close()}} onClick={event=>{if(event.target===event.currentTarget)close()}}>
    <header className="modal-header"><div><span className="section-kicker">Ton confort de jeu</span><h2 id="access-title">Adapte le jeu à tes besoins</h2></div><button type="button" className="quiet-button" aria-label="Fermer les réglages d’accessibilité" onClick={close} autoFocus><X aria-hidden="true"/></button></header>
    <div className="modal-scroll"><p id="access-desc">Choisis tes réglages maintenant, ou continue avec les options par défaut. Tu pourras les modifier à tout moment.</p><div className="setting-grid">{settingKeys.map(key=><div className="setting" key={key}><label htmlFor={"setting-"+key}>{options[key].label}</label><select id={"setting-"+key} value={values[key]} onChange={event=>setValues(v=>({...v,[key]:event.target.value}))}>{options[key].values.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>)}</div></div>
    <footer className="modal-actions"><p className="accessibility-save-status" role="status">{saveError||(saving?"Enregistrement dans ton compte…":session?"Réglages enregistrés dans ton compte.":"Tes choix seront enregistrés dans ton compte après connexion.")}</p><button className="button secondary" onClick={()=>{setValues(defaultSettings);close()}}>Continuer par défaut</button><button className="button" disabled={saving} onClick={close}>Appliquer mes choix</button></footer>
    </dialog>;

}

export function PlayerChrome({active="home",variant}:{active?:string;variant?:"collection"}) { return <SiteAvailabilityProvider><Topbar variant={variant}/><BottomNav active={active} variant={variant}/><SiteAvailabilityNotice/></SiteAvailabilityProvider>; }
