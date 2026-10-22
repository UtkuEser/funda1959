/**
 * Delivery areas at run time (D15, D49, D50) — client-safe.
 *
 * No geocoding / polygons. Every district + neighbourhood Merkez manages is
 * one area: it belongs to one branch, delivery to it is open or closed, and
 * its fee is its own fee row (`zoneId` -> delivery_zone_fees, read by
 * `./fees`; migration 0015). The customer enters district + neighbourhood and
 * `resolveZone` finds the open area, and with it the branch that serves the
 * address. No area, or a closed one -> the address is not served: never a
 * fallback branch, never a same-named neighbourhood of another district.
 *
 * The areas are registered here — on the server after each read
 * (`./areas-server.ts`), in the browser by the delivery context after
 * GET /api/delivery-areas.
 */

import { areaKey, SEED_ASSIGNMENTS, type AreaAssignment } from "./areas";

/** What an order is fulfilled under: the area's fee row (`id`) and its branch. */
export type DeliveryZone = {
  id: string;
  name: string;
  branchId: string;
  district: string;
  neighborhoods: string[];
  active: boolean;
};

/** where the areas come from: the database (0015) or, before it, the old zone list */
export type AreaSource = "database" | "seed";

type Registry =
  | { state: "ready"; source: AreaSource; areas: AreaAssignment[]; byKey: Map<string, AreaAssignment> }
  | { state: "loading" | "unavailable" };

const shared = globalThis as unknown as { __fundaAreas?: Registry };

function build(areas: AreaAssignment[], source: AreaSource): Registry {
  const copy = areas.map((a) => ({ ...a }));
  return { state: "ready", source, areas: copy, byKey: new Map(copy.map((a) => [areaKey(a.district, a.neighborhood), a])) };
}

/** server: the old list until the first read; browser: nothing until the context has loaded them */
function registry(): Registry {
  if (!shared.__fundaAreas) shared.__fundaAreas = typeof window === "undefined" ? build(SEED_ASSIGNMENTS, "seed") : { state: "loading" };
  return shared.__fundaAreas;
}

export function setAreaAssignments(areas: AreaAssignment[], source: AreaSource): void {
  shared.__fundaAreas = build(areas, source);
}

/** The areas could not be read: delivery answers "Teslimat bilgisi şu an alınamıyor", never an older map. */
export function markAreasUnavailable(): void {
  shared.__fundaAreas = { state: "unavailable" };
}

export function areasState(): "ready" | "loading" | "unavailable" {
  return registry().state;
}

export function areaSource(): AreaSource | null {
  const r = registry();
  return r.state === "ready" ? r.source : null;
}

/** Every area, open and closed ([] unless read). */
export function areaAssignments(): AreaAssignment[] {
  const r = registry();
  return r.state === "ready" ? r.areas.map((a) => ({ ...a })) : [];
}

/** The area of district + neighbourhood, open or closed (folded match on both). */
export function findArea(district: string | null | undefined, neighborhood: string | null | undefined): AreaAssignment | null {
  const r = registry();
  if (r.state !== "ready" || !district?.trim() || !neighborhood?.trim()) return null;
  const a = r.byKey.get(areaKey(district, neighborhood));
  return a ? { ...a } : null;
}

/**
 * The open area that serves district + neighbourhood, as a zone (its fee
 * row and branch) — null when there is none or delivery to it is closed.
 * With `branchId` it must be that branch's.
 */
export function resolveZone(
  district: string | null | undefined,
  neighborhood: string | null | undefined,
  branchId?: string | null,
): DeliveryZone | null {
  const a = findArea(district, neighborhood);
  if (!a || !a.enabled || (branchId && a.branchId !== branchId)) return null;
  return { id: a.zoneId, name: `${a.neighborhood} (${a.district})`, branchId: a.branchId, district: a.district, neighborhoods: [a.neighborhood], active: true };
}

/** Districts the address forms offer: those with at least one area (served or not). */
export function addressDistricts(): string[] {
  return [...new Set(areaAssignments().map((a) => a.district))].sort((x, y) => x.localeCompare(y, "tr"));
}

/** A district's neighbourhoods, open and closed — a closed one answers "not served" instead of hiding. */
export function addressNeighborhoods(district: string): string[] {
  return areaAssignments()
    .filter((a) => a.district === district)
    .map((a) => a.neighborhood)
    .sort((x, y) => x.localeCompare(y, "tr"));
}

/** Is this an exact district + neighbourhood of an area? */
export function isKnownArea(district: string, neighborhood: string): boolean {
  return areaAssignments().some((a) => a.district === district && a.neighborhood === neighborhood);
}
