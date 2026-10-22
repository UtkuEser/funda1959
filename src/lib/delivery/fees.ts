/**
 * Delivery fees per zone (SUPABASE_PLAN.md, D15) — what the server knows.
 * Since D50 (migration 0015) every neighbourhood is its own zone: its fee row
 * is keyed by the area's `zoneId` ('area-…'); before 0015 the old zones' rows
 * are used. Merkez edits them on "Teslimat Bölgeleri" (`save_delivery_areas`).
 *
 * Three states, never mixed up:
 *   unset — Merkez has not set a fee (also: no row at all) -> no delivery
 *   paid  — a fee > 0, kuruş allowed
 *   free  — explicitly free (fee 0) — only ever by an explicit choice
 * An empty value or a missing row is NOT free.
 *
 * The server registers a store once (`./fees-server.ts`) and every entry
 * point that computes availability, a quote or an order calls
 * `refreshDeliveryFees()` first. A failed read does not fall back to older
 * values: the cache becomes "unavailable" and delivery answers
 * DELIVERY_INFO_UNAVAILABLE until a read succeeds again.
 *
 * Client-safe (types only are used in the browser; no fs, no secrets).
 */

import type { ReasonCode } from "../availability/reasons";

export type DeliveryFeeState = "unset" | "paid" | "free";

export type ZoneFeeRecord = {
  zoneId: string;
  state: DeliveryFeeState;
  /** paid: > 0 · free: 0 · unset: null */
  fee: number | null;
  /** admin display name of the last editor */
  updatedBy: string | null;
  updatedAt: string | null;
};

export type ZoneFeeLookup =
  | { kind: "unavailable" }
  | { kind: "unset" }
  | { kind: "paid"; fee: number }
  | { kind: "free" };

/** POST /api/delivery-fee — the fee the cart and checkout show for an address */
export type DeliveryFeeAnswer =
  | { ok: true; state: "paid" | "free"; fee: number; zoneId: string; branchName: string }
  | { ok: false; reason: ReasonCode | null; error: string };

export interface DeliveryFeeStore {
  /** for logs only */
  readonly kind: "supabase" | "file" | "unavailable" | "memory";
  loadAll(): Promise<ZoneFeeRecord[]>;
  save(zoneId: string, state: DeliveryFeeState, fee: number | null, updatedBy: string): Promise<ZoneFeeRecord>;
}

export class DeliveryFeeStoreError extends Error {
  constructor(
    readonly code: "NOT_CONFIGURED" | "READ_FAILED" | "WRITE_FAILED",
    message: string,
  ) {
    super(message);
    this.name = "DeliveryFeeStoreError";
  }
}

type FeeCache =
  | { status: "ok"; at: number; fees: Map<string, ZoneFeeRecord> }
  | { status: "unavailable"; at: number };

const shared = globalThis as unknown as {
  __fundaFeeStore?: DeliveryFeeStore;
  __fundaFeeCache?: FeeCache;
};

/** Registers the durable store (once per process). */
export function setDeliveryFeeStore(store: DeliveryFeeStore): void {
  if (shared.__fundaFeeStore) return;
  shared.__fundaFeeStore = store;
  delete shared.__fundaFeeCache;
}

export function deliveryFeeStoreKind(): DeliveryFeeStore["kind"] | null {
  return shared.__fundaFeeStore?.kind ?? null;
}

/**
 * Loads every zone's fee. `maxAgeMs` lets the availability endpoint reuse a
 * read that is a couple of seconds old; quotes and orders pass 0 (always
 * fresh). On failure the cache is marked unavailable and the error rethrown.
 */
export async function syncDeliveryFees({ maxAgeMs = 0 }: { maxAgeMs?: number } = {}): Promise<void> {
  const store = shared.__fundaFeeStore;
  const cached = shared.__fundaFeeCache;
  if (maxAgeMs > 0 && cached?.status === "ok" && Date.now() - cached.at < maxAgeMs) return;
  if (!store) {
    shared.__fundaFeeCache = { status: "unavailable", at: Date.now() };
    throw new DeliveryFeeStoreError("NOT_CONFIGURED", "no delivery fee store registered");
  }
  try {
    const rows = await store.loadAll();
    shared.__fundaFeeCache = { status: "ok", at: Date.now(), fees: new Map(rows.map((r) => [r.zoneId, r])) };
  } catch (err) {
    shared.__fundaFeeCache = { status: "unavailable", at: Date.now() };
    throw err;
  }
}

/** The fee for a zone as of the last successful read — or "unavailable". */
export function deliveryFeeFor(zoneId: string): ZoneFeeLookup {
  const cached = shared.__fundaFeeCache;
  if (!cached || cached.status !== "ok") return { kind: "unavailable" };
  const r = cached.fees.get(zoneId);
  if (!r || r.state === "unset") return { kind: "unset" };
  if (r.state === "free") return { kind: "free" };
  return r.fee !== null && r.fee > 0 ? { kind: "paid", fee: r.fee } : { kind: "unset" };
}

/** Every stored record (zones without a row are "unset"), or null while unavailable. */
export function readDeliveryFeeRecords(): ZoneFeeRecord[] | null {
  const cached = shared.__fundaFeeCache;
  return cached?.status === "ok" ? [...cached.fees.values()] : null;
}

/** Writes through the store; the cache changes only after the store confirmed. */
export async function saveDeliveryFee(
  zoneId: string,
  state: DeliveryFeeState,
  fee: number | null,
  updatedBy: string,
): Promise<ZoneFeeRecord> {
  const store = shared.__fundaFeeStore;
  if (!store) throw new DeliveryFeeStoreError("NOT_CONFIGURED", "no delivery fee store registered");
  const saved = await store.save(zoneId, state, fee, updatedBy);
  const cached = shared.__fundaFeeCache;
  if (cached?.status === "ok") cached.fees.set(zoneId, saved);
  return saved;
}

/** "Belirlenmedi" / "Ücretsiz" / the amount — admin and checkout wording. */
export function describeFeeState(state: DeliveryFeeState): string {
  return state === "unset" ? "Belirlenmedi" : state === "free" ? "Ücretsiz" : "Ücretli";
}
