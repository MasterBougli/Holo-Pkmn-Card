"use client";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
type Visibility = "public" | "private" | "";

export function CollectionPrivacy({ pseudo }: { pseudo: string }) {
  const id = useId();
  const [value, setValue] = useState<Visibility>("");
  const [saved, setSaved] = useState<Visibility>("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [manualLink, setManualLink] = useState("");
  async function copyLink() {
    const link = new URL("/joueurs/" + encodeURIComponent(pseudo) + "/collection", window.location.origin).href;
    setMessage("");
    try { await navigator.clipboard.writeText(link); setManualLink(""); setMessage("Lien du classeur copié."); }
    catch { setManualLink(link); setMessage("Sélectionne le lien ci-dessous pour le copier."); }
  }
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/player/collection/privacy", { cache: "no-store", signal: controller.signal })
      .then(async r => { const data = await r.json(); if (!r.ok) throw Error(data.error ?? "Réglage indisponible."); return data; })
      .then(data => { if (!controller.signal.aborted) { const next = data.visibility === "public" || data.visibility === "private" ? data.visibility : ""; setValue(next); setSaved(next); } })
      .catch(e => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!value || busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const r = await fetch("/api/player/collection/privacy", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visibility: value }) });
      const data = await r.json(); if (!r.ok) throw Error(data.error ?? "Enregistrement impossible.");
      setSaved(value); setMessage("Visibilité enregistrée dans ton compte.");
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <section className="collection-privacy" aria-labelledby={id + "-title"} aria-busy={loading || busy}>
    <h2 id={id + "-title"}>Visibilité de mon classeur</h2>
    <p>Une collection visible pourra être consultée par les autres joueurs. Tes informations de compte restent personnelles.</p>
    {loading ? <p role="status">Chargement du réglage…</p> : <form onSubmit={save}>
      <fieldset disabled={busy}><legend>Qui pourra voir mes cartes ?</legend>
        <label><input type="radio" name={id} value="public" required checked={value === "public"} onChange={() => { setValue("public"); setMessage(""); }} /> Visible par les joueurs</label>
        <label><input type="radio" name={id} value="private" checked={value === "private"} onChange={() => { setValue("private"); setMessage(""); }} /> Privée</label>
      </fieldset>
      <button className="quiet-button" type="submit" disabled={busy || !value || value === saved}>{busy ? "Enregistrement…" : "Enregistrer la visibilité"}</button>
    </form>}
    {!loading && saved === "public" && <div className="collection-share-actions"><Link className="quiet-button" href={"/joueurs/" + encodeURIComponent(pseudo) + "/collection"}>Voir mon classeur partagé</Link><button className="quiet-button" type="button" onClick={copyLink} disabled={busy}>Copier le lien</button>{manualLink && <label className="collection-share-link" htmlFor={id + "-link"}>Lien à partager<input id={id + "-link"} value={manualLink} readOnly onFocus={e => e.currentTarget.select()} /></label>}</div>}
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
  </section>;
}
