export const availableFinishes=["normal","holo","reverse","fullart"] as const;
export type AvailableFinish=typeof availableFinishes[number];
export const finishLabels:Record<AvailableFinish,string>={normal:"Normale",holo:"Holographique",reverse:"Reverse",fullart:"Full art"};
export type CardMetadataFields={name:string;localId:string;rarity:string;illustrator:string;finishes:AvailableFinish[]};
export type CardMetadataView=CardMetadataFields&{id:string;setCode:string;setName:string;revision:number;imageAvailable:boolean;missing:string[];source:string};
export function singleFinish(value:unknown):AvailableFinish[]{
 return Array.isArray(value)&&value.length===1&&availableFinishes.includes(value[0])?[value[0]]:[];
}
export function validMetadata(value:unknown):value is CardMetadataFields{
 if(!value||typeof value!=="object")return false;
 const v=value as CardMetadataFields;
 return [v.name,v.localId,v.rarity,v.illustrator].every(text=>typeof text==="string"&&text.trim().length<=160&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text))&&Array.isArray(v.finishes)&&v.finishes.length<=1&&v.finishes.every(finish=>availableFinishes.includes(finish));
}
export function missingMetadata(value:CardMetadataFields,imageAvailable:boolean){
 const present=(s:string)=>!!s.trim()&&!/^(non renseign[eé]e?|sans raret[eé]|inconnue?|[—-])$/i.test(s.trim());
 return [...(!present(value.name)?["Nom"]:[]),...(!present(value.localId)?["Numéro"]:[]),...(!present(value.rarity)?["Rareté"]:[]),...(!present(value.illustrator)?["Illustrateur"]:[]),...(!imageAvailable?["Image"]:[]),...(!singleFinish(value.finishes).length?["Finition unique"]:[])];
}
