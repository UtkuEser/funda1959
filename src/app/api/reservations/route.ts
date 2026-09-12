import { NextResponse } from "next/server";
import { getCartAvailability, type DeliveryContext } from "@/lib/availability";
import { createReservation, getReservation, RESERVATION_TTL_MS } from "@/lib/reservations";

export const dynamic = "force-dynamic";

/**
 * POST — hold capacity for the payment window. Re-runs cart availability first;
 * on any issue it returns 409 with the reason instead of a hold.
 * GET ?id= — reservation status + remaining ms (for the payment countdown).
 */

type Body = {
  context?: Partial<DeliveryContext>;
  date?: string;
  slotStart?: string;
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
  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "Sepet boş." }, { status: 400 });
  }
  if (!body.date || !body.slotStart) {
    return NextResponse.json({ error: "Teslimat tarihi/saati seçilmedi." }, { status: 400 });
  }

  const availability = getCartAvailability({
    context,
    items,
    date: body.date,
    slotStart: body.slotStart,
  });

  if (!availability.available || !availability.branchId) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          availability.itemIssues[0]?.reason ??
          availability.slots.find((s) => s.startTime === body.slotStart)?.reason ??
          "DATE_UNAVAILABLE",
        availability,
      },
      { status: 409 },
    );
  }

  const reservation = createReservation({
    branchId: availability.branchId,
    items: items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId ?? null,
      quantity: i.quantity,
    })),
    deliveryDate: body.date,
    deliverySlotStart: body.slotStart,
  });

  return NextResponse.json({
    ok: true,
    reservationId: reservation.id,
    expiresAt: reservation.expiresAt,
    ttlMs: RESERVATION_TTL_MS,
    branchId: reservation.branchId,
  });
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });
  const reservation = getReservation(id);
  if (!reservation) return NextResponse.json({ status: "expired", remainingMs: 0 });
  return NextResponse.json({
    status: reservation.status,
    remainingMs: Math.max(0, reservation.expiresAt - Date.now()),
    expiresAt: reservation.expiresAt,
  });
}
