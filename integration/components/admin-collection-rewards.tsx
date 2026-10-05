"use client";
import { useEffect, useState } from "react";
import type { EventReward } from "@/lib/event-types";
import { validEventRewards } from "@/lib/event-types";
import type { CollectionRewardConfig, RewardSetReference } from "@/lib/collection-reward-types";
async function api(url: string, options?: RequestInit) {
  const r = await fetch(url, { cache: "no-store", ...options }), d = await r.json();
  if (!r.ok) throw Error(d.error ?? "Opération impossible."); return d;
}
function RewardCardSelect({ code, value, onChange }: { code: string; value: string; onChange: (id: string) => void }) {
  const [cards, setCards] = useState<{ id: string; name: string; localId: string }[]>([]), [loading, setLoading] = useState(false), [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const c = new AbortController(); setCards([]); setError(""); setLoading(!!code);
    if (code) api("/api/admin/collection-rewards?cards=" + encodeURIComponent(code), { signal: c.signal })
      .then(d => { if (!c.signal.aborted) setCards(d.cards); })
      .catch(e => { if (!c.signal.aborted) setError(e.message); })
      .finally(() => { if (!c.signal.aborted) setLoading(false); });
    return () => c.abort();
  }, [code, retry]);
  return <><label>Carte précise<select value={value} disabled={!code || loading || !!error} onChange={e => onChange(e.target.value)} required>
    <option value="">{loading ? "Chargement…" : "Choisir une carte"}</option>
    {value && !cards.some(c => c.id === value) && <option value={value}>Carte sélectionnée · {value}</option>}
    {cards.map(c => <option key={c.id} value={c.id}>{c.localId} · {c.name}</option>)}
  </select></label>{error && <><p role="alert">{error}</p><button type="button" className="quiet-button" onClick={() => setRetry(v => v + 1)}>Recharger les cartes</button></>}</>;
}
export function AdminCollectionRewards({ sets, canEdit }: { sets: RewardSetReference[]; canEdit: boolean }) {
  const [code, setCode] = useState(sets[0]?.code ?? ""), [saved, setSaved] = useState<CollectionRewardConfig | null>(null), [draft, setDraft] = useState<CollectionRewardConfig | null>(null);
  const [loading, setLoading] = useState(!!code), [saving, setSaving] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState(""), [reload, setReload] = useState(0);
  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(saved);
  useEffect(() => {
    const c = new AbortController(); setSaved(null); setDraft(null); setError(""); setNotice(""); setLoading(!!code);
    if (code) api("/api/admin/collection-rewards?set=" + encodeURIComponent(code), { signal: c.signal })
      .then(d => { if (!c.signal.aborted) { setSaved(d); setDraft(d); } })
      .catch(e => { if (!c.signal.aborted) setError(e.message); })
      .finally(() => { if (!c.signal.aborted) setLoading(false); });
    return () => c.abort();
  }, [code, reload]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const patch = (id: string, changes: Partial<EventReward>) => setDraft(d => d && ({ ...d, rewards: d.rewards.map(r => r.id === id ? { ...r, ...changes } : r) }));
  const canSave = !!draft && validEventRewards(draft.rewards) && (!draft.enabled || draft.rewards.length > 0);
  async function save() {
    if (!canEdit || !draft || saving || !canSave) return;
    setSaving(true); setError(""); setNotice("");
    try { const d = await api("/api/admin/collection-rewards", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) }); setSaved(d); setDraft(d); setNotice("Configuration enregistrée. Aucune récompense n’a été distribuée."); }
    catch (e) { setError(e instanceof Error ? e.message : "Enregistrement impossible."); }
    finally { setSaving(false); }
  }
  function select(next: string) { if (dirty && !confirm("Abandonner les changements non enregistrés ?")) return; setDraft(null); setCode(next); }
  return <section className="collection-reward-admin" aria-label="Configuration des récompenses de complétion">
    <p className="news-status">La récupération des récompenses n’est pas encore disponible. Tu peux préparer ici la configuration de chaque set ; enregistrer ne distribue aucune récompense.</p>
    <label>Set à compléter<select value={code} disabled={saving || !sets.length} onChange={e => select(e.target.value)}>{!sets.length && <option value="">Aucun set disponible</option>}{sets.map(s => <option value={s.code} key={s.code}>{s.code} · {s.name}</option>)}</select></label>
    {loading && <p role="status">Chargement de la configuration…</p>}{error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    {code && !loading && <button type="button" className="quiet-button" disabled={saving} onClick={() => { if (!dirty || confirm("Abandonner les changements non enregistrés ?")) setReload(v => v + 1); }}>Recharger la configuration</button>}
    {draft && !loading && <form onSubmit={e => { e.preventDefault(); void save(); }}>
      <fieldset className="news-block" disabled={!canEdit || saving}><legend>Récompense du set</legend>
        <label className="collection-reward-toggle"><input type="checkbox" checked={draft.enabled} onChange={e => setDraft({ ...draft, enabled: e.target.checked })} /> Prévoir une récompense pour ce set</label>
        {!draft.enabled && <p>Récompense désactivée. Sa liste peut être préparée et conservée.</p>}
        {draft.rewards.map((r, i) => <fieldset className="news-block collection-reward-row" key={r.id}><legend>Récompense {i + 1}</legend>
          <label>Type<select value={r.kind} onChange={e => patch(r.id, { kind: e.target.value as EventReward["kind"], quantity: 1, setCode: "", cardId: "" })}><option value="coins">Pièces</option><option value="gems">Gemmes</option><option value="booster">Boosters</option><option value="card">Carte précise</option></select></label>
          <label>Quantité<input type="number" min={1} max={r.kind === "card" || r.kind === "booster" ? 100 : 1000000} step={1} value={r.quantity} required onChange={e => patch(r.id, { quantity: Number(e.target.value) })} /></label>
          {(r.kind === "card" || r.kind === "booster") && <label>Set de la récompense<select value={r.setCode} required onChange={e => patch(r.id, { setCode: e.target.value, cardId: "" })}><option value="">Choisir un set</option>{r.setCode && !sets.some(s => s.code === r.setCode) && <option value={r.setCode}>{r.setCode} · indisponible</option>}{sets.map(s => <option key={s.code} value={s.code}>{s.code} · {s.name}</option>)}</select></label>}
          {r.kind === "card" && <RewardCardSelect code={r.setCode} value={r.cardId} onChange={cardId => patch(r.id, { cardId })} />}
          <button type="button" className="quiet-button" onClick={() => setDraft({ ...draft, rewards: draft.rewards.filter(v => v.id !== r.id) })}>Retirer cette récompense</button>
        </fieldset>)}
        <button type="button" className="quiet-button" disabled={draft.rewards.length >= 20} onClick={() => setDraft({ ...draft, rewards: [...draft.rewards, { id: crypto.randomUUID(), kind: "coins", quantity: 1, setCode: "", cardId: "" }] })}>Ajouter une récompense</button>
      </fieldset>
      {!canSave && <p role="status">Complète les quantités et les références. Une récompense prévue doit contenir au moins un élément.</p>}
      {canEdit && <button type="submit" className="button game-primary" disabled={saving || !canSave || !dirty}>{saving ? "Enregistrement…" : "Enregistrer la configuration"}</button>}
    </form>}
  </section>;
}
