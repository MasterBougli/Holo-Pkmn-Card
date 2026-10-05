"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { CatalogueCard } from "@/lib/catalogue";
import { CardViewer } from "./card-viewer";
type Result = { set: { code: string; name: string }; cards: CatalogueCard[]; total: number; page: number; catalogueMissing: number };
function MissingCardImage({ code, card }: { code: string; card: CatalogueCard }) {
  const [failed, setFailed] = useState(false);
  return <div className="missing-card-image">{failed ? <span>Illustration indisponible</span> : <img src={"/media/Cards/" + encodeURIComponent(code) + "/" + encodeURIComponent(card.id) + ".png"} alt={card.name + " — carte non possédée"} loading="lazy" onError={() => setFailed(true)} />}</div>;
}
export function CollectionMissing({ code, pseudo, revision, onClose }: { code: string; pseudo?: string; revision: number; onClose: () => void }) {
  const id = useId(), [page, setPage] = useState(0), [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(true), [error, setError] = useState(""), [retry, setRetry] = useState(0);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    title.current?.focus();
    return () => { if (trigger?.isConnected) trigger.focus(); };
  }, [code, pseudo]);
  useEffect(() => {
    const c = new AbortController(); setBusy(true); setError(""); setResult(null);
    const query = new URLSearchParams({ setCode: code, page: String(page) });
    const endpoint = pseudo ? "/api/player/collections/" + encodeURIComponent(pseudo) + "/missing" : "/api/player/collection/missing";
    fetch(endpoint + "?" + query, { cache: "no-store", signal: c.signal })
      .then(async r => { const d = await r.json(); if (!r.ok) throw Error(d.error || "Lecture impossible."); return d as Result; })
      .then(d => { if (!c.signal.aborted) { setResult(d); if (d.page !== page) setPage(d.page); } })
      .catch(e => { if (!c.signal.aborted) setError(e.message); })
      .finally(() => { if (!c.signal.aborted) setBusy(false); });
    return () => c.abort();
  }, [code, pseudo, page, revision, retry]);
  return <section className="collection-missing-panel" aria-labelledby={id}>
    <header><h2 id={id} ref={title} tabIndex={-1}>Cartes manquantes · {result?.set.name ?? code}</h2><button type="button" className="quiet-button" onClick={onClose}>Fermer les cartes manquantes</button></header>
    <p>Images grisées : cartes actuellement absentes de cette collection. Cette liste est indépendante des filtres du classeur.</p>
    {busy && <p role="status">Recherche des cartes manquantes…</p>}
    {error && <><p role="alert">{error}</p><button type="button" className="quiet-button" onClick={() => setRetry(v => v + 1)}>Réessayer</button></>}
    {!busy && !error && result && <>
      <p role="status">{result.total} carte(s) connue(s) du catalogue à obtenir.</p>
      {result.catalogueMissing > 0 && <p>Le catalogue doit encore être complété pour {result.catalogueMissing} carte(s) supplémentaire(s) : leurs images et informations ne sont pas disponibles ici.</p>}
      {result.total === 0 && <p>{result.catalogueMissing > 0 ? "Toutes les cartes actuellement renseignées sont possédées." : "Toutes les cartes de ce set sont possédées."}</p>}
      <div className="owned-card-grid">{result.cards.map(card => <article className="owned-card-pocket missing-card-pocket" key={card.id}>
        <CardViewer card={card} setCode={result.set.code} setName={result.set.name}><MissingCardImage code={result.set.code} card={card} /></CardViewer>
        <h3>{card.name || "Nom à renseigner"}</h3><p>n°{card.localId || "—"} · {card.rarity || "Rareté à renseigner"}</p><span className="owned-finish">Non possédée</span>
      </article>)}</div>
      {result.total > 24 && <nav className="booster-pagination" aria-label="Pages des cartes manquantes"><button type="button" className="quiet-button" disabled={page === 0} onClick={() => setPage(v => v - 1)}>Précédente</button><span>Page {page + 1} / {Math.ceil(result.total / 24)}</span><button type="button" className="quiet-button" disabled={(page + 1) * 24 >= result.total} onClick={() => setPage(v => v + 1)}>Suivante</button></nav>}
    </>}
  </section>;
}
