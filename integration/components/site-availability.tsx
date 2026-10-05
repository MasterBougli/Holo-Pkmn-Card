"use client";
import { createContext,useContext,useEffect,useState } from "react";
import { usePathname,useRouter } from "next/navigation";
import { Wrench } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import type { SiteAvailability } from "@/lib/site-config";
const AvailabilityContext=createContext<SiteAvailability|null>(null);
export function useSiteAvailability(){return useContext(AvailabilityContext);}
export function SiteAvailabilityProvider({children}:{children:React.ReactNode}){
 const [status,setStatus]=useState<SiteAvailability|null>(null);
 const {data:session}=authClient.useSession();
 useEffect(()=>{
  const controller=new AbortController();
  let active=true;
  async function refresh(){
   try{
    const response=await fetch("/api/site/status",{cache:"no-store",signal:controller.signal});
    if(!response.ok)return;
    const data=await response.json();
    if(active)setStatus(data);
   }catch{/* Server guards continue to enforce access when the notice cannot refresh. */}
  }
  void refresh();
  const interval=window.setInterval(()=>{if(document.visibilityState==="visible")void refresh();},30000);
  const onFocus=()=>void refresh();
  const onVisibility=()=>{if(document.visibilityState==="visible")void refresh();};
  window.addEventListener("focus",onFocus);window.addEventListener("site-availability-changed",onFocus);document.addEventListener("visibilitychange",onVisibility);
  return ()=>{active=false;controller.abort();window.clearInterval(interval);window.removeEventListener("focus",onFocus);window.removeEventListener("site-availability-changed",onFocus);document.removeEventListener("visibilitychange",onVisibility);};
 },[session?.user.id]);
 return <AvailabilityContext.Provider value={status}>{children}</AvailabilityContext.Provider>;
}
export function SiteAvailabilityNotice(){
 const status=useSiteAvailability(),pathname=usePathname(),router=useRouter();
 useEffect(()=>{
  if(status?.maintenanceEnabled&&!status.canPlay&&(pathname==="/compte"||pathname.startsWith("/compte/")))router.replace("/maintenance");
 },[status,pathname,router]);
 if(!status?.maintenanceEnabled||pathname==="/maintenance")return null;
 return <aside className="site-availability shell" aria-label="Information de maintenance"><Wrench aria-hidden="true"/><div><strong>Maintenance du jeu</strong><p>{status.maintenanceMessage}</p><small>{status.canPlay?"L’équipe garde accès au jeu pour sa préparation.":"L’accueil, les actualités et les sets restent consultables."}</small></div></aside>;
}
