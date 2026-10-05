import { availableFinishes, type AvailableFinish } from "./card-metadata";
import { defectNames } from "./card-defects";
import { AdminError } from "./admin-authorisation";
import type { CollectionFilters } from "./collection-filters";

export function readCollectionFilters(params: URLSearchParams): CollectionFilters {
  const setCode = params.get("setCode") ?? "", rarity = params.get("rarity") ?? "";
  const finish = params.get("finish") ?? "", defect = params.get("defect") ?? "";
  const search = params.get("search") ?? "";
  const favorites = params.get("favorites") ?? "";
  if (!["", "only"].includes(favorites) || (setCode && !/^[A-Z0-9.-]{1,12}$/.test(setCode)) || rarity.length > 160 || search.length > 160 || /[\u0000-\u001f\u007f]/.test(search) || (finish && !availableFinishes.includes(finish as AvailableFinish)) || !["", "with", "without", ...Object.keys(defectNames)].includes(defect)) {
    throw new AdminError("Filtres de collection invalides.", 400);
  }
  return { setCode, rarity, finish: finish as CollectionFilters["finish"], defect: defect as CollectionFilters["defect"], search: search.trim(), favorites: favorites as CollectionFilters["favorites"] };
}
