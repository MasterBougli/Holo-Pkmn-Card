import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { requireGameAccess } from "@/lib/game-access";
import { PlayerChrome } from "@/components/player-ui";
import { getBoosterRevealSettings } from "@/lib/booster-reveal-management";
import { BoosterRoom } from "@/components/booster-room";
export default async function Page(){
 const s=await auth.api.getSession({headers:await headers()});if(!s)redirect("/connexion");if(!s.user.username)redirect("/choisir-pseudo");
 await requireGameAccess(s.user.id);
 return <><PlayerChrome active="account" variant="collection"/><main className="shell booster-room"><header className="booster-room-heading"><div><span className="section-kicker">LA TABLE DES SURPRISES</span><h1>Tes boosters</h1><p>Un paquet, une nouvelle histoire à collectionner.</p></div><Link className="quiet-button" href="/collection">Mon classeur</Link><Link className="quiet-button" href="/compte">Retour à l’accueil</Link></header>{s.user.emailVerified?<BoosterRoom revealStyles={(await getBoosterRevealSettings()).styles}/>:<p>Vérifie ton adresse e-mail avant d’ouvrir un booster.</p>}</main></>;
}
