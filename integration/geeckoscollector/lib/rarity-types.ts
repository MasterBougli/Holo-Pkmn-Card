export type GameRarity={id:string;name:string;key:string;aliases:string[];revision:number};
export type RarityView=GameRarity&{cards:number;copies:number;boosterSets:string[];priceRules:{finish:string;coins:number|null;gems:number|null}[];priceCount:number};
export type RarityOverview={rarities:RarityView[];unregistered:{name:string;cards:number}[];token:string};
export function rarityNameKey(v:string){return v.trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ");}
export function validRarityName(v:unknown):v is string{return typeof v==="string"&&v.trim().length>=1&&v.trim().length<=160&&!/[\u0000-\u001f\u007f]/.test(v)&&!["__proto__","constructor","prototype"].includes(v.trim());}
export function findRarity(value:string,rows:GameRarity[]){const key=rarityNameKey(value);return rows.find(r=>r.key===key||r.aliases.some(a=>rarityNameKey(a)===key));}
export function canonicalRarity(value:string,rows:GameRarity[]){return findRarity(value,rows)?.name??value.trim();}
