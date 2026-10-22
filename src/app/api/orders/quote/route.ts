import { NextResponse } from "next/server";
import { refreshInventory } from "@/lib/inventory/server-init";
import { refreshDeliveryFees } from "@/lib/delivery/fees-server";
import { refreshDeliveryAreas } from "@/lib/delivery/areas-server";
import { refreshProductPrices } from "@/lib/pricing/prices-server";
import { CATALOG_UNAVAILABLE_ERROR, refreshCatalog } from "@/lib/catalog/server";
import { PRICES_UNAVAILABLE_ERROR, buildOrderPayload, quoteFromPayload } from "@/lib/order-server";
import { isFundaPointsActive } from "@/lib/funda-points";
import { getCheckoutPoints } from "@/lib/funda-points/service";
import { routeCookieJar } from "@/lib/customer-auth/next";
import { resolveOrderMember } from "@/lib/customer-auth/operations";

export const dynamic = "force-dynamic";

/**
 * POST /api/orders/quote — body: the same CreateOrderRequest the payment step
 * sends to POST /api/orders. Runs the same validation and pricing
 * (`buildOrderPayload`) and returns the figures; nothing is written, so it
 * is not gated by the production order-intake switch. Same answers as an
 * order: 400 malformed, 409 not deliverable as asked, 503 stock, prices or
 * fees unreadable.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }

  // the same fresh reads as an order, fetched together (independent of each
  // other) and checked in the order's sequence below:
  // - strict stock, so the quote's verdict is the order's verdict (one read per payment-page load)
  // - strict prices (D5): the amount shown is the amount ordered
  // - delivery fees (D15), lenient; unreadable -> delivery answers 503
  // - strict catalog: the published panel products (D45), so an unpublished one is refused
  // - delivery areas (D49), fresh and lenient like the fees: the branch follows from the address
  const [stock, prices, , catalog] = await Promise.allSettled([
    refreshInventory({ strict: true }),
    refreshProductPrices({ strict: true }),
    Promise.all([refreshDeliveryFees(), refreshDeliveryAreas()]),
    refreshCatalog({ strict: true }),
  ]);
  if (stock.status === "rejected") {
    console.error("[api/orders/quote] branch stock could not be read", { error: (stock.reason as Error).message });
    return NextResponse.json(
      { ok: false, error: "Stok bilgisi şu an doğrulanamadı; tutar hesaplanamadı. Lütfen biraz sonra tekrar deneyin." },
      { status: 503 },
    );
  }
  if (prices.status === "rejected") {
    return NextResponse.json({ ok: false, error: PRICES_UNAVAILABLE_ERROR }, { status: 503 });
  }
  if (catalog.status === "rejected") {
    return NextResponse.json({ ok: false, error: CATALOG_UNAVAILABLE_ERROR }, { status: 503 });
  }

  // Funda Puan: same checks as the order. While points are off a request for
  // points is refused by buildOrderPayload without reading anything (D41).
  const wantsPoints = Number((body as { pointsToRedeem?: unknown })?.pointsToRedeem ?? 0) > 0;
  let customerUserId: string | null = null;
  let points: { active: boolean; available: number | null } = { active: isFundaPointsActive(), available: null };
  if (points.active && wantsPoints) {
    const member = await resolveOrderMember(await routeCookieJar());
    if (!member.ok) {
      return NextResponse.json({ ok: false, error: "Oturumunuz şu an doğrulanamadı; tutar hesaplanamadı." }, { status: 503 });
    }
    customerUserId = member.userId;
    if (customerUserId) {
      try {
        points = { active: true, available: (await getCheckoutPoints(customerUserId))?.available ?? null };
      } catch {
        return NextResponse.json({ ok: false, error: "Funda Puan bakiyeniz şu an doğrulanamadı." }, { status: 503 });
      }
    }
  }

  const built = buildOrderPayload(body, { customerUserId, points });
  if (!built.ok) {
    return NextResponse.json({ ok: false, error: built.error, reason: built.reason ?? null, code: built.code ?? null }, { status: built.status });
  }
  return NextResponse.json({ ok: true, quote: quoteFromPayload(built.payload, built.deliveryFeeState) });
}
