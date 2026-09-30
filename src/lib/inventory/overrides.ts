/**
 * Inventory overrides — what the ops panel (Şube Stokları) writes.
 *
 * `deriveBranchProduct()` produces the seed values; edits are stored here and
 * merged on every read, so the Availability Engine — server routes and the
 * admin panel alike — sees them immediately. The map lives on `globalThis` so
 * a Route Handler and a Server Component in the same process share one store.
 *
 * Durability: this module is client-safe (no fs). The server registers a
 * persistence adapter once (`inventory/server-init.ts`), which loads saved
 * overrides into the map and receives every change. When Supabase lands the
 * adapter becomes a `branch_products` table; callers stay the same.
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

export type OverridePersistence = {
  load(): Record<string, InventoryOverride>;
  save(all: Record<string, InventoryOverride>): void;
};

const store = globalThis as unknown as {
  __fundaInventoryOverrides?: Map<string, InventoryOverride>;
  __fundaInventoryPersistence?: OverridePersistence;
};
store.__fundaInventoryOverrides ??= new Map<string, InventoryOverride>();
const map = store.__fundaInventoryOverrides;

const key = (branchId: string, productId: string) => `${branchId}:${productId}`;

/**
 * Registers durable storage once per process: saved entries are merged into
 * the in-memory map (saved values win), then every change is written back.
 */
export function setOverridePersistence(adapter: OverridePersistence): void {
  if (store.__fundaInventoryPersistence) return;
  store.__fundaInventoryPersistence = adapter;
  const saved = adapter.load();
  for (const [k, v] of Object.entries(saved)) map.set(k, { ...map.get(k), ...v });
  if (map.size > Object.keys(saved).length) persist();
}

function persist(): void {
  store.__fundaInventoryPersistence?.save(Object.fromEntries(map));
}

export function getInventoryOverride(branchId: string, productId: string): InventoryOverride | null {
  return map.get(key(branchId, productId)) ?? null;
}

export function setInventoryOverride(
  branchId: string,
  productId: string,
  patch: Partial<Omit<InventoryOverride, "updatedAt">>,
): InventoryOverride {
  const current = map.get(key(branchId, productId));
  const next: InventoryOverride = { ...current, ...patch, updatedAt: Date.now() };
  map.set(key(branchId, productId), next);
  persist();
  return next;
}

/** Several rows in one write — the whole batch lands or none of it is saved. */
export function setInventoryOverrides(
  branchId: string,
  patches: { productId: string; patch: Partial<Omit<InventoryOverride, "updatedAt">> }[],
): void {
  const before = new Map(map);
  try {
    const now = Date.now();
    for (const { productId, patch } of patches) {
      map.set(key(branchId, productId), { ...map.get(key(branchId, productId)), ...patch, updatedAt: now });
    }
    persist();
  } catch (err) {
    map.clear();
    for (const [k, v] of before) map.set(k, v);
    throw err;
  }
}

export function clearInventoryOverride(branchId: string, productId: string): void {
  map.delete(key(branchId, productId));
  persist();
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
