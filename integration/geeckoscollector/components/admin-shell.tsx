import Link from "next/link";
import { AdminNavigation } from "./admin-navigation";
import { ShieldCheck,Sparkles,Users,KeyRound,ScrollText,ArrowLeft,Settings2,Layers3,FlaskConical,Download,Coins,Tags } from "lucide-react";
import { PlayerChrome } from "@/components/player-ui";
import { can,type AdminAccess,type AdminPermission } from "@/lib/admin-permissions";
const links=[
 {href:"/admin/actualites",label:"Actualités",permission:"news.read",Icon:ScrollText},
 {href:"/admin/raretes",label:"Raretés",permission:"rarities.read",Icon:Tags},
 {href:"/admin/boosters",label:"Boosters et cadeaux",permission:"boosters.read",Icon:Layers3},
 {href:"/admin/prix",label:"Tarifs des cartes",permission:"economy.read",Icon:Coins},
 {href:"/admin/imports",label:"Découvertes et imports",permission:"catalogue.read",Icon:Download},
 {href:"/admin/defauts",label:"Atelier des défauts",permission:"defects.preview",Icon:FlaskConical},
 {href:"/admin/catalogue",label:"Sets et cartes",permission:"catalogue.read",Icon:Layers3},
 {href:"/admin/configuration",label:"Configuration du jeu",permission:"config.read",Icon:Settings2},
 {href:"/admin/holo",label:"Apparence des cartes",permission:"holo.read",Icon:Sparkles},
 {href:"/admin/roles",label:"Rôles et permissions",permission:"roles.read",Icon:KeyRound},
 {href:"/admin/comptes",label:"Comptes et attributions",permission:"users.read",Icon:Users},
 {href:"/admin/journal",label:"Journal d’actions",permission:"audit.read",Icon:ScrollText},
] as const;
export function AdminShell({access,active,title,description,children}:{access:AdminAccess;active:string;title:string;description:string;children:React.ReactNode}){
 return <><PlayerChrome/><main className="admin-workspace"><aside className="admin-sidebar" aria-label="Navigation administration">
 <div className="admin-brand"><ShieldCheck aria-hidden="true"/><div><strong>Administration</strong><span>GeeckosCollector</span></div></div>
 <span className="admin-nav-label">ATELIER DU JEU</span><AdminNavigation><nav>{links.filter(link=>can(access,link.permission as AdminPermission)).map(({href,label,Icon})=><Link key={href} href={href} aria-current={active===href?"page":undefined}><Icon aria-hidden="true"/>{label}</Link>)}</nav></AdminNavigation>
 <span className="admin-nav-label">PROCHAINS MODULES</span><ul className="admin-future">{["Création du catalogue","Événements","Modération"].map(label=><li key={label}><span>{label}</span><small>À venir</small></li>)}</ul>
 <Link className="admin-return" href="/compte"><ArrowLeft aria-hidden="true"/>Retour au jeu</Link></aside>
 <div className="admin-content"><header className="admin-page-header"><div><span className="section-kicker">ATELIER · ADMINISTRATION</span><h1>{title}</h1><p>{description}</p></div><span className="admin-access-badge"><ShieldCheck aria-hidden="true"/>{access.superAdmin?"Superadministrateur":"Équipe du jeu"}</span></header>{children}</div></main></>;
}
