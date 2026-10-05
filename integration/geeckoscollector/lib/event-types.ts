import {newsUuid,parisSchedule} from "./news-types";
export type EventReward={id:string;kind:"booster"|"card"|"coins"|"gems";quantity:number;setCode:string;cardId:string};
export type EventObjective={id:string;kind:"boosters"|"card";quantity:number;setCode:string;cardId:string;rewards:EventReward[]};
export type EventContent={kind:"announcement"|"playable";title:string;summary:string;description:string;starts:string;ends:string;objectives:EventObjective[];rewards:EventReward[]};
export type EventRow={id:string;draft:EventContent;published:EventContent|null;archivedAt:string|null;revision:number};
export const blankEvent:EventContent={kind:"announcement",title:"",summary:"",description:"",starts:"",ends:"",objectives:[],rewards:[]};
const code=(v:unknown)=>typeof v==="string"&&(!v||/^[A-Z0-9.-]{1,12}$/.test(v));
const card=(v:unknown)=>typeof v==="string"&&v.length<=100;
const amount=(v:unknown,max=1000000)=>Number.isSafeInteger(v)&&Number(v)>0&&Number(v)<=max;
function rewards(v:unknown):v is EventReward[]{return Array.isArray(v)&&v.length<=20&&new Set(v.map(r=>r?.id)).size===v.length&&v.every(r=>r&&newsUuid(r.id)&&["booster","card","coins","gems"].includes(r.kind)&&amount(r.quantity,r.kind==="booster"||r.kind==="card"?100:1000000)&&code(r.setCode)&&card(r.cardId)&&(["coins","gems"].includes(r.kind)||!!r.setCode)&&(r.kind!=="card"||!!r.cardId));}
export function validEvent(v:unknown):v is EventContent{
 if(!v||typeof v!=="object")return false;const e=v as EventContent;
 return ["announcement","playable"].includes(e.kind)&&typeof e.title==="string"&&e.title.length<=160&&typeof e.summary==="string"&&e.summary.length<=400&&typeof e.description==="string"&&e.description.length<=8000&&[e.starts,e.ends].every(x=>typeof x==="string"&&(!x||/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(x)))&&Array.isArray(e.objectives)&&e.objectives.length<=20&&new Set(e.objectives.map(o=>o?.id)).size===e.objectives.length&&e.objectives.every(o=>o&&newsUuid(o.id)&&["boosters","card"].includes(o.kind)&&amount(o.quantity,100000)&&code(o.setCode)&&card(o.cardId)&&rewards(o.rewards)&&(o.kind!=="card"||!!o.setCode&&!!o.cardId))&&rewards(e.rewards)&&(e.kind!=="announcement"||!e.objectives.length&&!e.rewards.length);
}
export function eventDates(e:EventContent){const start=parisSchedule(e.starts),end=parisSchedule(e.ends);if(end<=start)throw Error("La fin doit être après le début.");return {start,end};}
export function eventPublicationIssues(e:EventContent){const issues:string[]=[];if(e.kind==="playable")issues.push("La publication des défis attend le moteur de progression et de récupération des récompenses.");if(e.title.trim().length<3)issues.push("Ajoute un titre d’au moins 3 caractères.");if(!e.summary.trim())issues.push("Ajoute un résumé.");if(!e.description.trim())issues.push("Ajoute une description.");try{eventDates(e);}catch(error){issues.push((error as Error).message);}return issues;}
