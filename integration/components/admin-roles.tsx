"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus,Save,ShieldCheck,Archive,RotateCcw,KeyRound } from "lucide-react";
import { can,canDelegate,permissionGroups,type AdminAccess,type AdminRoleView,type AdminPermission } from "@/lib/admin-permissions";
export function AdminRoles({roles,access}:{roles:AdminRoleView[];access:AdminAccess}){
 const router=useRouter();
 const [selected,setSelected]=useState<AdminRoleView|null>(roles.find(role=>!role.archived)??null);
 const [name,setName]=useState(selected?.name??""),[description,setDescription]=useState(selected?.description??"");
 const [permissions,setPermissions]=useState<AdminPermission[]>(selected?.permissions??[]);
 const [status,setStatus]=useState(""),[busy,setBusy]=useState(false),[showArchived,setShowArchived]=useState(false),[confirmArchive,setConfirmArchive]=useState(false);
 const editable=can(access,selected?"roles.edit":"roles.create")&&(!selected||canDelegate(access,selected.permissions))&&!selected?.archived;
 const dirty=selected?name!==selected.name||description!==selected.description||JSON.stringify([...permissions].sort())!==JSON.stringify([...selected.permissions].sort()):Boolean(name||description||permissions.length);
 function select(role:AdminRoleView|null){
  if(dirty&&!window.confirm("Abandonner les modifications non enregistrées ?"))return;
  setSelected(role);setName(role?.name??"");setDescription(role?.description??"");setPermissions(role?.permissions??[]);setStatus("");setConfirmArchive(false);
 }
 async function save(method:string,extra:Record<string,unknown>={}){
  setBusy(true);setStatus("");
  try{
   const response=await fetch("/api/admin/roles",{method,headers:{"Content-Type":"application/json"},body:JSON.stringify({id:selected?.id,revision:selected?.revision,name,description,permissions,...extra})});
   const data=await response.json();
   if(!response.ok){setStatus(data.error??"Enregistrement impossible.");return;}
   setStatus(method==="DELETE"?"Rôle archivé.":extra.restore?"Rôle restauré.":"Rôle enregistré.");
   // Refresh the latest revision, including server-normalized names.
   const latest=await fetch("/api/admin/roles",{cache:"no-store"});const result=await latest.json();
   if(latest.ok){
    const current=result.roles.find((role:AdminRoleView)=>selected?role.id===selected.id:role.name===name.trim()) as AdminRoleView|undefined;
    if(current){setSelected(current);setName(current.name);setDescription(current.description);setPermissions(current.permissions);}
   }
   setConfirmArchive(false);router.refresh();
  }catch{setStatus("Connexion interrompue. Réessaie.");}finally{setBusy(false);}
 }
 return <><section className="admin-protection"><ShieldCheck aria-hidden="true"/><div><strong>Bougli · Superadministrateur protégé</strong><p>Toutes les permissions. Ce statut ne peut être attribué, modifié ou retiré ici.</p></div></section>
 <div className="admin-role-layout"><section className="admin-role-library" aria-labelledby="roles-title"><div className="admin-section-heading"><KeyRound aria-hidden="true"/><div><h2 id="roles-title">Rôles de l’équipe</h2><p>{roles.filter(role=>!role.archived).length} rôles actifs</p></div></div>
 {can(access,"roles.create")&&<button className="button game-primary" type="button" disabled={busy} onClick={()=>select(null)}><Plus aria-hidden="true"/>Créer un rôle</button>}
 <label className="admin-check"><input type="checkbox" checked={showArchived} onChange={event=>setShowArchived(event.target.checked)}/>Afficher les rôles archivés</label>
 <div className="admin-role-list">{roles.filter(role=>showArchived||!role.archived).map(role=><button type="button" className="admin-role-card" key={role.id} disabled={busy} aria-pressed={selected?.id===role.id} onClick={()=>select(role)}><strong>{role.name}</strong><span>{role.archived?"Archivé":role.members+" compte"+(role.members===1?"":"s")} · {role.permissions.length} permissions</span>{!canDelegate(access,role.permissions)&&<small>Lecture seule · droits supérieurs</small>}</button>)}</div>
 <p className="admin-helper">Un joueur sans rôle n’a pas accès à l’administration.</p></section>
 <form className="admin-role-editor" onSubmit={event=>{event.preventDefault();if(editable&&!busy)void save(selected?"PATCH":"POST");}}>
 <div className="admin-section-heading"><ShieldCheck aria-hidden="true"/><div><h2>{selected?selected.name:"Nouveau rôle"}</h2><p>{selected?.archived?"Ce rôle est archivé.":editable?"Choisis les missions confiées à ce rôle.":"Consultation des permissions."}</p></div></div>
 <fieldset disabled={!editable||busy} className="admin-role-fields"><label>Nom du rôle<input value={name} minLength={2} maxLength={60} required onChange={event=>setName(event.target.value)}/></label><label>Description<textarea value={description} maxLength={400} rows={2} onChange={event=>setDescription(event.target.value)}/></label></fieldset>
 <p className="admin-helper">Les permissions de plusieurs rôles se cumulent. L’accès au panel nécessite « Ouvrir l’administration ». Tu peux déléguer uniquement les droits que tu possèdes.</p>
 <div className="admin-permission-groups">{permissionGroups.map(group=><fieldset key={group.label} className="admin-permission-group" disabled={!editable||busy}><legend>{group.label} {group.future&&<span className="admin-coming">À venir</span>}</legend>{group.items.map(([key,label])=><label className="admin-check" key={key}><input type="checkbox" checked={permissions.includes(key)} disabled={!can(access,key)} onChange={event=>setPermissions(value=>event.target.checked?[...value,key]:value.filter(permission=>permission!==key))}/>{label}</label>)}</fieldset>)}</div>
 <div className="admin-role-actions"><p role="status" aria-live="polite">{status||(!editable?"Lecture seule":dirty?"Modifications non enregistrées":"Réglages à jour")}</p>
 <div>{editable&&<button className="button game-primary" disabled={busy||!dirty} type="submit"><Save aria-hidden="true"/>{busy?"Enregistrement…":"Enregistrer"}</button>}
 {selected&&!selected.archived&&can(access,"roles.delete")&&canDelegate(access,selected.permissions)&&<button className="quiet-button" disabled={busy||selected.members>0} type="button" onClick={()=>setConfirmArchive(true)}><Archive aria-hidden="true"/>Archiver</button>}
 {selected?.archived&&can(access,"roles.edit")&&canDelegate(access,selected.permissions)&&<button className="quiet-button" type="button" disabled={busy} onClick={()=>void save("PATCH",{restore:true})}><RotateCcw aria-hidden="true"/>Restaurer le rôle</button>}</div>
 {selected&&selected.members>0&&<p className="admin-helper">Retire ce rôle de ses comptes avant de l’archiver.</p>}
 {confirmArchive&&<div className="admin-confirm" role="alert"><p>Archiver « {selected?.name} » ? Il restera consultable et pourra être restauré.</p><button type="button" className="quiet-button" disabled={busy} onClick={()=>setConfirmArchive(false)}>Annuler</button><button type="button" className="button game-primary" disabled={busy} onClick={()=>void save("DELETE")}>Confirmer l’archivage</button></div>}</div>
 </form></div></>;
}
