"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
type Player = { username: string; pseudo: string };

export function CollectionSearch() {
  const id = useId(), controller = useRef<AbortController | null>(null);
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [busy, setBusy] = useState(false), [searched, setSearched] = useState(false), [more, setMore] = useState(false), [error, setError] = useState("");
  useEffect(() => () => controller.current?.abort(), []);
  async function search(e: React.FormEvent) {
    e.preventDefault(); if (busy) return;
    controller.current?.abort(); const current = new AbortController(); controller.current = current;
    setBusy(true); setError(""); setPlayers([]); setSearched(false); setMore(false);
    try {
      const r = await fetch("/api/player/collections?" + new URLSearchParams({ q: query.trim() }), { cache: "no-store", signal: current.signal });
      const data = await r.json(); if (!r.ok) throw Error(data.error ?? "Recherche indisponible.");
      if (!current.signal.aborted) { setPlayers(data.players); setMore(data.more); setSearched(true); }
    } catch (e) { if (!current.signal.aborted) setError((e as Error).message); }
    finally { if (!current.signal.aborted) setBusy(false); }
  }
  return <section aria-labelledby={id + "-title"} className="collection-search">
    <h2 id={id + "-title"}>Trouver un collectionneur</h2>
    <p>Seuls les classeurs rendus visibles par leurs propriétaires apparaissent ici.</p>
    <form onSubmit={search}><div className="form-field"><label htmlFor={id}>Pseudo ou partie du pseudo</label>
      <input id={id} value={query} required minLength={2} maxLength={16} pattern="[A-Za-z0-9]{2,16}" autoComplete="off" disabled={busy} aria-describedby={id + "-help"} onChange={e => { setQuery(e.target.value); setPlayers([]); setSearched(false); setError(""); setMore(false); }} />
      <small id={id + "-help"}>2 à 16 lettres ou chiffres, sans distinction de majuscules.</small>
    </div><button className="button game-primary" type="submit" disabled={busy}>{busy ? "Recherche…" : "Rechercher"}</button></form>
    <div aria-live="polite" aria-busy={busy}>
      {searched && <p>{players.length ? players.length + " collection(s) visible(s)." : "Aucune collection visible ne correspond à cette recherche."}</p>}
      {more && <p>Il y a d’autres résultats. Précise le pseudo pour affiner la recherche.</p>}
    </div>
    {error && <p role="alert">{error}</p>}
    <ul className="collection-search-results">{players.map(player => <li key={player.username}><Link className="quiet-button" href={"/joueurs/" + encodeURIComponent(player.username) + "/collection"}>Voir le classeur de {player.pseudo}</Link></li>)}</ul>
  </section>;
}
