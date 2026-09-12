/**
 * Delivery zones.
 *
 * v1 has no geocoding / polygons — a zone is a district + a neighbourhood
 * allow-list, mapped to exactly one branch. `resolveZone(district, neighbourhood)`
 * is how "Adrese Teslim" picks a branch: the customer never chooses one.
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
/* Seed                                                                        */
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
 * district + neighbourhood -> the single serving zone (or null when we don't
 * deliver there). Neighbourhood match is normalised; district is a soft filter
 * so a neighbourhood that appears under a slightly different district label
 * still resolves.
 */
export function resolveZone(
  district: string | null | undefined,
  neighborhood: string | null | undefined,
): DeliveryZone | null {
  const n = normalize(neighborhood ?? "");
  if (!n) return null;

  const zones = repo.list().filter((z) => z.active);
  const d = normalize(district ?? "");

  const byNeighborhood = zones.filter((z) =>
    z.neighborhoods.some((hood) => normalize(hood) === n),
  );
  if (byNeighborhood.length === 0) return null;
  if (byNeighborhood.length === 1) return byNeighborhood[0];

  // Multiple zones list the neighbourhood (e.g. "Bahçelievler") -> prefer the
  // one whose district also matches.
  return byNeighborhood.find((z) => normalize(z.district) === d) ?? byNeighborhood[0];
}

/** Distinct districts we deliver to — for the address form's district select. */
export function deliverableDistricts(): string[] {
  return [...new Set(repo.list().filter((z) => z.active).map((z) => z.district))].sort();
}

/** Neighbourhoods we deliver to within a district — for the address form. */
export function deliverableNeighborhoods(district: string): string[] {
  const d = normalize(district);
  const hoods = repo
    .list()
    .filter((z) => z.active && normalize(z.district) === d)
    .flatMap((z) => z.neighborhoods);
  return [...new Set(hoods)].sort((a, b) => a.localeCompare(b, "tr"));
}
