export const defectNames={miscut:"Découpe décalée",registration:"Décalage des couleurs",missingInk:"Encre manquante",stain:"Taches d’impression",printLine:"Ligne d’impression"} as const;
export type DefectSettings={
 miscut:{enabled:boolean;x:number;y:number;angle:number};
 registration:{enabled:boolean;offset:number};
 missingInk:{enabled:boolean;channel:"cyan"|"magenta"|"yellow"|"black";strength:number};
 stain:{enabled:boolean;count:number;size:number};
 printLine:{enabled:boolean;position:number;width:number;direction:"horizontal"|"vertical"};
 seed:number;
};
export type DefectScenario={version:1;setCode:string;cardId:string;neighborId:string;settings:DefectSettings};
export function defaultDefects():DefectSettings{return {
 miscut:{enabled:false,x:12,y:0,angle:0},
 registration:{enabled:false,offset:6},
 missingInk:{enabled:false,channel:"cyan",strength:.55},
 stain:{enabled:false,count:4,size:12},
 printLine:{enabled:false,position:50,width:3,direction:"vertical"},
 seed:2026,
};}
export function activeDefectNames(settings:DefectSettings){
 return (Object.keys(defectNames) as (keyof typeof defectNames)[]).filter(key=>settings[key].enabled).map(key=>defectNames[key]);
}
export function validDefects(value:unknown):value is DefectSettings{
 if(!value||typeof value!=="object")return false;
 const v=value as DefectSettings;
 const n=(v:unknown,min:number,max:number)=>typeof v==="number"&&Number.isFinite(v)&&v>=min&&v<=max;
 return Number.isSafeInteger(v.seed)&&n(v.seed,0,1000000000)&&
  !!v.miscut&&typeof v.miscut.enabled==="boolean"&&n(v.miscut.x,-30,30)&&n(v.miscut.y,-30,30)&&n(v.miscut.angle,-6,6)&&
  !!v.registration&&typeof v.registration.enabled==="boolean"&&n(v.registration.offset,0,30)&&
  !!v.missingInk&&typeof v.missingInk.enabled==="boolean"&&["cyan","magenta","yellow","black"].includes(v.missingInk.channel)&&n(v.missingInk.strength,0,1)&&
  !!v.stain&&typeof v.stain.enabled==="boolean"&&Number.isInteger(v.stain.count)&&n(v.stain.count,1,12)&&n(v.stain.size,1,40)&&
  !!v.printLine&&typeof v.printLine.enabled==="boolean"&&n(v.printLine.position,0,100)&&n(v.printLine.width,.5,20)&&["horizontal","vertical"].includes(v.printLine.direction);
}
export function parseDefectScenario(value:unknown):DefectScenario|null{
 if(!value||typeof value!=="object")return null;
 const v=value as DefectScenario;
 if(v.version!==1||typeof v.setCode!=="string"||typeof v.cardId!=="string"||typeof v.neighborId!=="string"||!validDefects(v.settings))return null;
 const s=v.settings;
 return {version:1,setCode:v.setCode,cardId:v.cardId,neighborId:v.neighborId,settings:{
 miscut:{enabled:s.miscut.enabled,x:s.miscut.x,y:s.miscut.y,angle:s.miscut.angle},
 registration:{enabled:s.registration.enabled,offset:s.registration.offset},
 missingInk:{enabled:s.missingInk.enabled,channel:s.missingInk.channel,strength:s.missingInk.strength},
 stain:{enabled:s.stain.enabled,count:s.stain.count,size:s.stain.size},
 printLine:{enabled:s.printLine.enabled,position:s.printLine.position,width:s.printLine.width,direction:s.printLine.direction},seed:s.seed}};
}
export function defectSpots(settings:DefectSettings){
 let seed=settings.seed>>>0;
 const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 return Array.from({length:settings.stain.count},()=>({x:25+next()*550,y:25+next()*775,r:settings.stain.size*(.4+next()*.6),angle:next()*180}));
}
