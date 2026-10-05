import type { CollectionFilters } from "./collection-filters";
import type { OwnedCard } from "./booster-types";
export type CollectionGroupContext = { anchorId: string; pseudo?: string; filters: CollectionFilters };
export type CollectionCopy = { card: OwnedCard; createdAt: string };
