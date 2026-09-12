import { NextResponse } from "next/server";
import { buildOrderPayload } from "@/lib/order-server";
import { placeOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

const GENERIC_ERROR =
  "Siparişiniz oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin.";

const RESERVATION_ERROR =
  "Ayırdığınız teslimat kapasitesinin süresi doldu. Lütfen teslimat saatini yeniden seçin.";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }

  const built = buildOrderPayload(body);
  if (!built.ok) {
    return NextResponse.json({ ok: false, error: built.error }, { status: 400 });
  }

  const b = (body ?? {}) as { reservationId?: unknown; deliveryZoneId?: unknown };
  const reservationId = typeof b.reservationId === "string" ? b.reservationId : null;
  const deliveryZoneId = typeof b.deliveryZoneId === "string" ? b.deliveryZoneId : null;

  try {
    // payment success -> confirm the hold -> create the branch-routed order
    const order = await placeOrder(built.payload, { reservationId, deliveryZoneId });
    return NextResponse.json({ ok: true, order }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "RESERVATION_EXPIRED" || message === "RESERVATION_NOT_FOUND") {
      return NextResponse.json({ ok: false, error: RESERVATION_ERROR }, { status: 409 });
    }
    console.error("[api/orders] create failed:", err);
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 502 });
  }
}
