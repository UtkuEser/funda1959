import { NextResponse } from "next/server";
import { refreshInventory } from "@/lib/inventory/server-init";
import { buildOrderPayload } from "@/lib/order-server";
import { OrderIntakeClosedError, isOrderIntakeOpen, placeOrder } from "@/lib/orders";
import { PersistenceUnavailableError, logPersistenceRefusal } from "@/lib/persistence";

export const dynamic = "force-dynamic";

const GENERIC_ERROR =
  "Siparişiniz oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin.";

const INTAKE_CLOSED_ERROR = "Online sipariş alımı henüz açılmadı.";
const STOCK_UNREADABLE_ERROR = "Stok bilgisi şu an doğrulanamadı; siparişiniz alınmadı. Lütfen biraz sonra tekrar deneyin.";

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

  // the order is checked against the saved branch stock — never against stale
  // or seed values: if the statuses can't be read, no order is taken
  try {
    await refreshInventory({ strict: true });
  } catch (err) {
    console.error("[api/orders] refused: branch stock could not be read", { error: (err as Error).message });
    return NextResponse.json({ ok: false, error: STOCK_UNREADABLE_ERROR }, { status: 503 });
  }

  // 400 malformed / 409 not deliverable as asked (date, slot, stock, zone)
  const built = buildOrderPayload(body);
  if (!built.ok) {
    return NextResponse.json({ ok: false, error: built.error, reason: built.reason ?? null }, { status: built.status });
  }

  try {
    // create the branch-routed order (no capacity hold exists — D11)
    const order = await placeOrder(built.payload);
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
