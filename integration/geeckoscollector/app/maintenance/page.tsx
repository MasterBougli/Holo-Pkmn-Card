import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Wrench,Layers3,Home,ArrowRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { getGameAccess } from "@/lib/game-access";
import { PlayerChrome } from "@/components/player-ui";
import { SignOutButton } from "@/components/sign-out-button";
export default async function MaintenancePage(){
 const session=await auth.api.getSession({headers:await headers()});
 const {config,allowed}=await getGameAccess(session?.user.id);
 if(allowed)redirect(session?"/compte":"/");
 return <><PlayerChrome/><main className="shell availability-wrap"><section className="availability-card"><div className="availability-seal"><Wrench size={32} aria-hidden="true"/></div><span className="section-kicker">LA TABLE SE PRÉPARE</span><h1>La collection reprend bientôt</h1><p className="availability-message">{config.maintenanceMessage}</p><div className="availability-info"><strong>Continue à explorer les collections</strong><p>L’accueil, les actualités et les sets sont disponibles. L’équipe garde accès au jeu pour sa préparation.</p></div><div className="availability-actions"><Link className="button game-primary" href="/sets"><Layers3 size={18} aria-hidden="true"/>Découvrir les sets</Link><Link className="quiet-button" href="/"><Home size={18} aria-hidden="true"/>Accueil public</Link>{session?<SignOutButton/>:<Link className="quiet-button" href="/connexion">Connexion équipe <ArrowRight size={18} aria-hidden="true"/></Link>}</div></section></main></>;
}
