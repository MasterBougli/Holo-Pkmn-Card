import type { AvailableFinish } from "./card-metadata";
import type { DefectScenario } from "./card-defects";
export type BoosterSlot={count:number;choices:{rarity:string;weight:number}[]};
export type BoosterComposition={slots:BoosterSlot[];defectPpm:number};
export type OwnedCard={id:string;cardId:string;setCode:string;setName:string;name:string;localId:string;max:number;rarity:string;illustrator:string;finish:AvailableFinish;isNew:boolean;defects:DefectScenario|null;position:number};
export type CollectionCard = OwnedCard & { quantity: number };
export type BoosterPack={id:string;setCode:string;setName:string;artwork?:string|null;openedAt:string|null;createdAt:string};
export function validComposition(value:unknown):value is BoosterComposition{
 if(!value||typeof value!=="object")return false;
 const v=value as BoosterComposition;
 return Number.isInteger(v.defectPpm)&&v.defectPpm>=0&&v.defectPpm<=1000&&Array.isArray(v.slots)&&v.slots.length>0&&v.slots.length<=20&&v.slots.every(s=>s&&Number.isInteger(s.count)&&s.count>=1&&s.count<=20&&Array.isArray(s.choices)&&s.choices.length>0&&s.choices.length<=30&&new Set(s.choices.map(c=>c.rarity)).size===s.choices.length&&s.choices.every(c=>c&&typeof c.rarity==="string"&&c.rarity.trim().length>0&&c.rarity.length<=160&&Number.isInteger(c.weight)&&c.weight>=1&&c.weight<=1000000))&&v.slots.reduce((n,s)=>n+s.count,0)<=30;
}
