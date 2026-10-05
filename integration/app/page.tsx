import {EventFeed} from "@/components/event-feed";
import {NewsFeed} from "@/components/news-feed";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getGameAccess } from "@/lib/game-access";
import { auth } from "@/lib/auth";
import { CardViewer } from "@/components/card-viewer";
import { getCatalogueSets } from "@/lib/catalogue";
import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Gift,
  Layers3,
  Sparkles,
  Zap,
} from "lucide-react";
import { PlayerChrome } from "@/components/player-ui";

const featuredCards = [
  {
    code: "AOR · 097/098",
    name: "Primo-Groudon EX",
    set: "Origines Antiques",
    image: "/media/Cards/AOR/AOR-097.png",
    className: "set-aor",
  },
  {
    code: "EVS · 218/203",
    name: "Rayquaza VMAX",
    set: "Évolution Céleste",
    image: "/media/Cards/EVS/EVS-218.png",
    className: "set-evs",
  },
  {
    code: "CRZ · 160/159",
    name: "Pikachu",
    set: "Zénith Suprême",
    image: "/media/Cards/CRZ/CRZ-160.png",
    className: "set-crz",
  },
  {
    code: "BRS · 186/172",
    name: "Hyper Ball",
    set: "Stars Étincelantes",
    image: "/media/Cards/BRS/BRS-186.png",
    className: "set-brs",
  },
];

export default async function HomePage() {
 const catalogueSetData=await getCatalogueSets();
  const session = await auth.api.getSession({ headers: await headers() });
  if (session && (await getGameAccess(session.user.id)).allowed) redirect(session.user.username ? "/compte" : "/choisir-pseudo");
  return (
    <div className="collection-page">
      <PlayerChrome variant="collection" />
      <main className="shell collection-main">
        <div className="collection-lobby"><span><Layers3 size={16} aria-hidden="true"/> Le salon des collectionneurs</span><span className="lobby-status">Catalogue ouvert · Jeu en préparation</span></div>
        <section className="game-hero" aria-labelledby="hero-title">
          <div className="game-hero-copy">
            <div className="game-kicker">
              <Sparkles size={16} aria-hidden="true" />
              <span>Le terrain de jeu des collectionneurs</span>
            </div>
            <h1 id="hero-title">Une carte.<br/>Un frisson.<br/><em>Ta collection.</em></h1>
            <p>
              Chaque booster cache une nouvelle histoire. Découvre les séries et les
              cartes qui te ressemblent. Ton futur classeur commence ici.
            </p>
            <div className="game-hero-actions">
              <Link className="button game-primary" href="/inscription">
                Commencer ma collection <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link className="button game-secondary" href="/connexion">
                J’ai déjà un compte
              </Link>
            </div>
            <div className="hero-features" aria-label="Fonctionnalités du jeu">
              <span><Layers3 size={16} aria-hidden="true" /> Des séries à explorer</span>
              <span><Sparkles size={16} aria-hidden="true" /> Des cartes à découvrir</span>
            </div>
          </div>

          <div className="game-hero-art"><div className="desk-mat" aria-hidden="true"/><span className="desk-label" aria-hidden="true">LA TABLE DE COLLECTION</span>
            <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
            <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
            <div className="hero-art-stamp" aria-hidden="true">
              <span>À TOI DE</span><strong>JOUER</strong>
            </div>
            <Image
              className="hero-booster"
              src="/media/Boosters/AOR/AOR-2.png"
              width={220}
              height={310}
              alt="Booster Pokémon Origines Antiques"
              priority
            />
            <div className="hero-card-fan" aria-hidden="true">
              <div className="hero-card hero-card-back">
                <Image src="/media/Cards/AOR/AOR-097.png" width={600} height={825} alt="" />
              </div>
              <div className="hero-card hero-card-side">
                <Image src="/media/Cards/CRZ/CRZ-160.png" width={600} height={825} alt="" />
              </div>
              <div className="hero-card hero-card-front">
                <Image src="/media/Cards/EVS/EVS-218.png" width={600} height={825} alt="" />
              </div>
            </div>
            <div className="hero-art-caption" aria-hidden="true">
              <span className="caption-pip" /> Une carte t’attend
            </div>
          </div>
        </section>

        <div className="catalogue-hud" aria-label="Le catalogue"><div><Layers3 aria-hidden="true"/><span><strong>{catalogueSetData.length}</strong> sets à explorer</span></div><div><Sparkles aria-hidden="true"/><span><strong>{catalogueSetData.reduce((total,set)=>total+set.cards.length,0).toLocaleString("fr-FR")}</strong> cartes au catalogue</span></div><Link href="/sets">Ouvrir le catalogue <ArrowRight size={17} aria-hidden="true"/></Link></div>
        <section className="collection-intro" aria-label="L’expérience GeeckosCollector">
          <div className="intro-mark"><Layers3 size={22} aria-hidden="true" /></div>
          <p><strong>Plus qu’un classeur.</strong> Une aventure qui grandit à chaque découverte.</p>
          <span className="intro-note"><Sparkles size={15} aria-hidden="true" /> À toi de jouer</span>
        </section>

        <section className="collection-section" id="actualites" aria-labelledby="news-title">
          <div className="collection-section-heading">
            <div>
              <span className="section-kicker"><span>01</span> LE JOURNAL DU JEU</span>
              <h2 id="news-title">Le monde bouge aussi.</h2>
              <p>Les nouvelles et les rendez-vous de ta communauté de collectionneurs.</p>
            </div>
            <Link className="section-arrow-link" href="/actualites" aria-label="Voir toutes les actualités">
              <ChevronRight size={21} aria-hidden="true" />
            </Link>
          </div>

          <div className="quest-board">
            <div><NewsFeed limit={3}/><Link className="quiet-button" href="/actualites">Toutes les actualités</Link></div>

            <div id="evenements"><EventFeed limit={3} heading={3}/><Link className="quiet-button" href="/evenements">Tous les événements</Link></div>
          </div>
        </section>

        <section className="collection-section card-vault binder-section" aria-labelledby="cards-title">
          <div className="collection-section-heading">
            <div>
              <span className="section-kicker"><span>02</span> LA VITRINE DES SÉRIES</span>
              <h2 id="cards-title">Quatre séries. Quatre pépites.</h2>
              <p>Un aperçu de cartes remarquables venues de collections différentes.</p>
            </div>
            <span className="set-count"><Layers3 size={15} aria-hidden="true" /> 4 SÉRIES</span>
          </div>

          <div className="binder-rings" aria-hidden="true"><i/><i/><i/></div><div className="showcase-grid">
            {featuredCards.map((card, index) => (
              <article className={`showcase-card ${card.className}`} key={card.code}>
                <div className="showcase-card-top">
                  <span className="showcase-index">0{index + 1}</span>
                  <span className="showcase-rarity"><Sparkles size={12} aria-hidden="true" /> À découvrir</span>
                </div>
                <CardViewer card={catalogueSetData.find(set=>set.code===card.code.split(" · ")[0])!.cards.find(item=>item.id===card.image.split("/").pop()!.replace(".png","")) ?? {id:card.image.split("/").pop()!.replace(".png",""),name:card.name,localId:card.code.split(" · ")[1].split("/")[0],rarity:""}} setCode={card.code.split(" · ")[0]} setName={card.set}><figure className="showcase-art">
                  <span className="card-halo" aria-hidden="true" />
                  <Image
                    src={card.image}
                    width={600}
                    height={825}
                    sizes="(max-width: 600px) 44vw, (max-width: 980px) 30vw, 230px"
                    alt={`${card.name}, carte de la série ${card.set}`}
                  />
                </figure></CardViewer>
                <div className="showcase-meta">
                  <span className="showcase-set">{card.set}</span>
                  <h3>{card.name}</h3>
                  <span className="showcase-code">{card.code}</span>
                </div>
              </article>
            ))}
          </div>
          <p className="vault-footnote"><Sparkles className="vault-spark" size={15} aria-hidden="true" /> Chaque carte raconte une série différente.</p>
        </section>

        <section className="community-callout" aria-labelledby="community-title">
          <div className="callout-icon"><Gift size={24} aria-hidden="true" /></div>
          <div className="callout-copy">
            <span className="section-kicker"><span>03</span> TA PROCHAINE DÉCOUVERTE</span>
            <h2 id="community-title">Ton classeur n’attend que toi.</h2>
            <p>Crée ton compte et explore les séries pendant que les premières ouvertures se préparent.</p>
          </div>
          <Link className="button game-primary" href="/inscription">
            Rejoindre l’aventure <Zap size={17} aria-hidden="true" />
          </Link>
        </section>
        <div className="collection-footer-note">GEECKOSCOLLECTOR <span>·</span> COLLECTIONNE À TON RYTHME</div>
      </main>
    </div>
  );
}
