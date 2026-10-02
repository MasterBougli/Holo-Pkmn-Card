export const availableFinishes=["normal","holo","reverse","fullart"] as const;
export type AvailableFinish=typeof availableFinishes[number];
export const finishLabels:Record<AvailableFinish,string>={normal:"Normale",holo:"Holographique",reverse:"Reverse",fullart:"Full art"};
export type CardMetadataFields={name:string;localId:string;rarity:string;illustrator:string;finishes:AvailableFinish[]};
export type CardMetadataView=CardMetadataFields&{id:string;setCode:string;setName:string;revision:number;imageAvailable:boolean;missing:string[];source:string};
export function validMetadata(value:unknown):value is CardMetadataFields{
 if(!value||typeof value!=="object")return false;
 const v=value as CardMetadataFields;
 return [v.name,v.localId,v.rarity,v.illustrator].every(text=>typeof text==="string"&&text.trim().length<=160&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text))&&Array.isArray(v.finishes)&&v.finishes.length<=4&&new Set(v.finishes).size===v.finishes.length&&v.finishes.every(finish=>availableFinishes.includes(finish));
}
export function missingMetadata(value:CardMetadataFields,imageAvailable:boolean){
 const present=(s:string)=>!!s.trim()&&!/^(non renseign[eé]e?|sans raret[eé]|inconnue?|[—-])$/i.test(s.trim());
 return [...(!present(value.name)?["Nom"]:[]),...(!present(value.localId)?["Numéro"]:[]),...(!present(value.rarity)?["Rareté"]:[]),...(!present(value.illustrator)?["Illustrateur"]:[]),...(!imageAvailable?["Image"]:[]),...(!value.finishes.length?["Finition disponible"]:[])];
}
