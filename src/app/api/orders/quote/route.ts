import { NextResponse } from "next/server";
import { refreshInventory } from "@/lib/inventory/server-init";
import { refreshDeliveryFees } from "@/lib/delivery/fees-server";
import { refreshProductPrices } from "@/lib/pricing/prices-server";
import { PRICES_UNAVAILABLE_ERROR, buildOrderPayload, quoteFromPayload } from "@/lib/order-server";

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

  // the same fresh, strict stock read as an order, so the quote's verdict is
  // the order's verdict (one read per payment-page load)
  try {
    await refreshInventory({ strict: true });
  } catch (err) {
    console.error("[api/orders/quote] branch stock could not be read", { error: (err as Error).message });
    return NextResponse.json(
      { ok: false, error: "Stok bilgisi şu an doğrulanamadı; tutar hesaplanamadı. Lütfen biraz sonra tekrar deneyin." },
      { status: 503 },
    );
  }

  // fresh prices, like an order (D5): the amount shown is the amount ordered
  try {
    await refreshProductPrices({ strict: true });
  } catch {
    return NextResponse.json({ ok: false, error: PRICES_UNAVAILABLE_ERROR }, { status: 503 });
  }

  // fresh delivery fees, like an order (D15); unreadable -> delivery answers 503
  await refreshDeliveryFees();

  const built = buildOrderPayload(body);
  if (!built.ok) {
    return NextResponse.json({ ok: false, error: built.error, reason: built.reason ?? null }, { status: built.status });
  }
  return NextResponse.json({ ok: true, quote: quoteFromPayload(built.payload, built.deliveryFeeState) });
}
