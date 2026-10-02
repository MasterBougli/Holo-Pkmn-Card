"use client";
import { useId } from "react";
import { defectSpots,type DefectSettings } from "@/lib/card-defects";
export function DefectSurface({setCode,cardId,neighborId,settings,original=false}:{setCode:string;cardId:string;neighborId:string;settings:DefectSettings;original?:boolean}){
 const id=useId().replace(/:/g,""),s=settings;
 const cut=!original&&s.miscut.enabled;
 const offset=!original&&s.registration.enabled?s.registration.offset:0;
 const ink=!original&&s.missingInk.enabled?s.missingInk.strength:0;
 const channel=s.missingInk.channel;
 const missing=(c:string)=>channel===c||channel==="black"?ink:0;
 const red=missing("cyan"),green=missing("magenta"),blue=missing("yellow");
 const url=(value:string)=>"/media/Cards/"+encodeURIComponent(setCode)+"/"+encodeURIComponent(value)+".png";
 return <svg className="defect-artwork" viewBox="0 0 600 825" aria-hidden="true" focusable="false">
 <defs>
 <clipPath id={id+"-clip"}><rect width="600" height="825" rx="22"/></clipPath>
 <filter id={id+"-print"} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
 <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" result="cyan"/><feOffset in="cyan" dx={offset} dy={offset*.4} result="cyanShift"/>
 <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 1  0 1 0 0 0  0 0 0 0 1  0 0 0 1 0" result="magenta"/><feOffset in="magenta" dx={-offset} dy={offset*.25} result="magentaShift"/>
 <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 1 0 0  0 0 0 1 0" result="yellow"/>
 <feBlend in="cyanShift" in2="magentaShift" mode="multiply" result="two"/><feBlend in="two" in2="yellow" mode="multiply" result="printed"/>
 <feColorMatrix in="printed" type="matrix" values={(1-red)+" 0 0 0 "+red+"  0 "+(1-green)+" 0 0 "+green+"  0 0 "+(1-blue)+" 0 "+blue+"  0 0 0 1 0"}/>
 </filter>
 </defs>
 <g clipPath={"url(#"+id+"-clip)"}><rect width="600" height="825" fill="white"/>
 <g transform={cut?"translate("+s.miscut.x*6+" "+s.miscut.y*8.25+") rotate("+s.miscut.angle+" 300 412.5)":undefined}>
 <g filter={!original&&(offset>0||ink>0)?"url(#"+id+"-print)":undefined}>
 {cut&&[-1,0,1].flatMap(x=>[-1,0,1].filter(y=>x!==0||y!==0).map(y=><image key={x+":"+y} href={url(neighborId)} x={x*600} y={y*825} width="600" height="825" preserveAspectRatio="none"/>))}
 <image href={url(cardId)} width="600" height="825" preserveAspectRatio="none"/>
 </g>
 {!original&&s.stain.enabled&&defectSpots(s).map((spot,i)=><ellipse key={i} cx={spot.x} cy={spot.y} rx={spot.r} ry={spot.r*.55} transform={"rotate("+spot.angle+" "+spot.x+" "+spot.y+")"} fill="#172132" opacity=".62"/>)}
 {!original&&s.printLine.enabled&&(s.printLine.direction==="vertical"?<rect x={s.printLine.position*6-s.printLine.width/2} width={s.printLine.width} height="825" fill="white" opacity=".9"/>:<rect y={s.printLine.position*8.25-s.printLine.width/2} width="600" height={s.printLine.width} fill="white" opacity=".9"/>)}
 </g></g></svg>;
}
