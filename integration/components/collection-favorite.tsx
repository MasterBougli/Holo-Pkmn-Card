"use client";
import { useEffect, useRef, useState } from "react";
export function CollectionFavorite({ id, onChange }: { id: string; onChange: () => void }) {
  const [favorite, setFavorite] = useState<boolean | null>(null), [busy, setBusy] = useState(true), [error, setError] = useState(""), [retry, setRetry] = useState(0);
  const saving = useRef(false), controller = useRef<AbortController | null>(null);
  useEffect(() => {
    const c = new AbortController(); controller.current = c; saving.current = false;
    setFavorite(null); setBusy(true); setError("");
    fetch("/api/player/collection/favorite?id=" + encodeURIComponent(id), { cache: "no-store", signal: c.signal })
      .then(async r => { const d = await r.json(); if (!r.ok || typeof d.favorite !== "boolean") throw Error(d.error || "Favori indisponible."); return d.favorite as boolean; })
      .then(v => { if (!c.signal.aborted) setFavorite(v); })
      .catch(e => { if (!c.signal.aborted) setError(e.message); })
      .finally(() => { if (!c.signal.aborted) setBusy(false); });
    return () => c.abort();
  }, [id, retry]);
  async function save() {
    const c = controller.current;
    if (!c || c.signal.aborted || favorite === null || saving.current) return;
    saving.current = true; setBusy(true); setError("");
    try {
      const r = await fetch("/api/player/collection/favorite", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, favorite: !favorite }) });
      const d = await r.json(); if (!r.ok || typeof d.favorite !== "boolean") throw Error(d.error || "Enregistrement impossible.");
      // Refresh the collection after closing its dialog, even if the selected copy changed.
      onChange(); if (!c.signal.aborted) setFavorite(d.favorite);
    } catch (e) { if (!c.signal.aborted) setError(e instanceof Error ? e.message : "Enregistrement impossible."); }
    finally { if (!c.signal.aborted) { saving.current = false; setBusy(false); } }
  }
  return <section className="collection-favorite" aria-label="Favori de cet exemplaire">
    <button type="button" className="quiet-button" disabled={busy || favorite === null} aria-pressed={favorite === true} onClick={save}>{busy ? "Chargement…" : favorite ? "★ Retirer des favoris" : "☆ Ajouter aux favoris"}</button>
    <p role="status">{!busy && favorite !== null ? favorite ? "Cet exemplaire est dans tes favoris." : "Cet exemplaire n’est pas dans tes favoris." : ""}</p>
    {error && <><p role="alert">{error}</p><button type="button" className="quiet-button" disabled={busy} onClick={() => setRetry(v => v + 1)}>Réessayer</button></>}
  </section>;
}
