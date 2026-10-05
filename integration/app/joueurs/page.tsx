import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requireGameAccess } from "@/lib/game-access";
import { PlayerChrome } from "@/components/player-ui";
import { CollectionSearch } from "@/components/collection-search";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/connexion");
  if (!session.user.username) redirect("/choisir-pseudo");
  await requireGameAccess(session.user.id);
  return <><PlayerChrome active="account" variant="collection" /><main className="shell booster-room">
    <header className="booster-room-heading"><div><span className="section-kicker">LES COLLECTIONNEURS</span><h1>Les classeurs partagés</h1><p>Découvre les cartes des autres joueurs.</p></div><Link className="quiet-button" href="/collection">Mon classeur</Link></header>
    {session.user.emailVerified ? <CollectionSearch /> : <p>Vérifie ton adresse e-mail pour rechercher les collections partagées.</p>}
  </main></>;
}
