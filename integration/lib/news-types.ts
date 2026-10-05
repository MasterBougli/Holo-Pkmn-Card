export type NewsBlock={id:string;type:"paragraph"|"heading"|"list"|"quote"|"link"|"image";text:string;bold?:boolean;italic?:boolean;href?:string;mediaId?:string;alt?:string};
export type NewsContent={title:string;summary:string;coverId:string|null;coverAlt:string;blocks:NewsBlock[];link:string};
export type NewsRow={id:string;slug:string;draft:NewsContent;published:NewsContent|null;publishedAt:string|null;scheduled:NewsContent|null;scheduledAt:string|null;archivedAt:string|null;revision:number;updatedAt:string};
export type NewsMedia={id:string;name:string;alt:string;width:number;height:number};
export const blankNews:NewsContent={title:"",summary:"",coverId:null,coverAlt:"",blocks:[],link:""};
export function safeNewsLink(value:string){try{const u=new URL(value);return ["https:","http:"].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}}
export function validNews(value:unknown):value is NewsContent{
 if(!value||typeof value!=="object")return false;const v=value as NewsContent;
 if(typeof v.title!=="string"||v.title.length>160||typeof v.summary!=="string"||v.summary.length>400||typeof v.coverAlt!=="string"||v.coverAlt.length>300||typeof v.link!=="string"||v.link.length>2000||(v.link&&!safeNewsLink(v.link))||(v.coverId!==null&&(typeof v.coverId!=="string"||!newsUuid(v.coverId)))||!Array.isArray(v.blocks)||v.blocks.length>60)return false;
 return new Set(v.blocks.map(b=>b?.id)).size===v.blocks.length&&v.blocks.every(b=>b&&newsUuid(b.id)&&["paragraph","heading","list","quote","link","image"].includes(b.type)&&typeof b.text==="string"&&b.text.length<=4000&&(b.bold===undefined||typeof b.bold==="boolean")&&(b.italic===undefined||typeof b.italic==="boolean")&&(b.href===undefined||(typeof b.href==="string"&&b.href.length<=2000&&(!b.href||safeNewsLink(b.href))))&&(b.mediaId===undefined||(typeof b.mediaId==="string"&&(!b.mediaId||newsUuid(b.mediaId))))&&(b.alt===undefined||(typeof b.alt==="string"&&b.alt.length<=300)));
}
export function newsUuid(v:unknown):v is string{return typeof v==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);}
export function newsMediaIds(v:NewsContent){return [...new Set([v.coverId,...v.blocks.filter(b=>b.type==="image").map(b=>b.mediaId)].filter((id):id is string=>!!id))];}
export function parisSchedule(v:string){
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v))throw Error("Date et heure invalides.");
 const base=new Date(v+"Z").getTime();if(!Number.isFinite(base))throw Error("Date invalide.");
 const f=new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
 const matches=[1,2].map(h=>new Date(base-h*3600000)).filter(d=>f.format(d).replace(" ","T")===v);
 if(matches.length!==1)throw Error("Cette heure est ambiguë ou inexistante lors du changement d’heure. Choisis une autre heure.");
 return matches[0];
}

export type NewsPublicationIssue={field:string;message:string};
export function newsPublicationIssues(v:NewsContent):NewsPublicationIssue[]{
 const issues:NewsPublicationIssue[]=[];
 const add=(field:string,message:string)=>issues.push({field,message});
 if(v.title.trim().length<3)add("news-title","Ajoute un titre d’au moins 3 caractères.");
 if(!v.summary.trim())add("news-summary","Ajoute un résumé pour les accueils.");
 if(!v.blocks.length)add("news-blocks","Ajoute au moins un bloc de contenu.");
 if(v.coverId&&!v.coverAlt.trim())add("news-cover-alt","Décris l’image de couverture.");
 if(v.link&&!safeNewsLink(v.link))add("news-link","Utilise une adresse http ou https valide pour le lien complémentaire.");
 v.blocks.forEach((b,i)=>{
  const label="Bloc "+(i+1)+" : ";
  if(b.type==="image"){
   if(!b.mediaId)add("block-image-"+b.id,label+"choisis une image.");
   if(!b.alt?.trim())add("block-alt-"+b.id,label+"ajoute une description alternative.");
  }else{
   if(!b.text.trim())add("block-text-"+b.id,label+"ajoute le texte.");
   if(b.type==="link"&&!safeNewsLink(b.href??""))add("block-link-"+b.id,label+"ajoute une adresse http ou https valide.");
  }
 });
 return issues;
}
