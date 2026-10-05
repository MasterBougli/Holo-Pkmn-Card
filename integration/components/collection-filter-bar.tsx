"use client";
import { useId } from "react";
import { availableFinishes, finishLabels } from "@/lib/card-metadata";
import { defectNames } from "@/lib/card-defects";
import { emptyCollectionFilters, type CollectionFilters, type CollectionFilterOptions } from "@/lib/collection-filters";

export function CollectionFilterBar({ value, options, disabled, onChange, showFavorites = true }: { value: CollectionFilters; options: CollectionFilterOptions; disabled: boolean; showFavorites?: boolean; onChange: (value: CollectionFilters) => void }) {
  const id = useId();
  const active = !!(value.setCode || value.rarity || value.finish || value.defect || value.favorites);
  return <fieldset className="collection-filters" disabled={disabled}>
    <legend>Filtrer les cartes</legend><div className="collection-filter-grid">
      <label htmlFor={id + "-set"}>Set<select id={id + "-set"} value={value.setCode} onChange={e => onChange({ ...value, setCode: e.target.value })}>
        <option value="">Tous les sets</option>
        {value.setCode && !options.sets.some(s => s.code === value.setCode) && <option value={value.setCode}>{value.setCode}</option>}
        {options.sets.map(s => <option value={s.code} key={s.code}>{s.name} ({s.code})</option>)}
      </select></label>
      <label htmlFor={id + "-rarity"}>Rareté<select id={id + "-rarity"} value={value.rarity} onChange={e => onChange({ ...value, rarity: e.target.value })}>
        <option value="">Toutes les raretés</option>
        {value.rarity && !options.rarities.includes(value.rarity) && <option value={value.rarity}>{value.rarity}</option>}
        {options.rarities.map(r => <option value={r} key={r}>{r}</option>)}
      </select></label>
      <label htmlFor={id + "-finish"}>Finition<select id={id + "-finish"} value={value.finish} onChange={e => onChange({ ...value, finish: e.target.value as CollectionFilters["finish"] })}>
        <option value="">Toutes les finitions</option>{availableFinishes.map(f => <option value={f} key={f}>{finishLabels[f]}</option>)}
      </select></label>
      <label htmlFor={id + "-defect"}>Défauts<select id={id + "-defect"} value={value.defect} onChange={e => onChange({ ...value, defect: e.target.value as CollectionFilters["defect"] })}>
        <option value="">Tous les exemplaires</option><option value="without">Sans défaut</option><option value="with">Avec un défaut ou plus</option>
        {Object.entries(defectNames).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
      </select></label>
      {showFavorites && <label htmlFor={id + "-favorites"}>Favoris<select id={id + "-favorites"} value={value.favorites} onChange={e => onChange({ ...value, favorites: e.target.value as CollectionFilters["favorites"] })}><option value="">Tous mes exemplaires</option><option value="only">Mes favoris uniquement</option></select></label>}
    </div><button className="quiet-button" type="button" disabled={!active} onClick={() => onChange({ ...emptyCollectionFilters, search: value.search })}>Effacer les filtres</button>
  </fieldset>;
}
