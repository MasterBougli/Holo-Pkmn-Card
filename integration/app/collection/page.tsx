import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { requireGameAccess } from "@/lib/game-access";
import { PlayerChrome } from "@/components/player-ui";
import { PlayerCollection } from "@/components/player-collection";
import { CollectionPrivacy } from "@/components/collection-privacy";
export default async function Page(){
 const s=await auth.api.getSession({headers:await headers()});if(!s)redirect("/connexion");if(!s.user.username)redirect("/choisir-pseudo");await requireGameAccess(s.user.id);
 return <><PlayerChrome active="account" variant="collection"/><main className="shell booster-room"><header className="booster-room-heading"><div><span className="section-kicker">LE CLASSEUR</span><h1>Ma collection</h1><p>Chaque exemplaire garde son identité et ses éventuels défauts.</p></div><Link className="quiet-button" href="/boosters">Mes boosters</Link><Link className="quiet-button" href="/compte">Accueil</Link><Link className="quiet-button" href="/joueurs">Les collectionneurs</Link></header><CollectionPrivacy pseudo={s.user.displayUsername??s.user.username}/><PlayerCollection/></main></>;
}
