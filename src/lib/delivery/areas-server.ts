/**
 * Delivery areas — reads and Merkez's saves (D49, D50; table `delivery_areas`
 * and the areas' fee rows in `delivery_zone_fees`, migration 0015).
 * Server-only.
 *
 *   Supabase + 0015      -> the tables, the only source
 *   Supabase, 0015 missing / no Supabase
 *                        -> the old zone list (`SEED_ASSIGNMENTS`, each area with
 *                           its zone's fee), as before; nothing can be saved
 *
 * Reading rules as for the fees (D15): display paths may reuse a read a few
 * seconds old; quotes and orders read fresh. A failed read leaves the areas
 * "unavailable" — delivery then answers DELIVERY_INFO_UNAVAILABLE (pickup
 * keeps working) — never an older map.
 */

import { getBranch } from "../branch";
import { isSupabaseConfigured, SupabaseRestError, supabaseRest } from "../supabase-server";
import { AREA_DISTRICTS, areaKey, SEED_ASSIGNMENTS, type AreaAssignment, type AreaFeeState, type AreaRecord } from "./areas";
import { readDeliveryFeeRecords } from "./fees";
import { refreshDeliveryFees } from "./fees-server";
import { markAreasUnavailable, setAreaAssignments } from "./zones";

if (typeof window !== "undefined") {
  throw new Error("delivery/areas-server.ts must never be imported on the client");
}

/** Nothing can be saved here: 0015 isn't applied, or there is no database. */
export class AreasNotReadyError extends Error {
  constructor(readonly why: "table-missing" | "not-configured") {
    super(`delivery areas: ${why === "table-missing" ? "delivery_areas missing (0015)" : "no Supabase"}`);
    this.name = "AreasNotReadyError";
  }
}

/** The database refused a save: something changed meanwhile (conflict), or the request is malformed. */
export class AreaChangeRefusedError extends Error {
  constructor(readonly code: "conflict" | "forbidden" | "invalid") {
    super(`delivery areas refused: ${code}`);
    this.name = "AreaChangeRefusedError";
  }
}

export type AreaStoreStatus = "database" | "table-missing" | "not-configured";

type Row = {
  district: string;
  neighborhood: string;
  area_key: string;
  zone_id: string;
  branch_slug: string;
  delivery_enabled: boolean;
  updated_by: string | null;
  updated_at: string | null;
  /** only in the save answer */
  fee_state?: AreaFeeState | null;
  fee?: number | string | null;
  fee_updated_by?: string | null;
  fee_updated_at?: string | null;
};

const COLUMNS = "district,neighborhood,area_key,zone_id,branch_slug,delivery_enabled,updated_by,updated_at";
export const AREAS_DISPLAY_MAX_AGE_MS = 5_000;

const shared = globalThis as unknown as {
  __fundaAreasReadAt?: number;
  __fundaAreasInflight?: Promise<void>;
  __fundaAreasStatus?: AreaStoreStatus;
  __fundaAreaMeta?: Map<string, { updatedBy: string | null; updatedAt: string | null }>;
};

const isMissing = (err: unknown) =>
  err instanceof SupabaseRestError &&
  (err.status === 404 || err.code === "PGRST202" || err.code === "PGRST205" || err.code === "42P01" || err.code === "42883");

/** Rows of known districts and branches whose key fits their names; anything else is logged and left out. */
function usable(rows: Row[]): Row[] {
  return rows.filter((r) => {
    const ok = AREA_DISTRICTS.includes(r.district) && Boolean(getBranch(r.branch_slug)) && r.area_key === areaKey(r.district, r.neighborhood);
    if (!ok) console.error("[delivery-areas] row ignored", { district: r.district, neighborhood: r.neighborhood, branch: r.branch_slug });
    return ok;
  });
}

const toAssignment = (r: Row): AreaAssignment => ({
  district: r.district,
  neighborhood: r.neighborhood,
  branchId: r.branch_slug,
  enabled: r.delivery_enabled,
  zoneId: r.zone_id,
});

function register(rows: Row[] | null, status: AreaStoreStatus): void {
  if (rows) {
    setAreaAssignments(rows.map(toAssignment), "database");
    shared.__fundaAreaMeta = new Map(rows.map((r) => [r.area_key, { updatedBy: r.updated_by, updatedAt: r.updated_at }]));
  } else {
    setAreaAssignments(SEED_ASSIGNMENTS, "seed");
    shared.__fundaAreaMeta = new Map();
  }
  shared.__fundaAreasStatus = status;
  shared.__fundaAreasReadAt = Date.now();
}

async function load(): Promise<void> {
  if (!isSupabaseConfigured()) return register(null, "not-configured");
  try {
    const rows = await supabaseRest<Row[]>(`/delivery_areas?select=${COLUMNS}&order=district.asc,neighborhood.asc`);
    register(usable(rows ?? []), "database");
  } catch (err) {
    if (isMissing(err)) return register(null, "table-missing");
    throw err;
  }
}

/**
 * Reads the areas and registers them (`lib/delivery/zones.ts`).
 *   strict: a failed read throws; lenient (default): logged.
 * Either way a failed read leaves the areas "unavailable".
 */
export async function refreshDeliveryAreas({ strict = false, maxAgeMs = 0 }: { strict?: boolean; maxAgeMs?: number } = {}): Promise<void> {
  const at = shared.__fundaAreasReadAt;
  if (maxAgeMs > 0 && at !== undefined && Date.now() - at < maxAgeMs) return;
  let run: Promise<void> | undefined;
  try {
    if (maxAgeMs > 0 && shared.__fundaAreasInflight) {
      await shared.__fundaAreasInflight;
      return;
    }
    run = load();
    if (maxAgeMs > 0) shared.__fundaAreasInflight = run;
    await run;
  } catch (err) {
    delete shared.__fundaAreasReadAt;
    markAreasUnavailable();
    console.error("[delivery-areas] read failed", { error: (err as Error).message.slice(0, 200) });
    if (strict) throw err;
  } finally {
    if (run && shared.__fundaAreasInflight === run) delete shared.__fundaAreasInflight;
  }
}

/** Where the last successful read came from (null: never read, or the last read failed). */
export function areaStoreStatus(): AreaStoreStatus | null {
  return shared.__fundaAreasReadAt === undefined ? null : (shared.__fundaAreasStatus ?? null);
}

const later = (a: string | null | undefined, b: string | null | undefined) => ((a ? Date.parse(a) : 0) >= (b ? Date.parse(b) : 0) ? a : b) ?? null;

/**
 * Every area with its fee, for the panel — null while the fees can't be read
 * (an area's fee is its fee row; before 0015 the old zone's row).
 */
export function adminAreaRecords(areas: AreaAssignment[]): AreaRecord[] | null {
  const fees = readDeliveryFeeRecords();
  if (!fees) return null;
  const byZone = new Map(fees.map((f) => [f.zoneId, f]));
  const meta = shared.__fundaAreaMeta ?? new Map();
  return areas.map((a) => {
    const key = areaKey(a.district, a.neighborhood);
    const f = byZone.get(a.zoneId);
    const state: AreaFeeState = f?.state ?? "unset";
    const m = meta.get(key);
    const updatedAt = later(m?.updatedAt, f?.updatedAt);
    return {
      ...a,
      key,
      feeState: state,
      fee: state === "paid" ? f!.fee : state === "free" ? 0 : null,
      updatedBy: updatedAt === (m?.updatedAt ?? null) ? (m?.updatedBy ?? null) : (f?.updatedBy ?? null),
      updatedAt,
    };
  });
}

export type AreaSaveItem = {
  district: string;
  neighborhood: string;
  branchId: string;
  enabled: boolean;
  feeState: AreaFeeState;
  fee: number | null;
  /** the area as the panel saw it; null = a new area */
  expected: { branchId: string; enabled: boolean; feeState: AreaFeeState; fee: number | null } | null;
};

/**
 * One save of the panel — branch, open / closed and fee of every changed
 * area together, in one transaction (0015). Every area must still be as the
 * panel saw it, otherwise nothing is saved ("conflict"). Returns every area
 * with its fee after the save and registers them.
 */
export async function saveDeliveryAreas(actor: { name: string }, items: AreaSaveItem[]): Promise<AreaRecord[]> {
  if (!isSupabaseConfigured()) throw new AreasNotReadyError("not-configured");
  let rows: Row[] | null;
  try {
    rows = await supabaseRest<Row[] | null>("/rpc/save_delivery_areas", {
      method: "POST",
      body: JSON.stringify({
        p_payload: {
          actor_account: "merkez",
          actor: actor.name,
          items: items.map((i) => ({
            area_key: areaKey(i.district, i.neighborhood),
            district: i.district,
            neighborhood: i.neighborhood,
            branch_slug: i.branchId,
            delivery_enabled: i.enabled,
            fee_state: i.feeState,
            fee: i.fee,
            expected: i.expected && {
              branch_slug: i.expected.branchId,
              delivery_enabled: i.expected.enabled,
              fee_state: i.expected.feeState,
              fee: i.expected.fee,
            },
          })),
        },
      }),
    });
  } catch (err) {
    if (isMissing(err)) throw new AreasNotReadyError("table-missing");
    const msg = err instanceof SupabaseRestError ? (err.dbMessage ?? "") : "";
    if (msg === "conflict" || (err instanceof SupabaseRestError && err.code === "23505")) throw new AreaChangeRefusedError("conflict");
    if (msg === "forbidden") throw new AreaChangeRefusedError("forbidden");
    if (msg.startsWith("invalid") || (err instanceof SupabaseRestError && ["23503", "23514", "22P02"].includes(err.code ?? ""))) {
      throw new AreaChangeRefusedError("invalid");
    }
    throw err;
  }
  if (!Array.isArray(rows)) throw new Error("save_delivery_areas returned no rows");
  const good = usable(rows);
  register(good, "database");
  // the fee rows changed with them: the next fee lookup reads them fresh
  await refreshDeliveryFees();
  return good.map((r) => {
    const state: AreaFeeState = r.fee_state ?? "unset";
    const updatedAt = later(r.updated_at, r.fee_updated_at);
    return {
      ...toAssignment(r),
      key: r.area_key,
      feeState: state,
      fee: state === "paid" ? Number(r.fee) : state === "free" ? 0 : null,
      updatedBy: updatedAt === r.updated_at ? r.updated_by : (r.fee_updated_by ?? null),
      updatedAt,
    };
  });
}
