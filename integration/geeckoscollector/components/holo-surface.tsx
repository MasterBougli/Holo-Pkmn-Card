// SPDX-License-Identifier: GPL-3.0-only
// Rendering integration for pokemon-cards-css, Simon Goellner, 2026-10-01.
import type { CSSProperties,ReactNode } from "react";
import type { ResolvedAppearance } from "@/lib/card-appearance";
const rarity={none:"",classic:"rare holo",illusion:"rare ultra",glitter:"rare secret",rainbow:"rare rainbow",galaxy:"rare holo cosmos"};
export function HoloSurface({profile,rotation,children,hidden}:{hidden?:boolean;profile:ResolvedAppearance;rotation:{x:number;y:number};children:ReactNode}){
 // La lumière est fixe dans la scène : sa projection dépend de l'orientation,
 // jamais de la position du pointeur. Fonction périodique, continue sur 360°.
 const radians=Math.PI/180;
 const light={x:50+45*Math.sin(rotation.y*radians),y:Math.max(0,Math.min(100,50-70*Math.sin(rotation.x*radians)))};
 const w=profile.artworkWindow;
 const right=100-w.left-w.width,bottom=100-w.top-w.height;
 const clip=profile.finish==="fullart"?"inset(0)":profile.finish==="normal"
  ? "inset("+w.top+"% "+right+"% "+bottom+"% "+w.left+"%)"
  : "polygon(evenodd,0% 0%,100% 0%,100% 100%,0% 100%,0% 0%,"+w.left+"% "+w.top+"%,"+w.left+"% "+(w.top+w.height)+"%,"+(w.left+w.width)+"% "+(w.top+w.height)+"%,"+(w.left+w.width)+"% "+w.top+"%,"+w.left+"% "+w.top+"%)";
 const style={"--pointer-x":light.x+"%","--pointer-y":light.y+"%","--background-x":(25+light.x/2)+"%","--background-y":(25+light.y/2)+"%","--pointer-from-left":light.x/100,"--pointer-from-top":light.y/100,"--pointer-from-center":Math.min(1,Math.hypot(light.x-50,light.y-50)/50),"--card-opacity":profile.intensity} as CSSProperties;
 return <div className="card-face card-front gc-holo" aria-hidden={hidden} data-rarity={rarity[profile.effect]} data-supertype="pokémon" data-finish={profile.finish} data-effect={profile.effect} style={style}>{children}{profile.effect!=="none"&&<div className="holo-area" style={{clipPath:clip}} aria-hidden="true"><div className="card__shine"/><div className="card__glare"/></div>}</div>;
}
