/**
 * Inventory overrides — the demo-persistent layer the ops panel writes to.
 *
 * `deriveBranchProduct()` produces the seed values; edits from
 * /admin (Şube Stokları) are stored here and merged on every read, so the
 * Availability Engine — server routes and the admin panel alike — sees the new
 * numbers immediately. Kept on `globalThis` so a Route Handler and a Server
 * Component in the same process share one store (same pattern as
 * reservations / orders).
 *
 * When Supabase lands this becomes an `branch_products` update; the merge in
 * `inventory/index.ts` and every caller stay the same.
 */

export type InventoryOverride = {
  active?: boolean;
  stockQuantity?: number;
  dailyCapacity?: number;
  updatedAt: number;
};

const store = globalThis as unknown as {
  __fundaInventoryOverrides?: Map<string, InventoryOverride>;
};
store.__fundaInventoryOverrides ??= new Map<string, InventoryOverride>();
const map = store.__fundaInventoryOverrides;

const key = (branchId: string, productId: string) => `${branchId}:${productId}`;

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
  return next;
}

export function clearInventoryOverride(branchId: string, productId: string): void {
  map.delete(key(branchId, productId));
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
