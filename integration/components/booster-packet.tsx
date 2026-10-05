"use client";
import { useState } from "react";
import type { CSSProperties } from "react";
import { Layers3 } from "lucide-react";
export function BoosterPacket({artwork,code,cut=0,opening=false}:{artwork:string|null|undefined;code:string;cut?:number;opening?:boolean}){
 const [failed,setFailed]=useState<string|null>(null),hasArt=!!artwork&&failed!==artwork;
 return <div className={"imported-packet "+(opening?"packet-opening ":"")+(hasArt?"has-artwork":"missing-artwork")} style={{"--cut":cut+"%"} as CSSProperties}>
 {hasArt?<><img className="packet-body-image" src={artwork} alt={"Booster "+code} draggable={false} onError={()=>setFailed(artwork!)}/><div className="packet-top-fragment" aria-hidden="true"><img src={artwork} alt="" draggable={false}/></div></>:<div className="packet-missing"><Layers3 size={44}/><strong>{code}</strong><span>Visuel de booster non importé</span></div>}
 <span className="packet-cut-line" aria-hidden="true"/><span className="packet-cut-spark" aria-hidden="true"/>
 </div>;
}
