import { NextResponse } from "next/server";
import { refreshInventory } from "@/lib/inventory/server-init";
import { refreshDeliveryFees } from "@/lib/delivery/fees-server";
import { refreshProductPrices } from "@/lib/pricing/prices-server";
import { SupabaseRestError } from "@/lib/supabase-server";
import { PRICES_UNAVAILABLE_ERROR, buildOrderPayload } from "@/lib/order-server";
import { OrderIntakeClosedError, findOrderByRequestId, isOrderIntakeOpen, placeOrder } from "@/lib/orders";
import { PersistenceUnavailableError, logPersistenceRefusal } from "@/lib/persistence";
import { routeCookieJar } from "@/lib/customer-auth/next";
import { resolveOrderMember } from "@/lib/customer-auth/operations";
import { isFundaPointsActive } from "@/lib/funda-points";
import { getCheckoutPoints } from "@/lib/funda-points/service";

export const dynamic = "force-dynamic";

const GENERIC_ERROR =
  "Siparişiniz oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin.";

const INTAKE_CLOSED_ERROR = "Online sipariş alımı henüz açılmadı.";
const STOCK_UNREADABLE_ERROR = "Stok bilgisi şu an doğrulanamadı; siparişiniz alınmadı. Lütfen biraz sonra tekrar deneyin.";

/**
 * `raise exception` texts of create_order (0008, 0009) that mean "the rules
 * changed between validation and insert" — e.g. Merkez changed the zone's fee
 * or a product's price in that moment. The order was not written; the
 * customer re-checks the amount.
 */
const RULE_CHANGED: Record<string, string> = {
  price_mismatch: "Ürün fiyatı az önce güncellendi; siparişiniz alınmadı. Lütfen tutarı yeniden kontrol edin.",
  invalid_customer_account: "Üyelik bilgileriniz doğrulanamadı; siparişiniz alınmadı. Lütfen sayfayı yenileyip tekrar deneyin.",
  insufficient_points: "Funda Puan bakiyeniz az önce değişti; siparişiniz alınmadı. Lütfen tutarı yeniden kontrol edin.",
  points_exceed_products: "Funda Puan yalnızca ürün tutarına kadar kullanılabilir; siparişiniz alınmadı.",
  points_require_member: "Funda Puan yalnızca üye girişiyle kullanılabilir; siparişiniz alınmadı.",
  points_not_allowed_for_demo: "Funda Puan kullanımı henüz açılmadı; siparişiniz alınmadı.",
  delivery_fee_mismatch: "Teslimat ücreti az önce güncellendi; siparişiniz alınmadı. Lütfen tutarı yeniden kontrol edin.",
  delivery_fee_not_set: "Bu bölge için teslimat ücreti belirlenmedi; adrese teslim şu an yapılamıyor. Mağazadan teslim alabilirsiniz.",
  below_minimum: "Adrese teslim için minimum sipariş tutarına ulaşılmadı.",
  invalid_delivery_date: "Seçilen teslimat tarihi geçmişte kaldı. Lütfen yeni bir tarih seçin.",
};

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

  // a retried submit returns the order it already created — even if a fee, the
  // minimum or the slot changed since — and never creates a second one
  const requestId = typeof (body as { clientRequestId?: unknown })?.clientRequestId === "string"
    ? ((body as { clientRequestId: string }).clientRequestId.slice(0, 64) || null)
    : null;
  if (requestId) {
    try {
      const existing = await findOrderByRequestId(requestId);
      if (existing) return NextResponse.json({ ok: true, order: existing }, { status: 201 });
    } catch (err) {
      console.error("[api/orders] refused: earlier order could not be looked up", { error: (err as Error).message });
      return NextResponse.json({ ok: false, error: "Siparişiniz şu an alınamıyor. Lütfen daha sonra tekrar deneyin." }, { status: 503 });
    }
  }

  // D24: a signed-in member's order belongs to their account — the id comes
  // from the session Supabase verified, never from the body. Guests stay
  // guests; a session that can't be checked refuses rather than turning a
  // member's order into a guest order.
  const member = await resolveOrderMember(await routeCookieJar());
  if (!member.ok) {
    return NextResponse.json(
      { ok: false, error: "Oturumunuz şu an doğrulanamadı; siparişiniz alınmadı. Lütfen biraz sonra tekrar deneyin." },
      { status: 503 },
    );
  }

  // the order is checked against the saved branch stock — never against stale
  // or seed values: if the statuses can't be read, no order is taken
  try {
    await refreshInventory({ strict: true });
  } catch (err) {
    console.error("[api/orders] refused: branch stock could not be read", { error: (err as Error).message });
    return NextResponse.json({ ok: false, error: STOCK_UNREADABLE_ERROR }, { status: 503 });
  }

  // product prices, fresh (D5): an order is never priced from an older or a catalog value
  try {
    await refreshProductPrices({ strict: true });
  } catch {
    return NextResponse.json({ ok: false, error: PRICES_UNAVAILABLE_ERROR }, { status: 503 });
  }

  // delivery fees, fresh (D15). A failed read leaves them "unavailable": delivery
  // answers 503 below, pickup keeps working.
  await refreshDeliveryFees();

  // 400 malformed / 409 not deliverable as asked (date, slot, stock, zone, fee,
  // minimum) / 503 prices or fees unreadable
  // Funda Puan (D41): the balance is read only when points are on and a member asks to use some
  const wantsPoints = Number((body as { pointsToRedeem?: unknown })?.pointsToRedeem ?? 0) > 0;
  let points: { active: boolean; available: number | null } = { active: isFundaPointsActive(), available: null };
  if (points.active && wantsPoints && member.userId) {
    try {
      points = { active: true, available: (await getCheckoutPoints(member.userId))?.available ?? null };
    } catch (err) {
      console.error("[api/orders] refused: points balance could not be read", { error: (err as Error).message });
      return NextResponse.json({ ok: false, error: "Funda Puan bakiyeniz şu an doğrulanamadı; siparişiniz alınmadı." }, { status: 503 });
    }
  }

  const built = buildOrderPayload(body, { customerUserId: member.userId, points });
  if (!built.ok) {
    return NextResponse.json({ ok: false, error: built.error, reason: built.reason ?? null, code: built.code ?? null }, { status: built.status });
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
    const changed = err instanceof SupabaseRestError && err.dbMessage ? RULE_CHANGED[err.dbMessage] : undefined;
    if (changed) {
      console.error("[api/orders] refused by create_order", { reason: (err as SupabaseRestError).dbMessage });
      return NextResponse.json({ ok: false, error: changed }, { status: 409 });
    }
    console.error("[api/orders] create failed:", err);
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 502 });
  }
}
