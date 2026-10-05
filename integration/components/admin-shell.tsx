import Link from "next/link";
import { AdminNavigation } from "./admin-navigation";
import { ShieldCheck,ArrowLeft,Settings2,Layers3,Gift,Newspaper,Users,LayoutDashboard } from "lucide-react";
import { PlayerChrome } from "@/components/player-ui";
import type { AdminAccess } from "@/lib/admin-permissions";
import { visibleAdminGroups } from "@/lib/admin-navigation";
const icons={cards:Layers3,rewards:Gift,content:Newspaper,team:Users,settings:Settings2};
export function AdminShell({access,active,title,description,children}:{access:AdminAccess;active:string;title:string;description:string;children:React.ReactNode}){
 const groups=visibleAdminGroups(access);
 const current=groups.find(group=>group.sections.some(section=>active===section.href||active.startsWith(section.href+"/")));
 return <><PlayerChrome/><main className="admin-workspace"><aside className="admin-sidebar" aria-label="Navigation administration">
 <div className="admin-brand"><ShieldCheck aria-hidden="true"/><div><strong>Administration</strong><span>GeeckosCollector</span></div></div>
 <AdminNavigation><nav aria-label="Espaces de l’administration">
 <Link href="/admin" aria-current={active==="/admin"?"page":undefined}><LayoutDashboard aria-hidden="true"/>Vue d’ensemble</Link>
 {groups.map(group=>{const Icon=icons[group.id as keyof typeof icons];return <Link key={group.id} href={group.sections[0].href} aria-current={current?.id===group.id?"location":undefined}><Icon aria-hidden="true"/>{group.label}</Link>;})}
 </nav></AdminNavigation>
 <Link className="admin-return" href="/compte"><ArrowLeft aria-hidden="true"/>Retour au jeu</Link></aside>
 <div className="admin-content">
 {current&&<nav className="admin-subnavigation" aria-label={"Rubriques : "+current.label}><span>{current.label}</span><div>{current.sections.map(section=><Link key={section.href} href={section.href} aria-current={active===section.href||active.startsWith(section.href+"/")?"page":undefined}>{section.label}</Link>)}</div></nav>}
 <header className="admin-page-header"><div><span className="section-kicker">ATELIER · ADMINISTRATION</span><h1>{title}</h1><p>{description}</p></div><span className="admin-access-badge"><ShieldCheck aria-hidden="true"/>{access.superAdmin?"Superadministrateur":"Équipe du jeu"}</span></header>{children}</div></main></>;
}
