import {playerWallet} from "@/lib/player-wallet";
import {EventFeed} from "@/components/event-feed";
import {NewsFeed} from "@/components/news-feed";
import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CalendarDays,Gift,Sparkles,Layers3,ArrowRight,Shield,Star,BookOpen } from "lucide-react";
import { PlayerChrome } from "@/components/player-ui";
import { SignOutButton } from "@/components/sign-out-button";
import { auth } from "@/lib/auth";
import { requireGameAccess } from "@/lib/game-access";
import { playerInventory } from "@/lib/booster-management";
import { isAdminUser } from "@/lib/admin-access";

export default async function PlayerHomePage(){
 const session=await auth.api.getSession({headers:await headers()});
 if(!session)redirect("/connexion");if(!session.user.username)redirect("/choisir-pseudo");
 await requireGameAccess(session.user.id);
 const adminAccess=await isAdminUser(session.user.id);
 const inventory=session.user.emailVerified?await playerInventory(session.user.id):null;
 const wallet=session.user.emailVerified?await playerWallet(session.user.id):null;
 const playerName=session.user.displayUsername??session.user.username;
 return <div className="collection-page player-collection-page"><PlayerChrome active="account" variant="collection"/>
 <main className="shell collection-main">
  <header className="player-command"><div className="player-avatar" aria-hidden="true">{playerName.slice(0,1)}</div><div><span className="section-kicker">Carnet de collectionneur</span><h1>À toi de jouer, {playerName}.</h1><p>Ta place est prête à la table de collection.</p></div><div className="player-account-actions">{adminAccess&&<Link className="quiet-button" href="/admin"><Shield size={16} aria-hidden="true"/> Administration</Link>}<SignOutButton/></div></header>
  
  <section className="collection-section" id="actualites" aria-labelledby="player-news-title">
   <div className="collection-section-heading"><div><span className="section-kicker"><span>01</span> LE JOURNAL DU JEU</span><h2 id="player-news-title">Actualités et événements</h2></div><span className="binder-tab">Carnet de bord</span></div>
   <div className="quest-board"><div><NewsFeed limit={3}/><Link className="quiet-button" href="/actualites">Toutes les actualités</Link></div><div id="evenements"><EventFeed limit={3} heading={3}/><Link className="quiet-button" href="/evenements">Tous les événements</Link></div></div>
  </section>
  <section className="collection-section" aria-labelledby="player-progress-title">
   <div className="collection-section-heading"><div><span className="section-kicker"><span>02</span> TON ÉQUIPEMENT</span><h2 id="player-progress-title">Progression et boosters</h2></div><Layers3 aria-hidden="true"/></div>
   {wallet&&<div className="player-wallet" role="group" aria-label="Mon portefeuille"><span>Pièces <strong>{BigInt(wallet.coins).toLocaleString("fr-FR")}</strong></span><span>Gemmes <strong>{BigInt(wallet.gems).toLocaleString("fr-FR")}</strong></span></div>}
   <div className="player-equipment"><article className="collector-pass"><div className="pass-seal"><Star size={30} aria-hidden="true"/></div><span className="quest-label">PASSEPORT DE COLLECTIONNEUR</span><h3>{playerName}</h3><dl><div><dt>Progression</dt><dd>À venir</dd></div><div><dt>Récompenses</dt><dd>À venir</dd></div></dl><p>Ton niveau et tes récompenses apparaîtront à l’ouverture du jeu.</p><Link className="button game-secondary" href="/sets">Explorer les sets <ArrowRight size={17} aria-hidden="true"/></Link></article>
    <article className="booster-station"><div className="booster-station-copy"><span className="quest-label">RÉSERVE DE BOOSTERS</span><h3>La prochaine surprise attend.</h3><p>{inventory?.unopened??0} booster(s) dans ta réserve.</p><Link className="button game-primary" href="/boosters"><Gift size={16} aria-hidden="true"/>Mes boosters</Link><Link className="quiet-button" href="/collection">Mon classeur</Link></div><Image src="/media/Boosters/AOR/AOR-2.png" width={180} height={255} unoptimized alt="Illustration d’un booster Origines Antiques"/></article>
   </div>
  </section>
  <section className="collection-section binder-section" aria-labelledby="player-drops-title">
   <div className="collection-section-heading"><div><span className="section-kicker"><span>03</span> LES TROUVAILLES</span><h2 id="player-drops-title">Dernières cartes découvertes</h2><p>Les découvertes partagées par les joueurs apparaîtront ici.</p></div><span className="binder-tab"><BookOpen size={16} aria-hidden="true"/> Le classeur</span></div>
   <div className="empty-binder" aria-label="Aucune découverte partagée pour le moment"><div className="binder-rings" aria-hidden="true"><i/><i/><i/></div><div className="binder-empty-pockets" aria-hidden="true">{[1,2,3,4,5,6].map(number=><div className="empty-pocket" key={number}><Layers3 size={27}/><span>0{number}</span></div>)}</div><p className="binder-empty-caption">Un classeur plein d’histoires à écrire.</p></div>
  </section>
 </main></div>;
}
