"use client";
import { useEffect, useId, useState } from "react";

export function CollectionCardSearch({ value, disabled, onSearch }: { value: string; disabled: boolean; onSearch: (search: string) => void }) {
  const id = useId(), [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return <section className="collection-search collection-card-search" aria-labelledby={id + "-title"}>
    <h2 id={id + "-title"}>Rechercher une carte</h2>
    <form onSubmit={e => { e.preventDefault(); if (!disabled) onSearch(draft.trim()); }}>
      <div className="form-field"><label htmlFor={id}>Nom ou numéro de carte</label>
        <input id={id} type="search" value={draft} maxLength={160} disabled={disabled} autoComplete="off" aria-describedby={id + "-help"} onChange={e => setDraft(e.target.value)} />
        <small id={id + "-help"}>Tout ou partie du nom ou du numéro. Majuscules et accents ignorés.</small>
      </div><button className="button game-primary" type="submit" disabled={disabled}>{disabled ? "Chargement…" : "Rechercher"}</button>
      <button className="quiet-button" type="button" disabled={disabled || (!draft && !value)} onClick={() => { setDraft(""); onSearch(""); }}>Effacer la recherche</button>
    </form>
  </section>;
}
