import type { AvailableFinish } from "./card-metadata";
import type { defectNames } from "./card-defects";

export type CollectionFilters = { setCode: string; rarity: string; finish: "" | AvailableFinish; defect: "" | "with" | "without" | keyof typeof defectNames; search: string; favorites: "" | "only" };
export type CollectionFilterOptions = { sets: { code: string; name: string }[]; rarities: string[] };
export const emptyCollectionFilters: CollectionFilters = { setCode: "", rarity: "", finish: "", defect: "", search: "", favorites: "" };
