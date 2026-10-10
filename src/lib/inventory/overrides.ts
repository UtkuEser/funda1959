/**
 * Inventory overrides — what the ops panel (Şube Stokları) writes.
 *
 * `deriveBranchProduct()` produces the seed values; edits are stored here and
 * merged on every read, so the Availability Engine — server routes and the
 * admin panel alike — sees them. The map lives on `globalThis` so a Route
 * Handler and a Server Component in the same process share one copy.
 *
 * Durability: this module is client-safe (no fs, no secrets). The server
 * registers a store once (`inventory/server-init.ts`):
 *   - Supabase table `branch_product_status` when Supabase is configured
 *     (production — serverless instances share nothing but the database);
 *   - a JSON file for local development;
 *   - "unavailable" on a serverless host without a database: reads fall back
 *     to the seed, writes FAIL — a change is never reported as saved when it
 *     wasn't.
 * Server entry points call `syncInventoryOverrides()` before reading, so a
 * change saved by one instance is what every other instance serves.
 * The in-memory map only ever holds what the store confirmed.
 */

/** Branch-level stock availability — independent of the product's general publish status. */
export type BranchStockStatus = "active" | "passive";

export type InventoryOverride = {
  /** current model: branch-level availability, set in the ops panel */
  status?: BranchStockStatus;
  /** legacy fields from the quantity model — kept as data, no longer drive availability */
  active?: boolean;
  stockQuantity?: number;
  dailyCapacity?: number;
  updatedAt: number;
  /** who changed `status` last (admin display name) */
  updatedBy?: string;
};

/** One branch + product stock decision, as written by the ops panel. */
export type StockStatusWrite = { productId: string; active: boolean };

export interface InventoryStore {
  /** for logs only */
  readonly kind: "supabase" | "file" | "unavailable";
  /** every saved override, keyed `${branchId}:${productId}` */
  loadAll(): Promise<Record<string, InventoryOverride>>;
  /** all-or-nothing write of one branch's rows; rejects on any failure */
  saveStatuses(branchId: string, rows: StockStatusWrite[], updatedBy: string): Promise<void>;
}

/** The store refused or could not be reached — `code` is for logs, never shown to customers. */
export class InventoryStoreError extends Error {
  constructor(
    readonly code: "NOT_CONFIGURED" | "WRITE_FAILED" | "READ_FAILED",
    message: string,
  ) {
    super(message);
    this.name = "InventoryStoreError";
  }
}

const shared = globalThis as unknown as {
  __fundaInventoryOverrides?: Map<string, InventoryOverride>;
  __fundaInventoryStore?: InventoryStore;
  __fundaInventorySyncedAt?: number;
};
shared.__fundaInventoryOverrides ??= new Map<string, InventoryOverride>();
const map = shared.__fundaInventoryOverrides;

const key = (branchId: string, productId: string) => `${branchId}:${productId}`;

/** Registers the durable store (once per process). */
export function setInventoryStore(store: InventoryStore): void {
  if (shared.__fundaInventoryStore) return;
  shared.__fundaInventoryStore = store;
  shared.__fundaInventorySyncedAt = 0;
}

export function inventoryStoreKind(): InventoryStore["kind"] | null {
  return shared.__fundaInventoryStore?.kind ?? null;
}

/**
 * Pulls the saved overrides into memory. `maxAgeMs` lets hot customer paths
 * reuse a very recent read; the ops panel passes 0 (always fresh). A failed
 * read keeps the last known values and is rethrown for the caller to log.
 */
export async function syncInventoryOverrides({ maxAgeMs = 0 }: { maxAgeMs?: number } = {}): Promise<void> {
  const store = shared.__fundaInventoryStore;
  if (!store) return;
  if (maxAgeMs > 0 && Date.now() - (shared.__fundaInventorySyncedAt ?? 0) < maxAgeMs) return;
  const saved = await store.loadAll();
  for (const [k, v] of Object.entries(saved)) map.set(k, { ...map.get(k), ...v });
  shared.__fundaInventorySyncedAt = Date.now();
}

/**
 * Saves branch stock decisions. The store is written first; memory changes
 * only after it confirmed, so a failure leaves everything as it was.
 */
export async function saveInventoryStatuses(branchId: string, rows: StockStatusWrite[], updatedBy: string): Promise<void> {
  const store = shared.__fundaInventoryStore;
  if (!store) throw new InventoryStoreError("NOT_CONFIGURED", "no inventory store registered");
  await store.saveStatuses(branchId, rows, updatedBy);
  const now = Date.now();
  for (const r of rows) {
    const k = key(branchId, r.productId);
    map.set(k, { ...map.get(k), status: r.active ? "active" : "passive", updatedAt: now, updatedBy });
  }
}

export function getInventoryOverride(branchId: string, productId: string): InventoryOverride | null {
  return map.get(key(branchId, productId)) ?? null;
}

export function allInventoryOverrides(): {
  branchId: string;
  productId: string;
  override: InventoryOverride;
}[] {
  return [...map.entries()].map(([k, override]) => {
    const [branchId, productId] = k.split(":");
    return { branchId, productId, override };
  });
}
