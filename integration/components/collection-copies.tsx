"use client";
import { useEffect, useId, useState } from "react";
import type { OwnedCard } from "@/lib/booster-types";
import type { CollectionCopy, CollectionGroupContext } from "@/lib/collection-copy-types";

export function CollectionCopies({ group, selectedId, onSelect }: { group: CollectionGroupContext; selectedId: string; onSelect: (card: OwnedCard) => void }) {
  const id = useId();
  const [copies, setCopies] = useState<CollectionCopy[]>([]), [page, setPage] = useState(0), [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(""); setCopies([]); setTotal(0);
    const query = new URLSearchParams({ ...group.filters, anchorId: group.anchorId, page: String(page) });
    const path = group.pseudo ? "/api/player/collections/" + encodeURIComponent(group.pseudo) + "/copies" : "/api/player/collection/copies";
    fetch(path + "?" + query, { cache: "no-store", signal: controller.signal })
      .then(async r => { const data = await r.json(); if (!r.ok) throw Error(data.error ?? "Exemplaires indisponibles."); return data; })
      .then(data => { if (!controller.signal.aborted) { setCopies(data.copies); setTotal(data.total); if (page > 0 && page * 6 >= data.total) setPage(Math.max(0, Math.ceil(data.total / 6) - 1)); } })
      .catch(e => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [group.anchorId, group.pseudo, group.filters, page, retry]);
  function date(value: string) { const d = new Date(value); return Number.isNaN(d.getTime()) ? "Date non renseignée" : d.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" }); }
  return <section className="collection-copies" aria-labelledby={id} aria-busy={loading}>
    <h3 id={id}>Choisir un exemplaire</h3><p>Chaque exemplaire conserve son identité. La sélection ne modifie pas ta collection.</p>
    <p className="collection-selected-copy" role="status">Exemplaire sélectionné : <span>{selectedId}</span></p>
    {loading && <p role="status">Chargement des exemplaires…</p>}
    {error && <><p role="alert">{error}</p><button className="quiet-button" type="button" onClick={() => setRetry(n => n + 1)}>Réessayer</button></>}
    {!loading && !error && !total && <p>Aucun exemplaire de ce groupe ne correspond aux filtres actuels.</p>}
    <ul className="collection-copy-list">{copies.map((copy, i) => <li key={copy.card.id}><button className="collection-copy-choice" type="button" aria-pressed={selectedId === copy.card.id} onClick={() => onSelect(copy.card)}>
      <strong>Exemplaire {page * 6 + i + 1}</strong><span>{copy.card.id}</span><small>Créé le {date(copy.createdAt)}</small>
    </button></li>)}</ul>
    {total > 6 && <nav className="booster-pagination" aria-label="Pages des exemplaires"><button className="quiet-button" type="button" disabled={!page || loading} onClick={() => setPage(n => n - 1)}>Précédente</button><span>Page {page + 1} / {Math.ceil(total / 6)}</span><button className="quiet-button" type="button" disabled={loading || (page + 1) * 6 >= total} onClick={() => setPage(n => n + 1)}>Suivante</button></nav>}
  </section>;
}
