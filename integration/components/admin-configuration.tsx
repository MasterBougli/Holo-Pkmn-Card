"use client";
import { useState } from "react";
import { Save,RotateCcw,Wrench,UserPlus,Eye,ShieldCheck } from "lucide-react";
import { validSiteConfig,type SiteConfiguration } from "@/lib/site-config";
function fields(config:SiteConfiguration){return {maintenanceEnabled:config.maintenanceEnabled,maintenanceMessage:config.maintenanceMessage,registrationsEnabled:config.registrationsEnabled,registrationMessage:config.registrationMessage};}
export function AdminConfiguration({initial,canEdit}:{initial:SiteConfiguration;canEdit:boolean}){
 const [config,setConfig]=useState(initial),[saved,setSaved]=useState(initial),[busy,setBusy]=useState(false),[status,setStatus]=useState(""),[conflict,setConflict]=useState(false);
 const dirty=JSON.stringify(fields(config))!==JSON.stringify(fields(saved));
 function change(patch:Partial<SiteConfiguration>){setConfig(value=>({...value,...patch}));setStatus("");}
 async function save(){
  if(!canEdit||busy)return;
  if(!validSiteConfig(config)){setStatus("Les messages doivent contenir entre 5 et 800 caractères.");return;}
  setBusy(true);setStatus("");setConflict(false);
  try{
   const response=await fetch("/api/admin/configuration",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({...fields(config),revision:saved.revision})});
   const body=await response.json();
   if(!response.ok){setStatus(body.error??"Enregistrement impossible.");setConflict(response.status===409);return;}
   setConfig(body.configuration);setSaved(body.configuration);setStatus("Configuration enregistrée.");
   window.dispatchEvent(new Event("site-availability-changed"));
  }catch{setStatus("Connexion interrompue. Réessaie.");}finally{setBusy(false);}
 }
 async function reload(){
  if(dirty&&!window.confirm("Recharger la configuration et abandonner les modifications non enregistrées ?"))return;
  setBusy(true);
  try{const response=await fetch("/api/admin/configuration",{cache:"no-store"});if(!response.ok)throw new Error();
   const current=await response.json();setConfig(current);setSaved(current);setConflict(false);setStatus("Configuration rechargée.");
  }catch{setStatus("Impossible de recharger la configuration.");}finally{setBusy(false);}
 }
 return <><div className="admin-config-summary"><div><span>ACCÈS AU JEU</span><strong>{saved.maintenanceEnabled?"Maintenance activée":"Jeu ouvert"}</strong></div><div><span>NOUVEAUX COMPTES</span><strong>{saved.registrationsEnabled?"Inscriptions ouvertes":"Inscriptions fermées"}</strong></div><div><span>ÉQUIPE</span><strong>Accès au jeu complet</strong></div></div>
 <form onSubmit={event=>{event.preventDefault();void save();}} className="admin-config-editor">
 <div className="admin-config-grid"><section className="admin-settings-panel"><div className="admin-section-heading"><Wrench aria-hidden="true"/><div><h2>Maintenance du jeu</h2><p>Prépare le jeu tout en laissant les collections publiques consultables.</p></div></div>
 <fieldset disabled={!canEdit||busy} className="admin-config-fields"><legend className="sr-only">Réglages de maintenance</legend><label className="admin-check"><input type="checkbox" checked={config.maintenanceEnabled} onChange={event=>change({maintenanceEnabled:event.target.checked})}/><strong>Activer la maintenance</strong></label><label>Message pour les joueurs<textarea rows={4} minLength={5} maxLength={800} required value={config.maintenanceMessage} onChange={event=>change({maintenanceMessage:event.target.value})}/></label></fieldset>
 <div className="admin-config-rules"><ShieldCheck aria-hidden="true"/><p><strong>L’équipe garde accès au jeu complet.</strong> Tout compte ayant un rôle d’équipe actif peut entrer. Les permissions de l’administration restent applicables.</p></div><p className="admin-helper">L’accueil, les actualités, les sets, l’inscription et la connexion restent accessibles. Les comptes sans rôle d’équipe sont dirigés vers la page de maintenance.</p></section>
 <section className="admin-settings-panel"><div className="admin-section-heading"><UserPlus aria-hidden="true"/><div><h2>Ouverture des inscriptions</h2><p>Un réglage indépendant de la maintenance.</p></div></div>
 <fieldset disabled={!canEdit||busy} className="admin-config-fields"><legend className="sr-only">Réglages des inscriptions</legend><label className="admin-check"><input type="checkbox" checked={config.registrationsEnabled} onChange={event=>change({registrationsEnabled:event.target.checked})}/><strong>Autoriser les nouveaux comptes</strong></label><label>Message quand les inscriptions sont fermées<textarea rows={4} minLength={5} maxLength={800} required value={config.registrationMessage} onChange={event=>change({registrationMessage:event.target.value})}/></label></fieldset>
 <div className="admin-config-rules"><ShieldCheck aria-hidden="true"/><p><strong>Les comptes existants peuvent se connecter.</strong> La fermeture empêche la création de comptes par e-mail, Google et Twitch.</p></div><p className="admin-helper">Pour accueillir un nouveau membre de l’équipe, laisse les inscriptions ouvertes le temps qu’il crée son compte, puis attribue-lui ses rôles.</p></section></div>
 <section className="admin-target-panel admin-config-preview" aria-labelledby="config-preview-title"><div className="admin-section-heading"><Eye aria-hidden="true"/><div><h2 id="config-preview-title">Aperçu des messages</h2><p>Ces messages suivent le brouillon ; ils seront publiés après l’enregistrement.</p></div></div><div className="admin-config-preview-grid"><article><span className="admin-context-tag">MAINTENANCE</span><h3>La collection reprend bientôt</h3><p className="availability-message">{config.maintenanceMessage}</p><small>{config.maintenanceEnabled?"Sera affiché aux joueurs sans rôle d’équipe.":"Message conservé pour la prochaine maintenance."}</small></article><article><span className="admin-context-tag">INSCRIPTIONS FERMÉES</span><h3>Inscriptions momentanément fermées</h3><p className="availability-message">{config.registrationMessage}</p><small>{config.registrationsEnabled?"Message conservé pour une prochaine fermeture.":"Sera affiché aux nouveaux visiteurs."}</small></article></div></section>
 <div className="admin-save-bar"><div role="status" aria-live="polite"><strong>{status||(!canEdit?"Consultation de la configuration":dirty?"Modifications non enregistrées":"Réglages à jour")}</strong><span>Les changements s’appliquent après enregistrement.</span></div><div className="admin-save-actions">{conflict&&<button type="button" className="quiet-button" disabled={busy} onClick={()=>void reload()}>Recharger la configuration</button>}<button type="button" className="quiet-button" disabled={!canEdit||busy||!dirty} onClick={()=>{setConfig(saved);setStatus("");setConflict(false);}}><RotateCcw aria-hidden="true"/>Annuler les modifications</button><button className="button game-primary" type="submit" disabled={!canEdit||busy||!dirty}><Save aria-hidden="true"/>{busy?"Enregistrement…":"Enregistrer"}</button></div></div>
 </form></>;
}
