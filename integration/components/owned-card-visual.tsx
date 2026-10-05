"use client";
import { useEffect,useState } from "react";
import { HoloSurface } from "@/components/holo-surface";
import { DefectSurface } from "@/components/defect-surface";
import { resolveCardAppearance,type AppearanceOverrides,type CardFinish } from "@/lib/card-appearance";
import type { OwnedCard } from "@/lib/booster-types";
export function OwnedCardVisual({card}:{card:OwnedCard}){
 const [profiles,setProfiles]=useState<AppearanceOverrides>({});
 useEffect(()=>{const c=new AbortController();fetch("/api/catalogue/"+encodeURIComponent(card.setCode)+"/"+encodeURIComponent(card.cardId),{signal:c.signal}).then(r=>r.ok?r.json():null).then(d=>{if(d&&!c.signal.aborted)setProfiles(d.appearance??{});}).catch(()=>{});return()=>c.abort();},[card.setCode,card.cardId]);
 const finish:CardFinish=card.finish==="holo"?"normal":card.finish;
 const profile=resolveCardAppearance(finish,profiles);
 if(card.finish==="normal")profile.effect="none";
 return <div className="owned-card-art" role="img" aria-label={card.name+" · "+card.rarity}><HoloSurface profile={profile} rotation={{x:0,y:0}}>{card.defects?<DefectSurface setCode={card.setCode} cardId={card.cardId} neighborId={card.defects.neighborId} settings={card.defects.settings}/>:<img src={"/media/Cards/"+card.setCode+"/"+card.cardId+".png"} alt="" draggable={false}/>}</HoloSurface></div>;
}
