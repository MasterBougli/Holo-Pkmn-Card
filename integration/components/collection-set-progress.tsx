"use client";
import { useId } from "react";
import type { CollectionSetProgress } from "@/lib/collection-progress-types";
export function CollectionSetProgressPanel({ sets, onSelect, onMissing }: { sets: CollectionSetProgress[]; onSelect: (code: string) => void; onMissing: (code: string) => void }) {
  const id = useId();
  if (!sets.length) return null;
  const completed = sets.filter(s => s.total > 0 && s.obtained === s.total).length;
  return <details className="collection-progress-panel" open>
    <summary>Progression par set · {completed} / {sets.length} complétés</summary>
    <p>Cartes différentes actuellement possédées dans cette collection, indépendamment des filtres. Doublons et défauts ne comptent pas plusieurs fois. Une carte redevient manquante si sa dernière copie quitte la collection.</p>
    <p>Un set déjà commencé reste visible, même si cette collection ne contient plus aucune de ses cartes.</p>
    <ul className="collection-progress-grid">{sets.map(s => {
      const complete = s.total > 0 && s.obtained === s.total;
      return <li key={s.code}><h2 id={id + s.code}>{s.name} <small>({s.code})</small></h2>
        <p>{s.obtained.toLocaleString("fr-FR")} / {s.total > 0 ? s.total.toLocaleString("fr-FR") : "Total à définir"} cartes différentes possédées{s.total > 0 ? " · " + Math.floor(s.obtained * 100 / s.total) + " %" : ""}{complete ? " · Set complété" : ""}</p>
        {s.total > 0 && <progress value={s.obtained} max={s.total} aria-labelledby={id + s.code} aria-valuetext={s.obtained + " cartes différentes possédées sur " + s.total} />}
        {!s.active && <p className="collection-order-note">Set inactif</p>}
        {s.catalogueMissing > 0 && <p className="collection-order-note">Catalogue incomplet : {s.catalogueMissing} carte(s) restent à renseigner.</p>}
        {s.unlistedOwned > 0 && <p className="collection-order-note">{s.unlistedOwned} carte(s) détenue(s) hors catalogue, non comptées dans cette progression.</p>}
        <div className="collection-progress-actions"><button className="quiet-button" type="button" onClick={() => onSelect(s.code)}>Voir les cartes de ce set</button>
        <button className="quiet-button" type="button" onClick={() => onMissing(s.code)}>Voir les cartes manquantes</button></div>
      </li>;
    })}</ul>
  </details>;
}
