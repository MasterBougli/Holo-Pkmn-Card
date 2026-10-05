export type RevealStyle={enabled:boolean;color:string};
export type RevealStyles=Record<string,RevealStyle>;
export type RevealConfiguration={styles:RevealStyles;revision:number};
export function basicRarity(name:string){return /^(commune?|common|peu commune?|uncommon)$/i.test(name.trim());}
export function defaultRevealStyle(name:string):RevealStyle{
 const enabled=!basicRarity(name)&&!/^(none|sans raret[eé]|inconnu|non renseign)/i.test(name.trim())&&/rare|l[eé]gende|magnifique|dresseur full art/i.test(name);
 let hash=0;for(const c of name.toLocaleLowerCase("fr"))hash=(hash*31+c.charCodeAt(0))>>>0;
 const hue=hash%360,s=.64,l=.46,a=s*Math.min(l,1-l);
 const channel=(n:number)=>{const k=(n+hue/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,"0");};
 return {enabled,color:"#"+channel(0)+channel(8)+channel(4)};
}
export function revealStyle(name:string,styles:RevealStyles):RevealStyle{
 const value=Object.hasOwn(styles,name)?styles[name]:defaultRevealStyle(name);
 return basicRarity(name)?{...value,enabled:false}:value;
}
export function validRevealStyles(value:unknown):value is RevealStyles{
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const entries=Object.entries(value);return entries.length<=200&&entries.every(([name,s])=>name.trim().length>0&&name.length<=160&&!/[\u0000-\u001f\u007f]/.test(name)&&!["__proto__","constructor","prototype"].includes(name)&&s&&typeof s==="object"&&typeof s.enabled==="boolean"&&typeof s.color==="string"&&/^#[a-fA-F0-9]{6}$/.test(s.color)&&(!basicRarity(name)||!s.enabled));
}
