import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { requireGameAccess } from "@/lib/game-access";
import { PlayerChrome } from "@/components/player-ui";
import { PlayerCollection } from "@/components/player-collection";

export default async function Page({ params }: { params: Promise<{ pseudo: string }> }) {
  const { pseudo } = await params;
  if (!/^[A-Za-z0-9]{4,16}$/.test(pseudo)) notFound();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/connexion");
  if (!session.user.username) redirect("/choisir-pseudo");
  await requireGameAccess(session.user.id);
  return <><PlayerChrome active="account" variant="collection" /><main className="shell booster-room">
    <header className="booster-room-heading"><div><span className="section-kicker">CLASSEUR PARTAGÉ</span><h1>Collection de {pseudo}</h1><p>Les exemplaires partagés par ce collectionneur.</p></div><Link className="quiet-button" href="/collection">Mon classeur</Link><Link className="quiet-button" href="/joueurs">Les collectionneurs</Link></header>
    {session.user.emailVerified ? <PlayerCollection key={pseudo} pseudo={pseudo} /> : <p>Vérifie ton adresse e-mail pour consulter les collections partagées.</p>}
  </main></>;
}
