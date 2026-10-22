import { refreshInventory } from "@/lib/inventory/server-init";
import { refreshDeliveryFees } from "@/lib/delivery/fees-server";
import { refreshDeliveryAreas } from "@/lib/delivery/areas-server";
import { refreshProductPrices } from "@/lib/pricing/prices-server";
import { NextResponse } from "next/server";
import {
  getProductAvailability,
  getCartAvailability,
  type DeliveryContext,
} from "@/lib/availability";
import { allCatalogProducts } from "@/lib/data";
import { refreshCatalog } from "@/lib/catalog/server";

export const dynamic = "force-dynamic";

/**
 * Server-side availability — reads the branch stock statuses saved in the ops
 * panel before computing. The catalog / product page can also run the same
 * engine client-side for a fast optimistic view; this endpoint is the firm
 * check used before add-to-cart, on /sepet and at /checkout.
 */

type Body = {
  kind?: "product" | "cart" | "catalog";
  context?: Partial<DeliveryContext>;
  date?: string;
  slotStart?: string;
  productId?: string;
  productSlug?: string;
  variantId?: string | null;
  quantity?: number;
  items?: { productId: string; productSlug?: string; variantId?: string | null; quantity: number }[];
};

function normalizeContext(c: Partial<DeliveryContext> | undefined): DeliveryContext {
  return {
    fulfillmentType: c?.fulfillmentType === "pickup" ? "pickup" : "delivery",
    district: c?.district ?? null,
    neighborhood: c?.neighborhood ?? null,
    deliveryZoneId: c?.deliveryZoneId ?? null,
    branchId: c?.branchId ?? null,
  };
}

export async function POST(request: Request) {
  // independent reads, fetched together (a 2 s reuse keeps catalog bursts cheap):
  // - the published products added in the panel (D45; drafts never)
  // - branch stock statuses as saved by the ops panel
  // - delivery fees (D15): a failed read marks them unavailable — delivery then answers
  //   DELIVERY_INFO_UNAVAILABLE instead of using older values; pickup is unaffected
  // - shown unit prices (display reading: an unreadable store keeps the last good read)
  // - the district + neighbourhood -> branch map (D49): unreadable -> delivery answers DELIVERY_INFO_UNAVAILABLE
  // All five are lenient (they log, never throw).
  await Promise.all([
    refreshCatalog({ maxAgeMs: 2000 }),
    refreshInventory({ maxAgeMs: 2000 }),
    refreshDeliveryFees({ maxAgeMs: 2000 }),
    refreshDeliveryAreas({ maxAgeMs: 2000 }),
    refreshProductPrices({ maxAgeMs: 2000 }),
  ]);
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const context = normalizeContext(body.context);

  if (body.kind === "catalog") {
    // compact per-product verdict for /hizli-siparis rows + "Bugün Teslim" filter
    const ids = new Set(
      (Array.isArray(body.items) ? body.items : []).map((i) => i.productId),
    );
    const all = allCatalogProducts();
    const pool = ids.size > 0 ? all.filter((p) => ids.has(p.id)) : all;
    const map: Record<
      string,
      { available: boolean; reason: string | null; earliestLabel: string | null; earliestDate: string | null; slotLabel: string | null }
    > = {};
    for (const p of pool) {
      const r = getProductAvailability({ productId: p.id, quantity: 1, context, date: body.date });
      map[p.id] = {
        available: r.available,
        reason: r.reason,
        earliestLabel: r.earliestAvailableSlot?.label ?? null,
        earliestDate: r.earliestAvailableDate,
        slotLabel: r.slots.find((s) => s.available)?.label ?? null,
      };
    }
    return NextResponse.json({ products: map });
  }

  if (body.kind === "cart") {
    const items = Array.isArray(body.items) ? body.items : [];
    const result = getCartAvailability({
      context,
      items,
      date: body.date,
      slotStart: body.slotStart,
    });
    return NextResponse.json(result);
  }

  if (!body.productId && !body.productSlug) {
    return NextResponse.json({ error: "Ürün belirtilmedi." }, { status: 400 });
  }

  const result = getProductAvailability({
    productId: body.productId ?? body.productSlug ?? "",
    productSlug: body.productSlug,
    variantId: body.variantId ?? null,
    quantity: Math.max(1, Math.floor(body.quantity ?? 1)),
    context,
    date: body.date,
  });
  return NextResponse.json(result);
}
