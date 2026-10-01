"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users,Search,Save,ShieldCheck } from "lucide-react";
import { can,canDelegate,permissionLabels,type AdminAccess,type AdminRoleView } from "@/lib/admin-permissions";
import type { AdminAccountView } from "@/lib/admin-management";
function AccountRoles({account,roles,access}:{account:AdminAccountView;roles:AdminRoleView[];access:AdminAccess}){
 const router=useRouter();const [chosen,setChosen]=useState(account.roleIds),[saved,setSaved]=useState(account.roleIds),[status,setStatus]=useState(""),[busy,setBusy]=useState(false);
 const editable=can(access,"roles.assign")&&!account.superAdmin;
 const dirty=JSON.stringify([...chosen].sort())!==JSON.stringify([...saved].sort());
 const effective=[...new Set(roles.filter(role=>chosen.includes(role.id)).flatMap(role=>role.permissions))];
 async function save(){
  if(!editable||busy)return;setBusy(true);setStatus("");
  try{
   const response=await fetch("/api/admin/users",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:account.id,roleIds:chosen,expectedRoleIds:saved})});
   const body=await response.json();if(response.ok){setSaved(chosen);router.refresh();}
   setStatus(response.ok?"Attribution enregistrée.":body.error??"Enregistrement impossible.");
  }catch{setStatus("Connexion interrompue. Réessaie.");}finally{setBusy(false);}
 }
 return <article className="admin-account-card"><header><div className="admin-account-avatar" aria-hidden="true">{account.name.slice(0,1)}</div><div><h2>{account.name}</h2><span>{account.superAdmin?"Superadministrateur protégé":saved.length?saved.length+" rôle"+(saved.length===1?"":"s"):"Joueur · aucun rôle"}</span></div></header>
 {account.superAdmin?<p className="admin-protection-message"><ShieldCheck aria-hidden="true"/>Toutes les permissions sont garanties pour Bougli.</p>:<>
 <fieldset disabled={!editable||busy}><legend>Rôles attribués</legend><div className="admin-account-role-grid">{roles.filter(role=>!role.archived).map(role=><label className="admin-check" key={role.id}><input type="checkbox" checked={chosen.includes(role.id)} disabled={!canDelegate(access,role.permissions)} onChange={event=>setChosen(value=>event.target.checked?[...value,role.id]:value.filter(id=>id!==role.id))}/><span>{role.name}{!canDelegate(access,role.permissions)&&<small>Permissions supérieures · attribution protégée</small>}</span></label>)}</div></fieldset>
 <details className="admin-effective"><summary>{effective.length} permissions cumulées · {effective.includes("admin.access")?"Accès au panel":"Aucun accès au panel"}</summary>{effective.length?<ul>{effective.map(key=><li key={key}>{permissionLabels[key]}</li>)}</ul>:<p>Aucune permission administrative.</p>}</details>
 {editable&&<button className="button game-primary" type="button" disabled={busy||!dirty} onClick={save}><Save aria-hidden="true"/>{busy?"Enregistrement…":"Enregistrer les rôles"}</button>}
 <p role="status" aria-live="polite">{status||(dirty?"Modifications non enregistrées":"")}</p></>}
 </article>;
}
export function AdminAccounts({accounts,roles,access,query,page,hasMore}:{accounts:AdminAccountView[];roles:AdminRoleView[];access:AdminAccess;query:string;page:number;hasMore:boolean}){
 return <><section className="admin-target-panel"><div className="admin-section-heading"><Users aria-hidden="true"/><div><h2>Répartir les missions</h2><p>Plusieurs rôles par compte. Aucun rôle pour les joueurs par défaut.</p></div></div>
 <form method="get" action="/admin/comptes" className="admin-account-search"><label>Rechercher un pseudo<input name="q" defaultValue={query} maxLength={60} autoComplete="off"/></label><button className="quiet-button"><Search aria-hidden="true"/>Rechercher</button></form></section>
 <div className="admin-account-list">{accounts.map(account=><AccountRoles key={account.id+JSON.stringify(account.roleIds)} account={account} roles={roles} access={access}/>)}</div>
 {!accounts.length&&<p className="admin-target-panel">Aucun compte ne correspond à ce pseudo.</p>}
 <nav className="admin-pagination" aria-label="Pages des comptes">{page>0&&<a className="quiet-button" href={"/admin/comptes?q="+encodeURIComponent(query)+"&page="+(page-1)}>Page précédente</a>}<span>Page {page+1}</span>{hasMore&&<a className="quiet-button" href={"/admin/comptes?q="+encodeURIComponent(query)+"&page="+(page+1)}>Page suivante</a>}</nav></>;
}
