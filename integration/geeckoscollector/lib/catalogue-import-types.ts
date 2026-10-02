export type SourceCard={number:string;name:string;scanId:string};
export type DiscoveryItem={sourceCode:string;name:string;localCode:string;tcgdexId:string;cards:SourceCard[];missing:number;existing:number;expected:number;complete:boolean;issues:string[];mapping:string};
export type ImportRequest={reportId:string;sourceCode:string;localCode:string;tcgdexId:string;confirm:boolean};
export function normalNumber(value:string){return /^\d+$/.test(value)?String(Number(value)):value.toUpperCase();}
export function normalName(value:string){return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");}
export const codePattern=/^[A-Z0-9-]{1,12}$/;
export const tcgdexPattern=/^[a-zA-Z0-9.-]{1,40}$/;
