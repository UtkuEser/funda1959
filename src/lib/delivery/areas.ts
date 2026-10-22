/**
 * Delivery areas (D49, D50) — the shapes and rules shared by the browser and
 * the server. Client-safe, no secrets.
 *
 * An area is one district + neighbourhood. It belongs to exactly one branch,
 * delivery to it is open or closed (closing never deletes it), and it has its
 * own fee. The same neighbourhood name in two districts is two areas; names
 * are compared folded (`areaKey`), so "Bahçelievler" in Çankaya and in
 * Gölbaşı never meet, and "bahcelievler" can't become a second Çankaya row.
 *
 * Before migration 0015 the areas are the old zone list below (TEST DATA,
 * D15 / A4), each with its zone's fee — nothing here is invented.
 */

import { ANKARA_DISTRICTS } from "../checkout-utils";
import { normalize } from "../search";

/** One area as the storefront needs it. `zoneId` names its fee row (delivery_zone_fees). */
export type AreaAssignment = { district: string; neighborhood: string; branchId: string; enabled: boolean; zoneId: string };

export type AreaFeeState = "unset" | "paid" | "free";

/** One area as Merkez edits it. */
export type AreaRecord = AreaAssignment & {
  key: string;
  /** unset: no fee chosen yet (no delivery until one is) · free: 0 · paid: > 0 */
  feeState: AreaFeeState;
  fee: number | null;
  updatedBy: string | null;
  updatedAt: string | null;
};

/** The districts an area can be in — the districts the order form knows (no other district is invented). */
export const AREA_DISTRICTS: readonly string[] = ANKARA_DISTRICTS;

export const AREA_LIMITS = { nameMin: 2, nameMax: 60, maxFee: 10_000 } as const;

/** "Çankaya" + "Aşağı Ayrancı" -> "cankaya|asagi ayranci": one key per place, whatever the spelling. */
export const areaKey = (district: string, neighborhood: string) => `${normalize(district)}|${normalize(neighborhood)}`;

/** A neighbourhood name as stored: single spaces, trimmed. */
export const cleanAreaName = (s: string) => s.replace(/\s+/g, " ").trim();

/** Why a neighbourhood name is refused (null: fine). */
export function areaNameProblem(name: string): string | null {
  const n = cleanAreaName(name);
  if (n.length < AREA_LIMITS.nameMin || n.length > AREA_LIMITS.nameMax) return `Mahalle adı ${AREA_LIMITS.nameMin}–${AREA_LIMITS.nameMax} karakter olmalı.`;
  if (!/^[\p{L}\p{N}][\p{L}\p{N} .'’()-]*$/u.test(n)) return "Mahalle adında yalnızca harf, rakam, boşluk ve . ' - ( ) kullanılabilir.";
  if (!normalize(n)) return "Mahalle adı geçersiz.";
  return null;
}

/** A fee as Merkez enters it: > 0, at most 10.000 TL, at most two decimals. */
export function isValidAreaFee(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v > 0 && v <= AREA_LIMITS.maxFee && Math.abs(Math.round(v * 100) - v * 100) < 1e-6;
}

/** The zones of the old list — the starting branch of each neighbourhood and the fee it starts with. */
export const KNOWN_ZONES: { id: string; name: string; branchId: string; district: string }[] = [
  { id: "zone-gop-cankaya", name: "GOP & Çankaya", branchId: "gop", district: "Çankaya" },
  { id: "zone-panora-kizilay", name: "Panora Çevresi", branchId: "panora", district: "Çankaya" },
  { id: "zone-incek-golbasi", name: "İncek & Gölbaşı", branchId: "incek", district: "Gölbaşı" },
  { id: "zone-incek-cankaya-south", name: "İncek Güney Hattı", branchId: "incek", district: "Çankaya" },
];

const SEED: Record<string, string[]> = {
  "zone-gop-cankaya": ["Gaziosmanpaşa", "Kavaklıdere", "Aşağı Ayrancı", "Yukarı Ayrancı", "Çankaya", "Kızılay", "Bahçelievler"],
  "zone-panora-kizilay": ["Oran", "Balgat", "Öveçler", "Dikmen", "Yıldız", "Söğütözü"],
  "zone-incek-golbasi": ["İncek", "Taşpınar", "Karşıyaka", "Gölbaşı", "Bahçelievler"],
  "zone-incek-cankaya-south": ["Çayyolu", "Ümitköy", "Koru", "Alacaatlı"],
};

/** Before 0015: the old list, every area open, its fee = its zone's fee (`zoneId` = the old zone). */
export const SEED_ASSIGNMENTS: AreaAssignment[] = KNOWN_ZONES.flatMap((z) =>
  SEED[z.id].map((neighborhood) => ({ district: z.district, neighborhood, branchId: z.branchId, enabled: true, zoneId: z.id })),
);
