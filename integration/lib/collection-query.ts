import { and, asc, count, eq, sql, type SQL } from "drizzle-orm";
import { db } from "./db";
import { ownedCards } from "./booster-schema";
import { defectNames } from "./card-defects";
import { emptyCollectionFilters, type CollectionFilters } from "./collection-filters";
import { collectionProgress } from "./collection-progress";
import { cardSearchFrom, cardSearchTo, normalizeCardSearch } from "./card-search-normalization";

type Connection = Pick<typeof db, "select" | "selectDistinct">;
const activeDefect = (key: string) => sql`coalesce(${ownedCards.snapshot}->'defects'->'settings'->${key}->>'enabled', 'false') = 'true'`;
const anyDefect = () => sql`(${sql.join(Object.keys(defectNames).map(activeDefect), sql` OR `)})`;
export function collectionGroupKey() {
  return sql<string>`CASE WHEN ${anyDefect()} THEN 'copy:' || ${ownedCards.id}
    ELSE 'card:' || jsonb_build_array(${ownedCards.setCode}, ${ownedCards.cardId}, ${ownedCards.snapshot}->>'finish')::text END`;
}
export function collectionWhere(userId: string, filters: CollectionFilters) {
  const escape = String.fromCharCode(92);
  const needle = [...normalizeCardSearch(filters.search)].map(c => c === escape || "%_".includes(c) ? escape + c : c).join("");
  const pattern = "%" + needle + "%";
  const normalized = (field: SQL) => sql<string>`translate(replace(replace(replace(lower(coalesce(${field}, '')), 'œ', 'oe'), 'æ', 'ae'), 'ß', 'ss'), ${cardSearchFrom}, ${cardSearchTo})`;
  return and(eq(ownedCards.userId, userId), filters.favorites === "only" ? eq(ownedCards.favorite, true) : undefined, filters.setCode ? eq(ownedCards.setCode, filters.setCode) : undefined,
    filters.search ? sql`(${normalized(sql`${ownedCards.snapshot}->>'name'`)} LIKE ${pattern} ESCAPE ${escape} OR ${normalized(sql`${ownedCards.snapshot}->>'localId'`)} LIKE ${pattern} ESCAPE ${escape})` : undefined,
    filters.rarity ? sql`${ownedCards.snapshot}->>'rarity' = ${filters.rarity}` : undefined,
    filters.finish ? sql`${ownedCards.snapshot}->>'finish' = ${filters.finish}` : undefined,
    filters.defect === "with" ? anyDefect() : filters.defect === "without" ? sql`NOT ${anyDefect()}` : filters.defect ? activeDefect(filters.defect) : undefined);
}
export async function collectionData(userId: string, page: number, filters: CollectionFilters = emptyCollectionFilters, connection: Connection = db) {
  const rarity = sql<string>`${ownedCards.snapshot}->>'rarity'`;
  const setName = sql<string>`${ownedCards.snapshot}->>'setName'`;
  const where = collectionWhere(userId, filters);
  // Defects keep their own identity; ordinary duplicates share a visual collection entry.
  const groupKey = collectionGroupKey();
  const grouped = connection.select({
    id: ownedCards.id, snapshot: ownedCards.snapshot, setCode: ownedCards.setCode, cardId: ownedCards.cardId,
    quantity: sql<number>`count(*) OVER (PARTITION BY ${groupKey})`.mapWith(Number).as("copy_quantity"),
    rank: sql<number>`row_number() OVER (PARTITION BY ${groupKey} ORDER BY ${ownedCards.id} ASC)`.mapWith(Number).as("copy_rank"),
  }).from(ownedCards).where(where).as("collection_groups");
  const localNumber = sql<string>`coalesce(${grouped.snapshot}->>'localId', '')`;
  const rows = await connection.select({ id: grouped.id, snapshot: grouped.snapshot, quantity: grouped.quantity }).from(grouped)
    .where(eq(grouped.rank, 1)).orderBy(
      asc(grouped.setCode),
      sql`CASE WHEN btrim(${localNumber}) = '' THEN 1 ELSE 0 END ASC`,
      // Numeric ordering also handles identifiers such as TG2 / TG10 and 16 / 16a.
      sql`lower(regexp_replace(${localNumber}, '[0-9].*$', '')) COLLATE "C" ASC`,
      sql`substring(${localNumber} from '[0-9]+')::numeric ASC NULLS LAST`,
      sql`lower(regexp_replace(${localNumber}, '^[^0-9]*[0-9]+', '')) COLLATE "C" ASC`,
      sql`${localNumber} COLLATE "C" ASC`, asc(grouped.cardId), asc(grouped.id),
    ).limit(24).offset(page * 24);
  const [total] = await connection.select({ value: count(), groups: sql<number>`count(DISTINCT ${groupKey})`.mapWith(Number) }).from(ownedCards).where(where);
  // Options cover the whole collection and remain available after filters are combined.
  const sets = await connection.selectDistinct({ code: ownedCards.setCode, name: setName }).from(ownedCards)
    .where(eq(ownedCards.userId, userId)).orderBy(ownedCards.setCode, setName);
  const rarities = await connection.selectDistinct({ name: rarity }).from(ownedCards)
    .where(eq(ownedCards.userId, userId)).orderBy(rarity);
  const progress = await collectionProgress(userId, connection);
  return { rows, total: total.value, groupsTotal: total.groups, progress, options: {
    sets: [...new Map([...sets.map(s => [s.code, { code: s.code, name: s.name || s.code }] as const), ...progress.map(s => [s.code, { code: s.code, name: s.name }] as const)]).values()].sort((a, b) => a.code.localeCompare(b.code)),
    rarities: rarities.map(r => r.name).filter((r): r is string => typeof r === "string" && !!r),
  } };
}
