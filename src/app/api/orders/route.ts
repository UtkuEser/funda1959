import { NextResponse } from "next/server";
import { refreshInventory } from "@/lib/inventory/server-init";
import { buildOrderPayload } from "@/lib/order-server";
import { OrderIntakeClosedError, isOrderIntakeOpen, placeOrder } from "@/lib/orders";
import { PersistenceUnavailableError, logPersistenceRefusal } from "@/lib/persistence";

export const dynamic = "force-dynamic";

const GENERIC_ERROR =
  "Siparişiniz oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin.";

const INTAKE_CLOSED_ERROR = "Online sipariş alımı henüz açılmadı.";

function intakeClosed() {
  console.error("[api/orders] refused: production order intake is closed");
  return NextResponse.json({ ok: false, error: INTAKE_CLOSED_ERROR }, { status: 503 });
}

export async function POST(request: Request) {
  // production: closed before the body is even read — no request field can reopen it
  if (!isOrderIntakeOpen()) return intakeClosed();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }

  await refreshInventory(); // order validation reads branch product data
  const built = buildOrderPayload(body);
  if (!built.ok) {
    return NextResponse.json({ ok: false, error: built.error }, { status: 400 });
  }

  const b = (body ?? {}) as { deliveryZoneId?: unknown };
  const deliveryZoneId = typeof b.deliveryZoneId === "string" ? b.deliveryZoneId : null;

  try {
    // create the branch-routed order (no capacity hold exists — D11)
    const order = await placeOrder(built.payload, { deliveryZoneId });
    return NextResponse.json({ ok: true, order }, { status: 201 });
  } catch (err) {
    if (err instanceof OrderIntakeClosedError) return intakeClosed();
    if (err instanceof PersistenceUnavailableError) {
      logPersistenceRefusal(err, { clientRequestId: (built.payload as { client_request_id?: unknown }).client_request_id ?? null });
      return NextResponse.json({ ok: false, error: err.userMessage }, { status: 503 });
    }
    console.error("[api/orders] create failed:", err);
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 502 });
  }
}
