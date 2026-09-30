/**
 * Delivery zones.
 *
 * v1 has no geocoding / polygons — a zone is a district + a neighbourhood
 * allow-list served by one branch. The customer enters district +
 * neighbourhood; `resolveZone` finds the zone and with it the branch that
 * serves the address. No zone -> the address is not served (never a
 * fallback branch).
 */

import { normalize } from "../search";

export type DeliveryZone = {
  id: string;
  name: string;
  branchId: string;
  district: string;
  /** neighbourhoods this zone covers (normalised match) */
  neighborhoods: string[];
  deliveryFee: number;
  minimumOrder: number;
  active: boolean;
};

/* -------------------------------------------------------------------------- */
/* Seed — SAMPLE DATA for the design phase. The real coverage map replaces it   */
/* through setDeliveryZoneRepository(); nothing else reads this array.          */
/* -------------------------------------------------------------------------- */

const ZONE_SEED: DeliveryZone[] = [
  {
    id: "zone-gop-cankaya",
    name: "GOP & Çankaya",
    branchId: "gop",
    district: "Çankaya",
    neighborhoods: [
      "Gaziosmanpaşa",
      "Kavaklıdere",
      "Aşağı Ayrancı",
      "Yukarı Ayrancı",
      "Çankaya",
      "Kızılay",
      "Bahçelievler",
    ],
    deliveryFee: 60,
    minimumOrder: 250,
    active: true,
  },
  {
    id: "zone-panora-kizilay",
    name: "Panora Çevresi",
    branchId: "panora",
    district: "Çankaya",
    neighborhoods: ["Oran", "Balgat", "Öveçler", "Dikmen", "Yıldız", "Söğütözü"],
    deliveryFee: 55,
    minimumOrder: 250,
    active: true,
  },
  {
    id: "zone-incek-golbasi",
    name: "İncek & Gölbaşı",
    branchId: "incek",
    district: "Gölbaşı",
    neighborhoods: ["İncek", "Taşpınar", "Karşıyaka", "Gölbaşı", "Bahçelievler"],
    deliveryFee: 70,
    minimumOrder: 300,
    active: true,
  },
  {
    id: "zone-incek-cankaya-south",
    name: "İncek Güney Hattı",
    branchId: "incek",
    district: "Çankaya",
    neighborhoods: ["Çayyolu", "Ümitköy", "Koru", "Alacaatlı"],
    deliveryFee: 75,
    minimumOrder: 300,
    active: true,
  },
];

/* -------------------------------------------------------------------------- */
/* Repository                                                                  */
/* -------------------------------------------------------------------------- */

export interface DeliveryZoneRepository {
  list(): DeliveryZone[];
  get(id: string): DeliveryZone | null;
}

class InMemoryZoneRepository implements DeliveryZoneRepository {
  constructor(private readonly zones: DeliveryZone[]) {}
  list(): DeliveryZone[] {
    return this.zones.slice();
  }
  get(id: string): DeliveryZone | null {
    return this.zones.find((z) => z.id === id) ?? null;
  }
}

let repo: DeliveryZoneRepository = new InMemoryZoneRepository(ZONE_SEED);

export function setDeliveryZoneRepository(next: DeliveryZoneRepository): void {
  repo = next;
}
export function getDeliveryZoneRepository(): DeliveryZoneRepository {
  return repo;
}

/* -------------------------------------------------------------------------- */
/* Resolution                                                                  */
/* -------------------------------------------------------------------------- */

export function getZone(id: string | null | undefined): DeliveryZone | null {
  return id ? repo.get(id) : null;
}

/**
 * Every active zone covering district + neighbourhood — one per serving branch.
 * Neighbourhood match is normalised; district is a soft filter so a
 * neighbourhood listed under a slightly different district label still
 * resolves.
 */
function servingZones(
  district: string | null | undefined,
  neighborhood: string | null | undefined,
): DeliveryZone[] {
  const n = normalize(neighborhood ?? "");
  if (!n) return [];

  const byNeighborhood = repo
    .list()
    .filter((z) => z.active && z.neighborhoods.some((hood) => normalize(hood) === n));

  const d = normalize(district ?? "");
  const inDistrict = byNeighborhood.filter((z) => normalize(z.district) === d);
  return inDistrict.length > 0 ? inDistrict : byNeighborhood;
}

/**
 * The zone that fulfils an order to district + neighbourhood. With `branchId`
 * it is that branch's zone (null when the branch doesn't serve the area);
 * without it, the first serving zone.
 */
export function resolveZone(
  district: string | null | undefined,
  neighborhood: string | null | undefined,
  branchId?: string | null,
): DeliveryZone | null {
  const zones = servingZones(district, neighborhood);
  if (branchId) return zones.find((z) => z.branchId === branchId) ?? null;
  return zones[0] ?? null;
}

/** Districts with at least one active zone — the address picker's first select. */
export function deliverableDistricts(): string[] {
  return [...new Set(repo.list().filter((z) => z.active).map((z) => z.district))].sort((a, b) =>
    a.localeCompare(b, "tr"),
  );
}

/** Neighbourhoods served within a district — the picker's second select. */
export function deliverableNeighborhoods(district: string): string[] {
  const d = normalize(district);
  const hoods = repo
    .list()
    .filter((z) => z.active && normalize(z.district) === d)
    .flatMap((z) => z.neighborhoods);
  return [...new Set(hoods)].sort((a, b) => a.localeCompare(b, "tr"));
}
