/**
 * Product prices (SUPABASE_PLAN.md, D5; Aşama 4) — what the server knows.
 *
 * The catalog (products, sizes, content, images) stays in code; the database
 * holds only the prices Merkez set (`product_prices`, migration 0009): one row
 * per price — `variant_key` is the size id ("1kg", "12", "4-6", …) for a
 * product with sizes, `''` for a single-price product (D20). Every size is
 * priced on its own, no multiplier; a price without a row is the catalog's
 * starting value (`lib/data.ts`). Rows for sizes a product doesn't have are
 * ignored. A struck-through old price is catalog content (D18, D21).
 *
 * Two readings of the same cache:
 *   calculation (quote, order, cart re-pricing) — the last read must have
 *     succeeded, otherwise `null` and the caller answers 503;
 *   display (catalog, PDP, search, quick order) — the last successful read in
 *     this server process, else catalog prices (§9 A21).
 *
 * Client-safe (no fs, no secrets): the browser uses the pure helpers.
 */
import { productSizes, type CatalogProduct, type ProductDetail, type ProductVariant } from "../data";
import { formatTL } from "../cart-utils";

export type ProductPriceRecord = {
  productId: string;
  /** size id, or '' for a single-price product */
  variantKey: string;
  price: number;
  /** admin display name of the last editor */
  updatedBy: string | null;
  updatedAt: string | null;
};

/** sanity bound for an entered price, TL */
export const MAX_PRODUCT_PRICE = 100_000;

/** `${productId}|${variantKey}` -> current price, for every stored price in effect (sent to the browser) */
export type PriceMap = Record<string, number>;

export const priceKey = (productId: string, variantKey = "") => `${productId}|${variantKey}`;

export interface ProductPriceStore {
  /** for logs only */
  readonly kind: "supabase" | "file" | "catalog-only" | "memory";
  /** `tableMissing`: migration 0009 not applied — no price can have been stored */
  loadAll(): Promise<{ rows: ProductPriceRecord[]; tableMissing?: boolean }>;
  save(productId: string, variantKey: string, price: number, updatedBy: string): Promise<ProductPriceRecord>;
}

export class ProductPriceStoreError extends Error {
  constructor(
    readonly code: "NOT_CONFIGURED" | "READ_FAILED" | "WRITE_FAILED" | "TABLE_MISSING",
    message: string,
  ) {
    super(message);
    this.name = "ProductPriceStoreError";
  }
}

type PriceCache =
  | { status: "ok"; at: number; rows: Map<string, ProductPriceRecord>; tableMissing: boolean }
  | { status: "unavailable"; at: number };

const shared = globalThis as unknown as {
  __fundaPriceStore?: ProductPriceStore;
  __fundaPriceCache?: PriceCache;
  /** rows of the last successful read — display only */
  __fundaPriceLastOk?: Map<string, ProductPriceRecord>;
};

/* -------------------------------------------------------------------------- */
/* Store + cache (server)                                                      */
/* -------------------------------------------------------------------------- */

/** Registers the durable store (once per process). */
export function setProductPriceStore(store: ProductPriceStore): void {
  if (shared.__fundaPriceStore) return;
  shared.__fundaPriceStore = store;
  delete shared.__fundaPriceCache;
  delete shared.__fundaPriceLastOk;
}

export function productPriceStoreKind(): ProductPriceStore["kind"] | null {
  return shared.__fundaPriceStore?.kind ?? null;
}

/**
 * Loads every stored price. `maxAgeMs` lets display paths reuse a read that
 * is a few seconds old; quotes, orders and the admin screen pass 0. On
 * failure the cache is marked unavailable and the error rethrown.
 */
export async function syncProductPrices({ maxAgeMs = 0 }: { maxAgeMs?: number } = {}): Promise<void> {
  const store = shared.__fundaPriceStore;
  const cached = shared.__fundaPriceCache;
  if (maxAgeMs > 0 && cached?.status === "ok" && Date.now() - cached.at < maxAgeMs) return;
  if (!store) {
    shared.__fundaPriceCache = { status: "unavailable", at: Date.now() };
    throw new ProductPriceStoreError("NOT_CONFIGURED", "no product price store registered");
  }
  try {
    const { rows, tableMissing = false } = await store.loadAll();
    const map = new Map(rows.map((r) => [priceKey(r.productId, r.variantKey), r]));
    shared.__fundaPriceCache = { status: "ok", at: Date.now(), rows: map, tableMissing };
    shared.__fundaPriceLastOk = map;
  } catch (err) {
    shared.__fundaPriceCache = { status: "unavailable", at: Date.now() };
    throw err;
  }
}

/** Stored prices for a quote / order / cart re-pricing — `null` unless the last read succeeded. */
export function priceRowsForCalculation(): Map<string, ProductPriceRecord> | null {
  const cached = shared.__fundaPriceCache;
  return cached?.status === "ok" ? cached.rows : null;
}

/** Stored prices for display — the last successful read, else none (catalog prices). */
export function priceRowsForDisplay(): Map<string, ProductPriceRecord> {
  const cached = shared.__fundaPriceCache;
  if (cached?.status === "ok") return cached.rows;
  return shared.__fundaPriceLastOk ?? new Map();
}

/** true when the last read found no `product_prices` table (0009 not applied) */
export function productPriceTableMissing(): boolean {
  const cached = shared.__fundaPriceCache;
  return cached?.status === "ok" && cached.tableMissing;
}

/** Every stored row (admin screen), or null while unavailable. */
export function readProductPriceRecords(): ProductPriceRecord[] | null {
  const rows = priceRowsForCalculation();
  return rows ? [...rows.values()] : null;
}

/** Writes through the store; the cache changes only after the store confirmed. */
export async function saveProductPrice(productId: string, variantKey: string, price: number, updatedBy: string): Promise<ProductPriceRecord> {
  const store = shared.__fundaPriceStore;
  if (!store) throw new ProductPriceStoreError("NOT_CONFIGURED", "no product price store registered");
  const saved = await store.save(productId, variantKey, price, updatedBy);
  const cached = shared.__fundaPriceCache;
  if (cached?.status === "ok") cached.rows.set(priceKey(saved.productId, saved.variantKey), saved);
  shared.__fundaPriceLastOk?.set(priceKey(saved.productId, saved.variantKey), saved);
  return saved;
}

/* -------------------------------------------------------------------------- */
/* Pricing rules (pure)                                                        */
/* -------------------------------------------------------------------------- */

/** Whether `variantKey` names one of the product's prices: a size it has, or '' for a single-price product. */
export function isPriceKeyOf(product: Pick<CatalogProduct, "id">, variantKey: string): boolean {
  const sizes = productSizes(product);
  return sizes.length > 0 ? sizes.some((s) => s.id === variantKey) : variantKey === "";
}

/** The stored row in effect for one of the product's prices, or null (catalog price). */
export function storedPriceFor(
  product: Pick<CatalogProduct, "id">,
  variantKey: string,
  rows: Map<string, ProductPriceRecord>,
): ProductPriceRecord | null {
  return isPriceKeyOf(product, variantKey) ? rows.get(priceKey(product.id, variantKey)) ?? null : null;
}

/** A product's sizes with their current prices (stored, else catalog), smallest first. */
export function currentSizes(product: Pick<CatalogProduct, "id">, rows: Map<string, ProductPriceRecord>): ProductVariant[] {
  return productSizes(product).map((s) => {
    const stored = rows.get(priceKey(product.id, s.id));
    return stored ? { ...s, price: stored.price } : s;
  });
}

/** The price a card shows: the single price, or the smallest size's (D16). */
export function effectivePriceValue(product: CatalogProduct, rows: Map<string, ProductPriceRecord>): number {
  const sizes = currentSizes(product, rows);
  if (sizes.length > 0) return sizes[0].price;
  return rows.get(priceKey(product.id, ""))?.price ?? product.priceValue;
}

/**
 * Unit price of a cart / order line: a product with sizes is priced only for
 * one of its sizes, a single-price product only without one; else null.
 */
export function effectiveUnitPrice(
  product: CatalogProduct,
  variantId: string | null | undefined,
  rows: Map<string, ProductPriceRecord>,
): number | null {
  const sizes = currentSizes(product, rows);
  if (sizes.length === 0) return variantId ? null : rows.get(priceKey(product.id, ""))?.price ?? product.priceValue;
  return sizes.find((s) => s.id === variantId)?.price ?? null;
}

/** " / adet", " / kg" — the unit written after the amount in the catalog label, if any */
export function catalogPriceSuffix(product: Pick<CatalogProduct, "price">): string {
  return product.price?.replace(/^₺\s*[\d.,]+/, "") ?? "";
}

/** "₺49,90 / adet" — the card label for a price, keeping the catalog's unit */
export function priceLabel(product: Pick<CatalogProduct, "price">, price: number): string {
  return `${formatTL(price)}${catalogPriceSuffix(product)}`;
}

/** The stored prices the browser needs (only those in effect). */
export function displayPriceMap(products: CatalogProduct[], rows: Map<string, ProductPriceRecord>): PriceMap {
  const map: PriceMap = {};
  for (const p of products) {
    const sizes = productSizes(p);
    for (const variantKey of sizes.length > 0 ? sizes.map((s) => s.id) : [""]) {
      const stored = rows.get(priceKey(p.id, variantKey));
      if (stored) map[priceKey(p.id, variantKey)] = stored.price;
    }
  }
  return map;
}

/** Sizes with the map's prices (detail page, quick order). */
export function pricedSizes(productId: string, sizes: ProductVariant[], map: PriceMap | null | undefined): ProductVariant[] {
  if (!map) return sizes;
  return sizes.map((s) => {
    const price = map[priceKey(productId, s.id)];
    return price === undefined || price === s.price ? s : { ...s, price };
  });
}

/** The product with its current card price (idempotent; unchanged when the map has no entry). */
export function applyPrice<T extends CatalogProduct>(product: T, map: PriceMap | null | undefined): T {
  if (!map) return product;
  const smallest = productSizes(product)[0];
  if (smallest) {
    const price = map[priceKey(product.id, smallest.id)];
    if (price === undefined || price === product.cardPrice) return product;
    return { ...product, cardPrice: price, displayPrice: formatTL(price) };
  }
  const price = map[priceKey(product.id, "")];
  if (price === undefined || price === product.priceValue) return product;
  return { ...product, priceValue: price, cardPrice: price, displayPrice: priceLabel(product, price) };
}

/** The detail page's product with its current prices, related products included. */
export function applyPriceToDetail(detail: ProductDetail, map: PriceMap): ProductDetail {
  const priced = applyPrice(detail, map);
  return {
    ...priced,
    basePrice: detail.variants.length > 0 ? detail.basePrice : priced.priceValue,
    variants: pricedSizes(detail.id, detail.variants, map),
    relatedProducts: detail.relatedProducts.map((p) => applyPrice(p, map)),
  };
}
