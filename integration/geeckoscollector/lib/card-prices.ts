import { availableFinishes,type AvailableFinish } from "./card-metadata";
export const maxCardPrice=1_000_000_000;
export type PriceScope="rarity"|"card";
export type PriceValues={coins:number|null;gems:number|null};
export type PriceRule=PriceValues&{finish:AvailableFinish;revision:number};
export type ResolvedPrice=PriceValues&{coinsSource:PriceScope|null;gemsSource:PriceScope|null};
export type PriceDetail={scope:PriceScope;target:string;setCode:string;name:string;rarity:string;rules:PriceRule[];effective:Record<AvailableFinish,ResolvedPrice>};
export type PriceOverview={rarities:string[];sets:{code:string;name:string}[]};
export function rarityKey(value:string){return value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ");}
export function priceKey(scope:PriceScope,target:string,finish:AvailableFinish){return JSON.stringify([scope,scope==="rarity"?rarityKey(target):target,finish]);}
export function validPrice(value:unknown):value is number|null{return value===null||(typeof value==="number"&&Number.isSafeInteger(value)&&value>=0&&value<=maxCardPrice);}
export function validPriceRules(value:unknown):value is PriceRule[]{
 return Array.isArray(value)&&value.length===availableFinishes.length&&new Set(value.map(v=>v?.finish)).size===availableFinishes.length&&value.every(v=>v&&availableFinishes.includes(v.finish)&&validPrice(v.coins)&&validPrice(v.gems)&&Number.isSafeInteger(v.revision)&&v.revision>=0&&v.revision<2_000_000_000);
}
export function resolvePrice(general:PriceValues|undefined,exception?:PriceValues):ResolvedPrice{
 return {coins:exception?.coins??general?.coins??null,gems:exception?.gems??general?.gems??null,coinsSource:exception?.coins!=null?"card":general?.coins!=null?"rarity":null,gemsSource:exception?.gems!=null?"card":general?.gems!=null?"rarity":null};
}
