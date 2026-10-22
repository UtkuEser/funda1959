import { NextResponse } from "next/server";
import { allCatalogProducts, hiddenProductIds, publishedProducts } from "@/lib/data";
import { CATALOG_DISPLAY_MAX_AGE_MS, CATALOG_UNAVAILABLE_ERROR, refreshCatalog } from "@/lib/catalog/server";
import { effectiveUnitPrice, priceRowsForCalculation } from "@/lib/pricing/prices";
import { getDisplayPriceMap, refreshProductPrices } from "@/lib/pricing/prices-server";
import { PRICES_UNAVAILABLE_ERROR } from "@/lib/order-server";

export const dynamic = "force-dynamic";

const MAX_LINES = 50;

/**
 * GET — the stored prices in effect (`{ prices: { "productId|sizeId": price } }`,
 * '' after the bar for a single price), for the header search, which builds
 * its results in the browser. Display reading: a few seconds fresh.
 */
export async function GET() {
  // the published panel products (D45) too: the search builds its list in the browser
  await refreshCatalog({ maxAgeMs: CATALOG_DISPLAY_MAX_AGE_MS });
  const prices = await getDisplayPriceMap();
  return NextResponse.json({ prices, products: publishedProducts(), hidden: hiddenProductIds() }, { headers: { "Cache-Control": "no-store" } });
}

/**
 * POST { lines: [{ productId, variantId }] } — the unit price each cart line
 * would be ordered at now (the same pricing as quotes and orders), so the
 * cart, quick order and checkout show current prices. Fresh read; unreadable
 * -> 503, no older value. An unknown product or size answers `unitPrice: null`.
 */
export async function POST(request: Request) {
  let body: { lines?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }
  const raw = Array.isArray(body.lines) ? body.lines.slice(0, MAX_LINES) : [];

  const [prices, catalog] = await Promise.allSettled([refreshProductPrices({ strict: true }), refreshCatalog({ strict: true })]);
  if (prices.status === "rejected") return NextResponse.json({ ok: false, error: PRICES_UNAVAILABLE_ERROR }, { status: 503 });
  if (catalog.status === "rejected") return NextResponse.json({ ok: false, error: CATALOG_UNAVAILABLE_ERROR }, { status: 503 });
  const rows = priceRowsForCalculation();
  if (!rows) return NextResponse.json({ ok: false, error: PRICES_UNAVAILABLE_ERROR }, { status: 503 });

  const lines = raw.map((l) => {
    const line = (l ?? {}) as { productId?: unknown; variantId?: unknown };
    const productId = typeof line.productId === "string" ? line.productId : "";
    const variantId = typeof line.variantId === "string" && line.variantId ? line.variantId : null;
    const product = allCatalogProducts().find((p) => p.id === productId);
    return { productId, variantId, unitPrice: product ? effectiveUnitPrice(product, variantId, rows) : null };
  });
  return NextResponse.json({ ok: true, lines }, { headers: { "Cache-Control": "no-store" } });
}
