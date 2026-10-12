/**
 * In-memory product-price store for the verify-* scripts. Registered before
 * anything else picks a store, so a script never reads or writes the real
 * `product_prices` table or the local `.data/product-prices.json`. Prices set
 * here are TEST FIXTURES, not approved prices (SUPABASE_PLAN.md D5).
 */
import {
  ProductPriceStoreError,
  setProductPriceStore,
  syncProductPrices,
  type ProductPriceRecord,
} from "@/lib/pricing/prices";

export function installMemoryPriceStore() {
  const rows = new Map<string, ProductPriceRecord>();
  let failing = false;
  let tableMissing = false;
  setProductPriceStore({
    kind: "memory",
    async loadAll() {
      if (failing) throw new ProductPriceStoreError("READ_FAILED", "simulated outage");
      return tableMissing ? { rows: [], tableMissing: true } : { rows: [...rows.values()] };
    },
    async save(productId, variantKey, price, updatedBy) {
      if (failing) throw new ProductPriceStoreError("WRITE_FAILED", "simulated outage");
      const record: ProductPriceRecord = { productId, variantKey, price, updatedBy, updatedAt: new Date().toISOString() };
      rows.set(`${productId}|${variantKey}`, record);
      return record;
    },
  });
  return {
    /** first read (nothing stored: catalog prices) — await before pricing anything */
    ready: syncProductPrices(),
    /** stores a row and re-reads, like an admin save followed by the next request */
    async set(productId: string, price: number, variantKey = "") {
      rows.set(`${productId}|${variantKey}`, { productId, variantKey, price, updatedBy: "test", updatedAt: new Date().toISOString() });
      await syncProductPrices();
    },
    /** makes every read / write fail until reset; the next sync marks prices unavailable */
    async fail(on: boolean) {
      failing = on;
      await syncProductPrices().catch(() => undefined);
    },
    /** simulates a project where 0009 has not been applied */
    async missingTable(on: boolean) {
      tableMissing = on;
      await syncProductPrices();
    },
  };
}
