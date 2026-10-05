import type { Metadata } from "next";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { ArrowRight, Layers3, Search, Sparkles } from "lucide-react";
import { PlayerChrome } from "@/components/player-ui";
import { db } from "@/lib/db";
import { gameSets } from "@/lib/catalogue-schema";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Sets et cartes | GeeckosCollector",
  description: "Explore les sets Pokémon du catalogue et consulte leurs cartes et leur statut.",
};

type SearchParams = Promise<{ q?: string; status?: string }>;

export default async function SetsPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = "", status = "all" } = await searchParams;
  const allSets = await db.select().from(gameSets).orderBy(desc(gameSets.releaseDate), gameSets.name);
  const query = q.trim().toLocaleLowerCase("fr");
  const sets = allSets.filter((set) => {
    const matchesQuery = !query || `${set.name} ${set.seriesName} ${set.code}`.toLocaleLowerCase("fr").includes(query);
    const matchesStatus = status === "active" ? set.active : status === "inactive" ? !set.active : true;
    return matchesQuery && matchesStatus;
  });
  const activeCount = allSets.filter((set) => set.active).length;

  return <div className="collection-page">
    <PlayerChrome active="sets" variant="collection" />
    <main className="collection-main catalogue-main">
      <section className="catalogue-hero" aria-labelledby="catalogue-title">
        <div className="catalogue-hero-copy">
          <span className="section-kicker"><Layers3 size={15} aria-hidden="true" /> LE CATALOGUE DU JEU</span>
          <h1 id="catalogue-title">Les sets et leurs cartes</h1>
          <p>Parcours les séries disponibles dans GeeckosCollector, découvre leur statut et ouvre chaque set pour consulter ses cartes.</p>
        </div>
        <div className="catalogue-total" aria-label={`${allSets.length} sets, ${activeCount} actifs`}>
          <Sparkles size={19} aria-hidden="true" />
          <strong>{allSets.length}</strong><span>sets référencés</span>
          <small>{activeCount} actif{activeCount === 1 ? "" : "s"}</small>
        </div>
      </section>

      <section className="catalogue-browser" aria-label="Liste des sets">
        <div className="catalogue-browser-head">
          <div><span className="section-kicker">À TOI D’EXPLORER</span><h2>Les séries</h2></div>
          <span className="catalogue-result-count">{sets.length} résultat{sets.length === 1 ? "" : "s"}</span>
        </div>
        <form className="catalogue-filters" action="/sets" method="get">
          <label className="catalogue-search"><Search size={18} aria-hidden="true" /><span className="sr-only">Rechercher un set</span><input type="search" name="q" placeholder="Nom, série ou code…" defaultValue={q} /></label>
          <label className="catalogue-status-filter"><span className="sr-only">Filtrer par statut</span><select name="status" defaultValue={status}><option value="all">Tous les statuts</option><option value="active">Actifs</option><option value="inactive">Inactifs</option></select></label>
          <button className="button catalogue-search-button" type="submit">Rechercher</button>
        </form>

        {sets.length ? <div className="catalogue-set-grid">
          {sets.map((set) => <Link href={`/sets/${encodeURIComponent(set.code)}`} className="catalogue-set-card" key={set.code}>
            <div className="catalogue-set-top"><span className="catalogue-set-code">{set.code}</span><span className={`catalogue-status ${set.active ? "is-active" : "is-inactive"}`}><i aria-hidden="true" />{set.active ? "Actif" : "Inactif"}</span></div>
            <div className="catalogue-set-art" aria-hidden="true"><div className="catalogue-set-orbit" /><Layers3 size={38} strokeWidth={1.4} /></div>
            <div className="catalogue-set-info"><span className="catalogue-set-series">{set.seriesName || "Série Pokémon"}</span><h3>{set.name}</h3><p>{set.totalCardCount} cartes <span aria-hidden="true">·</span> {set.releaseDate ? new Date(`${set.releaseDate}T00:00:00`).getFullYear() : "Date inconnue"}</p></div>
            <span className="catalogue-set-link">Voir les cartes <ArrowRight size={16} aria-hidden="true" /></span>
          </Link>)}
        </div> : <div className="catalogue-empty"><Layers3 size={25} aria-hidden="true" /><h3>Aucun set trouvé</h3><p>Modifie la recherche ou choisis un autre statut.</p><Link href="/sets" className="text-link">Effacer les filtres</Link></div>}
      </section>
    </main>
  </div>;
}
