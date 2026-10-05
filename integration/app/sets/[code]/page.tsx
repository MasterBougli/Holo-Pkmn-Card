import type { Metadata } from "next";
import Image from "next/image";
import { CardViewer } from "@/components/card-viewer";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { notFound } from "next/navigation";
import { PlayerChrome } from "@/components/player-ui";
import { db } from "@/lib/db";
import { gameSets } from "@/lib/catalogue-schema";
import { getCatalogueSetData } from "@/lib/catalogue";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cartes du set | GeeckosCollector" };

type PageProps = { params: Promise<{ code: string }>; searchParams: Promise<{ q?: string; page?: string }> };
const perPage = 60;

export default async function SetCardsPage({ params, searchParams }: PageProps) {
  const [{ code }, { q = "", page: pageValue = "1" }] = await Promise.all([params, searchParams]);
  const data = await getCatalogueSetData(code);
  if (!data) notFound();
  const [set] = await db.select().from(gameSets).where(eq(gameSets.code, data.code)).limit(1);
  if (!set) notFound();

  const query = q.trim().toLocaleLowerCase("fr");
  const filteredCards = data.cards.filter((card) => !query || `${card.name} ${card.id} ${card.rarity} ${card.localId}`.toLocaleLowerCase("fr").includes(query));
  const pageCount = Math.max(1, Math.ceil(filteredCards.length / perPage));
  const page = Math.min(pageCount, Math.max(1, Number.parseInt(pageValue, 10) || 1));
  const cards = filteredCards.slice((page - 1) * perPage, page * perPage);
  const base = `/sets/${encodeURIComponent(data.code)}`;

  return <div className="collection-page">
    <PlayerChrome active="sets" variant="collection" />
    <main className="collection-main catalogue-main">
      <Link href="/sets" className="catalogue-back"><ArrowLeft size={17} aria-hidden="true" /> Retour aux sets</Link>
      <section className="set-detail-hero" aria-labelledby="set-title">
        <div className="set-detail-art" aria-hidden="true"><div className="catalogue-set-orbit" /><span>{data.code}</span></div>
        <div className="set-detail-copy">
          <div className="catalogue-set-top"><span className="catalogue-set-code">{data.code}</span><span className={`catalogue-status ${set.active ? "is-active" : "is-inactive"}`}><i aria-hidden="true" />{set.active ? "Actif" : "Inactif"}</span></div>
          <span className="catalogue-set-series">{data.series || "Série Pokémon"}</span>
          <h1 id="set-title">{data.name}</h1>
          <p>{data.cards.length} cartes au catalogue{data.releaseDate ? ` · sortie le ${new Date(`${data.releaseDate}T00:00:00`).toLocaleDateString("fr-FR")}` : ""}</p>
        </div>
      </section>

      <section className="set-card-browser" aria-labelledby="set-card-title">
        <div className="catalogue-browser-head"><div><span className="section-kicker">COLLECTION DE CARTES</span><h2 id="set-card-title">Les cartes du set</h2></div><span className="catalogue-result-count">{filteredCards.length} résultat{filteredCards.length === 1 ? "" : "s"}</span></div>
        <form className="catalogue-filters set-card-search" action={base} method="get">
          <label className="catalogue-search"><Search size={18} aria-hidden="true" /><span className="sr-only">Rechercher une carte</span><input type="search" name="q" placeholder="Nom, numéro ou rareté…" defaultValue={q} /></label>
          <button className="button catalogue-search-button" type="submit">Rechercher</button>
        </form>
        {cards.length ? <div className="catalogue-card-grid">
          {cards.map((card) => <article className="catalogue-card" key={card.id}>
            <CardViewer card={card} setCode={data.code} setName={data.name}><div className="catalogue-card-art"><Image src={`/media/Cards/${data.code}/${card.id}.png`} alt={`${card.name}, carte du set ${data.name}`} width={180} height={252} unoptimized /></div></CardViewer>
            <div className="catalogue-card-info"><span className="catalogue-card-number">{card.id}</span><h3>{card.name}</h3><span className="catalogue-card-rarity">{card.rarity || "Rareté non renseignée"}</span></div>
          </article>)}
        </div> : <div className="catalogue-empty"><h3>Aucune carte trouvée</h3><p>Essaie un autre nom, numéro ou niveau de rareté.</p><Link href={base} className="text-link">Effacer la recherche</Link></div>}
        {pageCount > 1 && <nav className="catalogue-pagination" aria-label="Pages des cartes">
          <span>Page {page} sur {pageCount}</span>
          <div>{page > 1 && <Link href={`${base}?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page - 1) })}`} aria-label="Page précédente"><ArrowLeft size={17} aria-hidden="true" /> Précédente</Link>}{page < pageCount && <Link href={`${base}?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page + 1) })}`} aria-label="Page suivante">Suivante <ArrowRight size={17} aria-hidden="true" /></Link>}</div>
        </nav>}
      </section>
    </main>
  </div>;
}
