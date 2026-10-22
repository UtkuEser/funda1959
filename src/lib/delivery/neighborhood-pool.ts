/**
 * The neighbourhood pool (D52): the official district + neighbourhood names
 * Merkez can give to a branch. Client-safe.
 *
 * The names come from `./data/ankara-mahalleler.json` (sources, access date
 * and the differences between sources are in the file; only names were
 * taken). Eight Ankara districts (D52, D55). The pool is ONLY the list of
 * places — which branch serves one, whether delivery is open and its fee are
 * the delivery areas (`delivery_areas`, `delivery_zone_fees`). A pool entry
 * nobody assigned is not served: being in the pool never opens delivery.
 *
 * An area saved before the pool keeps its own name and record: "Oran" and
 * "Ümitköy" are matched to "Or-An" and "Ümit" through `aliases` (never a
 * second record), and an old name that is in no source ("Aşağı Ayrancı",
 * "Gölbaşı" …) stays as it is, marked unverified — never merged by likeness.
 */

import data from "./data/ankara-mahalleler.json";
import { areaKey } from "./areas";

export type PoolStatus = "verified" | "pending";

export type PoolEntry = {
  district: string;
  /** the district municipality's spelling */
  name: string;
  /** other source spellings and search words — the same place */
  aliases: string[];
  /** pending: in one source only (ABB) — waits for checking, can't be given to a branch */
  status: PoolStatus;
  note: string | null;
  /** areaKey of the name */
  key: string;
};

type RawEntry = { name: string; aliases?: string[]; status?: string; note?: string };

export const POOL_SOURCES: { id: string; district: string; publisher: string; url: string; pages: number; count: number }[] = data.sources;
export const POOL_ACCESSED_AT: string = data.accessedAt;

export const NEIGHBORHOOD_POOL: PoolEntry[] = data.districts.flatMap((d) =>
  (d.neighborhoods as RawEntry[]).map((n) => ({
    district: d.district,
    name: n.name,
    aliases: n.aliases ?? [],
    status: n.status === "pending" ? "pending" : "verified",
    note: n.note ?? null,
    key: areaKey(d.district, n.name),
  })),
);

/** every key a pool entry is known by: its name and its aliases */
const keysOf = (e: PoolEntry) => [e.key, ...e.aliases.map((a) => areaKey(e.district, a))];
const byKey = new Map<string, PoolEntry>(NEIGHBORHOOD_POOL.flatMap((e) => keysOf(e).map((k) => [k, e] as const)));

/** Districts with a pool. */
export function poolDistricts(): string[] {
  return data.districts.map((d) => d.district);
}

/** A district's pool, in list order. */
export function poolFor(district: string): PoolEntry[] {
  return NEIGHBORHOOD_POOL.filter((e) => e.district === district);
}

/** The pool entry a name stands for in a district (official name or alias, folded) — null if none. */
export function findPoolEntry(district: string, neighborhood: string): PoolEntry | null {
  return byKey.get(areaKey(district, neighborhood)) ?? null;
}

/** The keys of the entry: an area saved under any of them is this place. */
export function poolEntryKeys(entry: PoolEntry): string[] {
  return keysOf(entry);
}

/** Does a search text match the entry (name or alias, folded)? */
export function poolEntryMatches(entry: PoolEntry, foldedQuery: string): boolean {
  if (!foldedQuery) return true;
  return keysOf(entry).some((k) => k.split("|")[1].includes(foldedQuery));
}
