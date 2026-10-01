import type { ArtworkWindow } from "@/lib/card-appearance";

// Cadres de départ mesurés sur les scans locaux. Les exceptions du set et de la
// carte restent prioritaires ; un set peut contenir plusieurs cadres.
export const artworkLayouts = {
  classic: { label:"Classique · Base / Neo", window:{top:12.6,left:12.3,width:75.8,height:38.5} },
  xy: { label:"XY · illustration haute", window:{top:10.5,left:8.7,width:82.3,height:39} },
  modern: { label:"Moderne · Épée et Bouclier / Écarlate et Violet", window:{top:10,left:8,width:84,height:37.4} },
} satisfies Record<string,{label:string;window:ArtworkWindow}>;
export type ArtworkLayout = keyof typeof artworkLayouts;
const classicSets="B2 BS FO JU TR LG N1 N2 N3 N4".split(" ");
const xySets="AOR BKP BKT DCR FCO FFI FLF GEN PHF PRC ROS STS XY".split(" ");
export function getSetArtworkWindow(setCode:string):ArtworkWindow {
 const code=setCode.toUpperCase();
 const key:ArtworkLayout=classicSets.includes(code)?"classic":xySets.includes(code)?"xy":"modern";
 // Les autres générations utilisent un point de départ moderne à ajuster,
 // pas un cadre présenté comme vérifié sur chaque carte.
 return {...artworkLayouts[key].window};
}
