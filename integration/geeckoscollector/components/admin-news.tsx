"use client";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {Plus,Save,Trash2,ArrowUp,ArrowDown} from "lucide-react";
import {NewsContentView} from "./news-content";
import {blankNews,newsPublicationIssues,type NewsContent,type NewsBlock,type NewsRow,type NewsMedia} from "@/lib/news-types";
type Version={id:string;revision:number;content:NewsContent;action:string;actorName:string;createdAt:string};
const labels={paragraph:"Paragraphe",heading:"Titre",list:"Liste",quote:"Citation",link:"Lien",image:"Image"} as const;
function status(a:NewsRow){if(a.archivedAt)return "Corbeille";if(a.scheduledAt)return new Date(a.scheduledAt).getTime()<=Date.now()?"Publication programmée visible":"Publication programmée";return a.published?"Publié · brouillon modifiable":"Brouillon";}
export function AdminNews({permissions,superAdmin}:{permissions:string[];superAdmin:boolean}){
 const can=(p:string)=>superAdmin||permissions.includes(p);
 const [articles,setArticles]=useState<NewsRow[]>([]),[trash,setTrash]=useState(false),[selected,setSelected]=useState<NewsRow|null>(null),[draft,setDraft]=useState<NewsContent>(blankNews);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(""),[notice,setNotice]=useState(""),[versions,setVersions]=useState<Version[]>([]),[versionPreview,setVersionPreview]=useState<NewsContent|null>(null);
 const [media,setMedia]=useState<NewsMedia[]>([]),[library,setLibrary]=useState(false),[mediaTarget,setMediaTarget]=useState<string|null>(null),[uploadAlt,setUploadAlt]=useState(""),[date,setDate]=useState("");
 const file=useRef<HTMLInputElement>(null),editor=useRef<HTMLElement>(null);
 const dirty=!!selected&&JSON.stringify(draft)!==JSON.stringify(selected.draft);
 const publicationIssues=newsPublicationIssues(draft);
 useEffect(()=>{if(!dirty)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn);},[dirty]);
 async function api(url:string,options?:RequestInit){const r=await fetch(url,{cache:"no-store",...options}),d=await r.json();if(!r.ok)throw Error(d.error??"Opération impossible.");return d;}
 useEffect(()=>{const c=new AbortController();setLoading(true);api("/api/admin/news?trash="+(trash?"1":"0"),{signal:c.signal}).then(d=>{if(!c.signal.aborted)setArticles(d.articles);}).catch(e=>{if(!c.signal.aborted)setError(e.message);}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[trash]);
 async function refresh(){setArticles((await api("/api/admin/news?trash="+(trash?"1":"0"))).articles);}
 function choose(a:NewsRow|null){if(dirty&&!window.confirm("Abandonner les modifications non enregistrées ?"))return;setSelected(a);setDraft(a?.draft??blankNews);setVersions([]);setVersionPreview(null);setLibrary(false);setMediaTarget(null);setError("");setNotice("");setDate("");}
 async function action(kind:string,extra:Record<string,unknown>={}){
  if(busy)return;
  if(["trash","unpublish"].includes(kind)&&!window.confirm(kind==="trash"?"Mettre cet article dans la corbeille et le retirer du site ?":"Retirer cette actualité du site et annuler sa programmation ?"))return;
  setBusy(true);setError("");setNotice("");
  try{
   const a=await api("/api/admin/news",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind,id:selected?.id,revision:selected?.revision,content:draft,...extra})});
   setSelected(a);setDraft(a.draft);setVersions([]);setVersionPreview(null);
   setNotice(kind==="save"?"Brouillon enregistré. La version en ligne est conservée.":kind==="restore"?"Ancienne version restaurée comme brouillon.":kind==="schedule"?"Publication programmée (Europe/Paris).":kind==="untrash"?"Article restauré comme brouillon.":"Action enregistrée.");
   await refresh();if(kind==="create")requestAnimationFrame(()=>{document.getElementById("news-title")?.focus();});
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 async function history(){setBusy(true);setError("");try{setVersions((await api("/api/admin/news?versions="+selected?.id)).versions);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function openLibrary(target:string|null){setMediaTarget(target);setLibrary(true);setError("");try{setMedia((await api("/api/admin/news?media=1")).media);}catch(e){setError((e as Error).message);}}
 function useMedia(m:NewsMedia){if(mediaTarget===null)setDraft(d=>({...d,coverId:m.id,coverAlt:m.alt}));else setDraft(d=>({...d,blocks:d.blocks.map(b=>b.id===mediaTarget?{...b,mediaId:m.id,alt:m.alt}:b)}));setLibrary(false);}
 async function upload(){
  const image=file.current?.files?.[0];if(!image)return;setBusy(true);setError("");
  try{if(image.size>8*1024*1024)throw Error("Image limitée à 8 Mo.");if(!uploadAlt.trim())throw Error("Ajoute une description alternative.");
   const m=await api("/api/admin/news/media?name="+encodeURIComponent(image.name.slice(0,160))+"&alt="+encodeURIComponent(uploadAlt),{method:"POST",headers:{"Content-Type":image.type},body:image});setMedia(list=>[m,...list]);setUploadAlt("");if(file.current)file.current.value="";setNotice("Image ajoutée à la bibliothèque.");
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 function block(id:string,patch:Partial<NewsBlock>){setDraft(d=>({...d,blocks:d.blocks.map(b=>b.id===id?{...b,...patch}:b)}));}
 function move(i:number,direction:number){setDraft(d=>{const blocks=[...d.blocks],target=i+direction;[blocks[i],blocks[target]]=[blocks[target],blocks[i]];return {...d,blocks};});}
 const editable=can("news.edit")&&!!selected&&!selected.archivedAt;
 return <section aria-label="Gestion des actualités">
 <div className="news-admin-toolbar"><button className="quiet-button" disabled={busy} onClick={()=>{if(dirty&&!window.confirm("Abandonner le brouillon non enregistré ?"))return;setSelected(null);setTrash(!trash);}}>{trash?"Voir les articles":"Ouvrir la corbeille"}</button>
 <button className="quiet-button" disabled={busy} onClick={()=>void refresh().catch(e=>setError(e.message))}>Actualiser la liste</button>
 {can("news.create")&&<button className="button game-primary" disabled={busy||dirty} onClick={()=>{setDraft(blankNews);void action("create",{content:blankNews});}}><Plus aria-hidden="true"/>Nouvelle actualité</button>}</div>
 {error&&<p className="admin-catalogue-error" role="alert">{error}</p>}{notice&&<p className="admin-catalogue-notice" role="status">{notice}</p>}
 {loading&&<p role="status">Chargement des actualités…</p>}
 {!selected?<div className="news-list">{!loading&&!articles.length&&<p className="news-empty">{trash?"La corbeille est vide.":"Aucune actualité. Crée un premier brouillon pour commencer."}</p>}{articles.map(a=><article key={a.id}><span className="quest-label">{status(a)}</span><h2>{a.draft.title||"Brouillon sans titre"}</h2><p>{a.draft.summary}</p><button className="quiet-button" disabled={busy} onClick={()=>choose(a)}>Ouvrir l’article</button></article>)}</div>:
 <>
 <button className="quiet-button" disabled={busy} onClick={()=>choose(null)}>Retour à la liste</button>
 <div className="news-status">{status(selected)} · version {selected.revision}{selected.scheduledAt&&<p>Calendrier : {new Date(selected.scheduledAt).toLocaleString("fr-FR",{timeZone:"Europe/Paris"})} (Europe/Paris). La programmation utilise la version approuvée, même si le brouillon change.</p>}{selected.published&&<p>Le brouillon est indépendant de la version en ligne.</p>}</div>
 <div className="news-admin-grid"><section className="admin-settings-panel news-editor" ref={editor} aria-label="Éditeur visuel">
 <h2>Rédiger l’actualité</h2><fieldset disabled={!editable||busy}><legend>Informations de l’article</legend>
 <label htmlFor="news-title">Titre</label><input id="news-title" maxLength={160} value={draft.title} onChange={e=>setDraft(d=>({...d,title:e.target.value}))}/>
 <label htmlFor="news-summary">Résumé pour l’accueil</label><textarea id="news-summary" maxLength={400} value={draft.summary} onChange={e=>setDraft(d=>({...d,summary:e.target.value}))}/>
 <label>Image de couverture (facultative)</label><button className="quiet-button" type="button" onClick={()=>void openLibrary(null)}>Choisir dans la bibliothèque</button>{draft.coverId&&<><button className="quiet-button" type="button" onClick={()=>setDraft(d=>({...d,coverId:null,coverAlt:""}))}>Retirer la couverture</button><label htmlFor="news-cover-alt">Description alternative de la couverture</label><input id="news-cover-alt" maxLength={300} value={draft.coverAlt} onChange={e=>setDraft(d=>({...d,coverAlt:e.target.value}))}/></>}
 <label htmlFor="news-link">Lien complémentaire (facultatif)</label><input id="news-link" type="url" maxLength={2000} placeholder="https://" value={draft.link} onChange={e=>setDraft(d=>({...d,link:e.target.value}))}/>
 </fieldset>
 {draft.blocks.map((b,i)=><fieldset className="news-block" key={b.id} disabled={!editable||busy}><legend>{labels[b.type]} {i+1}</legend><div className="news-block-actions"><button className="quiet-button" type="button" aria-label={"Monter le bloc "+(i+1)} disabled={i===0} onClick={()=>move(i,-1)}><ArrowUp/></button><button className="quiet-button" type="button" aria-label={"Descendre le bloc "+(i+1)} disabled={i===draft.blocks.length-1} onClick={()=>move(i,1)}><ArrowDown/></button><button className="quiet-button" type="button" aria-label={"Supprimer le bloc "+(i+1)} onClick={()=>setDraft(d=>({...d,blocks:d.blocks.filter(x=>x.id!==b.id)}))}><Trash2/></button></div>
 <label htmlFor={"block-text-"+b.id}>{b.type==="image"?"Légende (facultative)":b.type==="list"?"Éléments de la liste : un par ligne":"Texte"}</label><textarea id={"block-text-"+b.id} maxLength={4000} value={b.text} onChange={e=>block(b.id,{text:e.target.value})}/>
 {b.type!=="image"&&<><label className="news-inline"><input type="checkbox" checked={!!b.bold} onChange={e=>block(b.id,{bold:e.target.checked})}/>Gras</label><label className="news-inline"><input type="checkbox" checked={!!b.italic} onChange={e=>block(b.id,{italic:e.target.checked})}/>Italique</label></>}
 {b.type==="link"&&<><label htmlFor={"block-link-"+b.id}>Adresse du lien</label><input id={"block-link-"+b.id} type="url" maxLength={2000} value={b.href??""} onChange={e=>block(b.id,{href:e.target.value})}/></>}
 {b.type==="image"&&<><button id={"block-image-"+b.id} className="quiet-button" type="button" onClick={()=>void openLibrary(b.id)}>Choisir une image</button><label htmlFor={"block-alt-"+b.id}>Description alternative</label><input id={"block-alt-"+b.id} maxLength={300} value={b.alt??""} onChange={e=>block(b.id,{alt:e.target.value})}/></>}
 </fieldset>)}
 <div className="news-actions" id="news-blocks" tabIndex={-1}>{Object.entries(labels).map(([type,label])=><button className="quiet-button" type="button" key={type} disabled={!editable||busy||draft.blocks.length>=60} onClick={()=>setDraft(d=>({...d,blocks:[...d.blocks,{id:crypto.randomUUID(),type:type as NewsBlock["type"],text:""}]}))}><Plus aria-hidden="true"/>{label}</button>)}</div>
 <button className="button game-primary" disabled={!editable||busy||!dirty} onClick={()=>void action("save")}><Save aria-hidden="true"/>Enregistrer le brouillon</button><p>{dirty?"Modifications non enregistrées. Enregistre avant de publier ou programmer.":"Brouillon à jour."}</p>
 </section><aside className="news-preview" aria-label="Prévisualisation de l’article"><span className="quest-label">APERÇU DU BROUILLON</span><NewsContentView preview content={versionPreview??draft}/>{versionPreview&&<button className="quiet-button" onClick={()=>setVersionPreview(null)}>Revenir à l’aperçu du brouillon</button>}</aside></div>
 {library&&<section className="admin-settings-panel news-editor news-library" aria-label="Bibliothèque d’images"><h2>Bibliothèque d’images</h2><button className="quiet-button" disabled={busy} onClick={()=>setLibrary(false)}>Fermer la bibliothèque</button>
 {(can("news.create")||can("news.edit"))&&<><label htmlFor="news-file">Importer une image (PNG, JPEG ou WebP, 8 Mo maximum)</label><input id="news-file" type="file" accept="image/png,image/jpeg,image/webp" ref={file}/><label htmlFor="news-upload-alt">Description alternative de l’image</label><input id="news-upload-alt" maxLength={300} value={uploadAlt} onChange={e=>setUploadAlt(e.target.value)}/><button className="button game-primary" disabled={busy||!uploadAlt.trim()} onClick={()=>void upload()}>Importer dans la bibliothèque</button></>}
 <div className="news-media-grid">{media.map(m=><button key={m.id} disabled={busy||!editable} onClick={()=>useMedia(m)}><img src={"/api/news/media/"+m.id} alt={m.alt}/><span>{m.name}</span></button>)}</div>{!media.length&&<p>Aucune image importée.</p>}</section>}
 <section className="admin-settings-panel news-editor"><h2>Publication et historique</h2>{!selected.archivedAt&&<div className="news-readiness" aria-label="Préparation de la publication">{publicationIssues.length?<><h3>À compléter avant publication</h3><ul>{publicationIssues.map((issue,i)=><li key={i}><a href={"#"+issue.field} onClick={()=>document.getElementById(issue.field)?.focus()}>{issue.message}</a></li>)}</ul></>:<p>Le contenu est prêt à publier. La couverture est facultative.</p>}{dirty&&<p>Enregistre le brouillon pour activer la publication.</p>}</div>}<div className="news-actions">
 {can("news.publish")&&!selected.archivedAt&&<><button className="button game-primary" disabled={busy||dirty||publicationIssues.length>0} onClick={()=>void action("publish")}>Publier maintenant</button><button className="quiet-button" disabled={busy||dirty||(!selected.published&&!selected.scheduled)} onClick={()=>void action("unpublish")}>Dépublier</button></>}
 <button className="quiet-button" disabled={busy} onClick={()=>void history()}>Voir l’historique</button>
 {can("news.delete")&&<button className="quiet-button" disabled={busy||dirty} onClick={()=>void action(selected.archivedAt?"untrash":"trash")}>{selected.archivedAt?"Restaurer depuis la corbeille":"Mettre dans la corbeille"}</button>}
 {(selected.published||(selected.scheduledAt&&new Date(selected.scheduledAt).getTime()<=Date.now()))&&!selected.archivedAt&&<Link className="quiet-button" href={"/actualites/"+selected.slug}>Voir la version publique</Link>}
 </div>
 {can("news.publish")&&!selected.archivedAt&&<><label htmlFor="news-date">Date et heure de publication (Europe/Paris)</label><input id="news-date" type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} disabled={busy}/><div className="news-actions"><button className="button game-primary" disabled={busy||dirty||!date||publicationIssues.length>0} onClick={()=>void action("schedule",{date})}>Programmer la publication</button>{selected.scheduledAt&&new Date(selected.scheduledAt).getTime()>Date.now()&&<button className="quiet-button" disabled={busy||dirty} onClick={()=>void action("cancelSchedule")}>Annuler la programmation</button>}</div></>}
 <ul className="news-history">{versions.map(v=><li key={v.id}><strong>Version {v.revision}</strong> · {new Date(v.createdAt).toLocaleString("fr-FR",{timeZone:"Europe/Paris"})} · {v.actorName}<div className="news-actions"><button className="quiet-button" onClick={()=>setVersionPreview(v.content)}>Prévisualiser cette version</button>{editable&&<button className="quiet-button" disabled={busy||dirty} onClick={()=>void action("restore",{versionId:v.id})}>Restaurer comme brouillon</button>}</div></li>)}</ul></section>
 </>}
 </section>;
}
