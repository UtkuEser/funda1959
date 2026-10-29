import { NextResponse } from "next/server";
import { refreshCatalog } from "@/lib/catalog/server";
import { refreshInventory } from "@/lib/inventory/server-init";
import { refreshDeliveryFees } from "@/lib/delivery/fees-server";
import { refreshDeliveryAreas } from "@/lib/delivery/areas-server";
import { refreshProductPrices } from "@/lib/pricing/prices-server";
import { getProductAvailability, toDeliveryContext, type DeliveryContext } from "@/lib/availability";
import { allCatalogProducts } from "@/lib/data";
import { applyPrice, displayPriceMap, priceRowsForDisplay, pricedSizes } from "@/lib/pricing/prices";
import { getQuickOrderMode } from "@/lib/quick-order-utils";
import { SUGGESTION_LIMIT, suggestionCandidates, type CartSuggestion } from "@/lib/cart-suggestions";

export const dynamic = "force-dynamic";

const MAX_ITEMS = 50;

type Body = {
  context?: Partial<DeliveryContext>;
  /** the cart's shipping day (`cartDeliveryPlan`) */
  date?: string;
  items?: { productId?: unknown }[];
};

/**
 * POST { context, date, items: [{ productId }] } -> { suggestions } — the
 * "Siparişinize eşlik etsin" products for a cart (/sepet, /checkout) in one
 * round trip: the reads it needs run together (the published catalog and the
 * products off the site, prices, the branch stock statuses, delivery fees and
 * areas — the same display readings as /api/availability, so the page's own
 * concurrent checks share them), then the pairings (`lib/cart-suggestions`)
 * are kept only where the engine says the branch can prepare the product on
 * the cart's day, at most four, each with its current price and sizes.
 * Adding one is checked again (POST /api/availability, kind "cart").
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  const items = (Array.isArray(body.items) ? body.items : [])
    .slice(0, MAX_ITEMS)
    .flatMap((i) => (typeof i?.productId === "string" ? [{ productId: i.productId }] : []));
  const date = typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : null;
  if (items.length === 0 || !date) return NextResponse.json({ suggestions: [] });

  // all lenient (they log, never throw) and independent — fetched together, reused for 2 s like /api/availability
  await Promise.all([
    refreshCatalog({ maxAgeMs: 2000 }),
    refreshInventory({ maxAgeMs: 2000 }),
    refreshDeliveryFees({ maxAgeMs: 2000 }),
    refreshDeliveryAreas({ maxAgeMs: 2000 }),
    refreshProductPrices({ maxAgeMs: 2000 }),
  ]);

  const context = toDeliveryContext(body.context);
  const pool = suggestionCandidates(items, allCatalogProducts());
  const prices = displayPriceMap(pool, priceRowsForDisplay());
  const suggestions: CartSuggestion[] = [];
  for (const candidate of pool) {
    if (suggestions.length >= SUGGESTION_LIMIT) break;
    // the same verdict the cart gets: the branch carries it, its stock that day, open windows (fees and area for delivery)
    if (!getProductAvailability({ productId: candidate.id, quantity: 1, context, date }).available) continue;
    const p = applyPrice(candidate, prices);
    const mode = getQuickOrderMode(p);
    if (mode.kind === "detailed") continue;
    suggestions.push({
      id: p.id,
      slug: p.slug,
      name: p.name,
      categoryName: p.categoryName,
      image: p.image,
      gradient: p.gradient,
      price: p.priceValue,
      displayPrice: p.displayPrice,
      sizeLabel: mode.kind === "variant" ? mode.label : null,
      sizes: mode.kind === "variant" ? pricedSizes(p.id, mode.variants, prices).map((s) => ({ id: s.id, label: s.label, price: s.price })) : [],
    });
  }
  return NextResponse.json({ suggestions }, { headers: { "Cache-Control": "no-store" } });
}
