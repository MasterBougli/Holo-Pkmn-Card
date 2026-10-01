// Configuration indépendante du moteur de rendu des effets.
export const cardFinishes = ["normal", "reverse", "fullart"] as const;
export type CardFinish = typeof cardFinishes[number];
export const holoEffects = ["none", "classic", "illusion", "glitter", "rainbow", "galaxy"] as const;
export type HoloEffect = typeof holoEffects[number];

export type ArtworkWindow = { top:number; left:number; width:number; height:number };
export type HoloProfile = {
  effect:HoloEffect;
  intensity:number;
  artworkWindow:ArtworkWindow;
};
export type AppearanceOverrides = Partial<Record<CardFinish,Partial<HoloProfile>>>;
export type ResolvedAppearance = HoloProfile & {
  finish:CardFinish;
  source:"default" | "set" | "card";
};

const artworkWindow:ArtworkWindow = {top:16,left:7,width:86,height:33};
export const defaultHoloProfile:HoloProfile = {
  effect:"none",intensity:0.3,artworkWindow,
};

// Un effet désactivé explicitement reste prioritaire ; absence = héritage.
// La configuration esthétique ne détermine pas les variantes réellement disponibles.
export function resolveCardAppearance(
  finish:CardFinish,
  setOverrides:AppearanceOverrides = {},
  cardOverrides:AppearanceOverrides = {},
):ResolvedAppearance {
  const setProfile=setOverrides[finish];
  const cardProfile=cardOverrides[finish];
  const merged={...defaultHoloProfile,...setProfile,...cardProfile};
  return {
    ...merged,
    artworkWindow:{...merged.artworkWindow},
    finish,
    source:cardProfile && Object.keys(cardProfile).length ? "card" : setProfile && Object.keys(setProfile).length ? "set" : "default",
  };
}

function record(value:unknown):value is Record<string,unknown> {
  return value!==null && typeof value==="object" && !Array.isArray(value);
}
function bounded(value:unknown,min:number,max:number):value is number {
  return typeof value==="number" && Number.isFinite(value) && value>=min && value<=max;
}
function validWindow(value:unknown):value is ArtworkWindow {
  if(!record(value) || Object.keys(value).some(key=>!["top","left","width","height"].includes(key)))return false;
  return bounded(value.top,0,100) && bounded(value.left,0,100) &&
    bounded(value.width,1,100) && bounded(value.height,1,100) &&
    value.left+value.width<=100 && value.top+value.height<=100;
}
// À utiliser côté serveur avant toute future sauvegarde dans le panel.
export function isAppearanceOverrides(value:unknown):value is AppearanceOverrides {
  if(!record(value))return false;
  return Object.entries(value).every(([finish,profile])=>{
    if(!cardFinishes.includes(finish as CardFinish) || !record(profile))return false;
    if(Object.keys(profile).some(key=>!["effect","intensity","artworkWindow"].includes(key)))return false;
    if("effect" in profile && !holoEffects.includes(profile.effect as HoloEffect))return false;
    if("intensity" in profile && !bounded(profile.intensity,0,1))return false;
    if("artworkWindow" in profile && !validWindow(profile.artworkWindow))return false;
    return true;
  });
}
