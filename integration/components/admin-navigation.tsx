"use client";
import { useEffect,useRef } from "react";
export function AdminNavigation({children}:{children:React.ReactNode}){
 const details=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{const query=window.matchMedia("(max-width:1120px)");const update=()=>{if(details.current)details.current.open=!query.matches;};update();query.addEventListener("change",update);return()=>query.removeEventListener("change",update);},[]);
 return <details ref={details} className="admin-navigation" open><summary className="admin-menu-summary">Menu de l’administration</summary>{children}</details>;
}
