/**
 * The storefront catalog on the server (D45): the code products plus the
 * PUBLISHED products added in the panel, registered in `lib/data.ts` after
 * each read. Server-only.
 *
 * Same reading rules as the prices (§3 "Önbellek"):
 *   display (pages, search, availability) — a read reused for a few seconds in
 *     this process; if it fails, the last successful list stays;
 *   calculation (quote, order, cart re-pricing, admin price save) — read fresh;
 *     if it fails the caller answers 503, no older list is used.
 * Drafts and unpublished products are never read here: the storefront view
 * returns published rows only. Code products Merkez took off the site (D48)
 * are read along and left out of every storefront list.
 */

import { allCatalogProducts, hiddenProductIds, publishedProducts, setPublishedProducts, type PublishedProduct } from "../data";
import { displayPriceMap, priceRowsForDisplay, type PriceMap } from "../pricing/prices";
import { refreshProductPrices } from "../pricing/prices-server";
import { productStore, type StorefrontRow } from "./store";
import { productImageUrl } from "./storage";
import { readHiddenProducts } from "./visibility";

if (typeof window !== "undefined") {
  throw new Error("catalog/server.ts must never be imported on the client");
}

export const CATALOG_UNAVAILABLE_ERROR = "Ürün bilgileri şu an doğrulanamadı. Lütfen biraz sonra tekrar deneyin.";

/** The published list could not be read for a calculation — no older list is used. */
export class CatalogUnavailableError extends Error {
  constructor(detail: string) {
    super(`catalog unavailable — ${detail}`);
    this.name = "CatalogUnavailableError";
  }
}

/** How long a display read may be reused in this process (as for prices). */
export const CATALOG_DISPLAY_MAX_AGE_MS = 5_000;

const shared = globalThis as unknown as {
  __fundaCatalogReadAt?: number;
  __fundaCatalogInflight?: Promise<void>;
};

function toPublished(r: StorefrontRow): PublishedProduct {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    categorySlug: r.category_slug,
    shortDescription: r.short_description,
    imageUrl: r.image_path ? productImageUrl(r.image_path) : null,
    sizes: (r.sizes ?? []).map((s) => ({ key: s.key, price: Number(s.price) })),
    allergens: r.allergens,
    cakeMessage: r.cake_message,
    isNew: r.is_new,
    isBestSeller: r.is_best_seller,
    isGift: r.is_gift,
    branchStock: r.branch_stock ?? {},
    updatedAt: r.updated_at,
  };
}

async function load(): Promise<void> {
  // the published panel products and the code products off the site (D48), read together
  const [{ rows }, { hidden }] = await Promise.all([productStore.listPublished(), readHiddenProducts()]);
  setPublishedProducts(rows.map(toPublished), hidden);
  shared.__fundaCatalogReadAt = Date.now();
}

/**
 * Reads the published products and registers them.
 *   strict: a failed read throws `CatalogUnavailableError`.
 *   lenient (default): logged; the last registered list stays.
 * `maxAgeMs` lets display paths reuse a read that is a few seconds old;
 * concurrent display reads share one request.
 */
export async function refreshCatalog({ strict = false, maxAgeMs = 0 }: { strict?: boolean; maxAgeMs?: number } = {}): Promise<void> {
  const at = shared.__fundaCatalogReadAt;
  if (maxAgeMs > 0 && at !== undefined && Date.now() - at < maxAgeMs) return;
  let run: Promise<void> | undefined;
  try {
    if (maxAgeMs > 0 && shared.__fundaCatalogInflight) {
      await shared.__fundaCatalogInflight;
      return;
    }
    run = load();
    if (maxAgeMs > 0) shared.__fundaCatalogInflight = run;
    await run;
  } catch (err) {
    delete shared.__fundaCatalogReadAt;
    console.error("[catalog] published products could not be read", { error: (err as Error).message.slice(0, 200) });
    if (strict) throw new CatalogUnavailableError((err as Error).message.slice(0, 200));
  } finally {
    if (run && shared.__fundaCatalogInflight === run) delete shared.__fundaCatalogInflight;
  }
}

/** After a change in the panel: the next read in this process goes to the database. */
export function invalidateCatalog(): void {
  delete shared.__fundaCatalogReadAt;
}

/**
 * What a storefront page hands to the browser: current display prices and
 * the published products added in the panel — both read together, not one
 * after the other.
 */
export async function getStorefrontData(): Promise<{ prices: PriceMap; products: PublishedProduct[]; hidden: string[] }> {
  await Promise.all([
    refreshCatalog({ maxAgeMs: CATALOG_DISPLAY_MAX_AGE_MS }),
    refreshProductPrices({ maxAgeMs: CATALOG_DISPLAY_MAX_AGE_MS }),
  ]);
  return { prices: displayPriceMap(allCatalogProducts(), priceRowsForDisplay()), products: publishedProducts(), hidden: hiddenProductIds() };
}
