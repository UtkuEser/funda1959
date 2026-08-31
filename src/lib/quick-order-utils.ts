/**
 * Quick-order funnel helper.
 *
 * Decides, per product, how the /hizli-siparis row should behave — without any
 * per-product hard-coding. Everything is derived from the existing data model
 * (`canQuickAddToCart`, `getProductDetail`, `variantKind`, the shared
 * serving/weight/pack buckets), so pricing stays identical to the product
 * detail page.
 *
 *   simple   → single price, just quantity + "Sepete Ekle"
 *   variant  → inline serving / weight / pack chips, live price, then add
 *   detailed → real personalisation needed → link to /urunler/{slug}
 */

import {
  canQuickAddToCart,
  getProductDetail,
  type CatalogProduct,
  type ProductVariant,
  type VariantKind,
} from "./data";

export type QuickOrderMode =
  | { kind: "simple" }
  | {
      kind: "variant";
      variantKind: Exclude<VariantKind, "none">;
      variants: ProductVariant[];
      /** chip group label, e.g. "Gramaj" */
      label: string;
    }
  | { kind: "detailed" };

const VARIANT_LABEL: Record<Exclude<VariantKind, "none">, string> = {
  serving: "Kişi sayısı",
  weight: "Gramaj",
  pack: "Paket",
};

export function getQuickOrderMode(product: CatalogProduct): QuickOrderMode {
  // 1. Genuinely simple, single-price product.
  if (canQuickAddToCart(product)) return { kind: "simple" };

  // 2. Mandatory personalisation (cake message, bespoke design) — keep it a
  //    detailed order rather than faking an inline flow.
  if (product.customizable) return { kind: "detailed" };

  // 3. Priced variant model (serving / weight / pack) → inline chips.
  const detail = getProductDetail(product.slug);
  if (detail && detail.variantKind !== "none" && detail.variants.length > 0) {
    return {
      kind: "variant",
      variantKind: detail.variantKind,
      variants: detail.variants,
      label: VARIANT_LABEL[detail.variantKind],
    };
  }

  // 4. No usable priced-variant model — fall back to the detail page.
  return { kind: "detailed" };
}
