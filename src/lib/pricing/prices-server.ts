/**
 * Server-only bootstrap for product prices (SUPABASE_PLAN.md, D5; Aşama 4):
 * picks where they live, once per process, and offers `refreshProductPrices()`
 * plus the display price map for pages.
 *
 *   Supabase configured     -> table `product_prices` (migration 0009); while
 *                              the table does not exist yet no price can have
 *                              been stored, so catalog prices apply and saving
 *                              is refused
 *   serverless, no Supabase -> catalog prices only; saving is refused (503)
 *   otherwise (local dev)   -> JSON file under `.data/` (gitignored;
 *                              `PRODUCT_PRICES_FILE` points it elsewhere)
 *
 * Nothing is seeded: an empty table means every product sells at its catalog
 * price until Merkez changes it.
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { allCatalogProducts } from "../data";
import { SupabaseRestError, isSupabaseConfigured, supabaseRest } from "../supabase-server";
import {
  ProductPriceStoreError,
  displayPriceMap,
  priceRowsForDisplay,
  productPriceStoreKind,
  setProductPriceStore,
  syncProductPrices,
  type PriceMap,
  type ProductPriceRecord,
  type ProductPriceStore,
} from "./prices";

if (typeof window !== "undefined") {
  throw new Error("pricing/prices-server.ts must never be imported on the client");
}

type Row = { product_id: string; variant_key: string; price: number | string; updated_by: string | null; updated_at: string | null };

const toRecord = (r: Row): ProductPriceRecord => ({
  productId: r.product_id,
  variantKey: r.variant_key,
  price: Number(r.price),
  updatedBy: r.updated_by,
  updatedAt: r.updated_at,
});

const isMissingTable = (err: unknown) =>
  err instanceof SupabaseRestError && (err.status === 404 || err.code === "PGRST205" || err.code === "42P01");

class SupabaseProductPriceStore implements ProductPriceStore {
  readonly kind = "supabase" as const;

  async loadAll() {
    try {
      const rows = await supabaseRest<Row[]>("/product_prices?select=product_id,variant_key,price,updated_by,updated_at");
      return { rows: rows.map(toRecord) };
    } catch (err) {
      // the environment marker was checked first, so this is the right project without 0009
      if (isMissingTable(err)) return { rows: [], tableMissing: true };
      throw new ProductPriceStoreError("READ_FAILED", `product_prices read: ${(err as Error).message}`);
    }
  }

  async save(productId: string, variantKey: string, price: number, updatedBy: string): Promise<ProductPriceRecord> {
    try {
      const rows = await supabaseRest<Row[]>("/product_prices?on_conflict=product_id,variant_key", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify({ product_id: productId, variant_key: variantKey, price, updated_by: updatedBy }),
      });
      if (!rows[0]) throw new Error("no row returned");
      return toRecord(rows[0]);
    } catch (err) {
      if (isMissingTable(err)) throw new ProductPriceStoreError("TABLE_MISSING", "product_prices not found — apply migration 0009");
      throw new ProductPriceStoreError("WRITE_FAILED", `product_prices upsert: ${(err as Error).message}`);
    }
  }
}

class FileProductPriceStore implements ProductPriceStore {
  readonly kind = "file" as const;
  constructor(private readonly file: string) {}

  private read(): Record<string, ProductPriceRecord> {
    try {
      return JSON.parse(readFileSync(this.file, "utf8")) as Record<string, ProductPriceRecord>;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return {};
      throw new ProductPriceStoreError("READ_FAILED", `file ${this.file}: ${(err as Error).message}`);
    }
  }

  async loadAll() {
    return { rows: Object.values(this.read()) };
  }

  async save(productId: string, variantKey: string, price: number, updatedBy: string) {
    try {
      const all = this.read();
      const record: ProductPriceRecord = { productId, variantKey, price, updatedBy, updatedAt: new Date().toISOString() };
      all[`${productId}|${variantKey}`] = record;
      mkdirSync(dirname(this.file), { recursive: true });
      const tmp = `${this.file}.${process.pid}.tmp`;
      writeFileSync(tmp, JSON.stringify(all, null, 2));
      renameSync(tmp, this.file); // atomic
      return record;
    } catch (err) {
      throw new ProductPriceStoreError("WRITE_FAILED", `file ${this.file}: ${(err as NodeJS.ErrnoException).code ?? (err as Error).message}`);
    }
  }
}

/** Serverless without Supabase: nothing can be stored, so the catalog prices are the prices. */
class CatalogOnlyProductPriceStore implements ProductPriceStore {
  readonly kind = "catalog-only" as const;
  async loadAll() {
    return { rows: [] };
  }
  async save(): Promise<ProductPriceRecord> {
    throw new ProductPriceStoreError("NOT_CONFIGURED", "serverless deployment without Supabase — prices cannot be saved");
  }
}

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

setProductPriceStore(
  isSupabaseConfigured()
    ? new SupabaseProductPriceStore()
    : isServerless
      ? new CatalogOnlyProductPriceStore()
      : new FileProductPriceStore(process.env.PRODUCT_PRICES_FILE || join(process.cwd(), ".data", "product-prices.json")),
);

/** How long a display read may be reused in this process (quotes and orders always read fresh). */
const DISPLAY_MAX_AGE_MS = 5_000;

/**
 * Loads the stored prices.
 *   strict: a failed read is rethrown (quote, order, cart re-pricing, admin).
 *   lenient (default): logged; display keeps the last successful read.
 */
export async function refreshProductPrices({ strict = false, maxAgeMs = 0 }: { strict?: boolean; maxAgeMs?: number } = {}): Promise<void> {
  try {
    await syncProductPrices({ maxAgeMs });
  } catch (err) {
    const code = err instanceof ProductPriceStoreError ? err.code : "UNKNOWN";
    console.error(`[prices] read failed code=${code} store=${productPriceStoreKind()}`, { error: (err as Error).message });
    if (strict) throw err;
  }
}

/** The current prices pages hand to the browser (display reading, a few seconds fresh). */
export async function getDisplayPriceMap(): Promise<PriceMap> {
  await refreshProductPrices({ maxAgeMs: DISPLAY_MAX_AGE_MS });
  // the whole storefront catalog: code products + published panel products (D45)
  return displayPriceMap(allCatalogProducts(), priceRowsForDisplay());
}
