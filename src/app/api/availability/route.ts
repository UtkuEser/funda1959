import { NextResponse } from "next/server";
import {
  getProductAvailability,
  getCartAvailability,
  type DeliveryContext,
} from "@/lib/availability";
import { catalogProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * Server-side availability — reservation-aware (the in-memory reservation store
 * lives on the server). The catalog / product page can also run the same
 * engine client-side for a fast optimistic view; this endpoint is the firm
 * check used before add-to-cart, on /sepet and at /checkout.
 */

type Body = {
  kind?: "product" | "cart" | "catalog";
  context?: Partial<DeliveryContext>;
  date?: string;
  slotStart?: string;
  reservationScope?: string;
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
    const pool = ids.size > 0 ? catalogProducts.filter((p) => ids.has(p.id)) : catalogProducts;
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
      reservationScope: body.reservationScope,
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
