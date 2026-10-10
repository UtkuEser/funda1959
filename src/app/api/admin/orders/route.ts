import "@/lib/orders/server-init";
import { NextResponse } from "next/server";
import { resolveAdminScope, type AdminScope } from "@/lib/admin/access";
import { getOrderRepository, type OrderActor, type StatusChangeError } from "@/lib/orders";
import type { OrderStatus } from "@/lib/order";
import { CANCEL_REASON_MAX, CANCEL_REASON_MIN } from "@/lib/order-status";
import { PersistenceUnavailableError, assertPersistentWrite, logPersistenceRefusal } from "@/lib/persistence";

export const dynamic = "force-dynamic";

/**
 * PATCH { orderNumber, toStatus, reason? } — admin status change
 * (SUPABASE_PLAN.md, A12). A branch account moves only its own branch's
 * orders one step forward or cancels them; Merkez may do the same for every
 * branch. Scope and the acting account come from the signed session only.
 * A cancel needs a reason; account, time and reason are recorded. Delivered
 * orders can't be cancelled and nothing is refunded in this phase.
 */

const STATUSES: OrderStatus[] = ["new", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"];

function actorOf(scope: AdminScope): OrderActor {
  return scope.user.role === "SUPER_ADMIN"
    ? { account: "merkez", name: scope.user.name }
    : { account: `sube:${scope.authorizedBranchIds?.[0] ?? ""}`, name: scope.user.name };
}

const REFUSED: Record<StatusChangeError, { status: number; error: string }> = {
  NOT_FOUND: { status: 404, error: "Sipariş bulunamadı." },
  FORBIDDEN: { status: 403, error: "Bu siparişin şubesi için yetkiniz yok." },
  ORDER_CLOSED: { status: 409, error: "Teslim edilmiş veya iptal edilmiş sipariş değiştirilemez." },
  INVALID_TRANSITION: { status: 409, error: "Sipariş durumu bu arada değişmiş; sayfayı yenileyip tekrar deneyin." },
  REASON_REQUIRED: { status: 400, error: `İptal gerekçesi zorunludur (${CANCEL_REASON_MIN}–${CANCEL_REASON_MAX} karakter).` },
};

type Body = { orderNumber?: unknown; toStatus?: unknown; reason?: unknown };

export async function PATCH(request: Request) {
  const scope = await resolveAdminScope();
  if (!scope) return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const orderNumber = typeof body.orderNumber === "string" ? body.orderNumber.trim() : "";
  const toStatus = STATUSES.find((s) => s === body.toStatus);
  if (!orderNumber || orderNumber.length > 40 || !toStatus || toStatus === "new") {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  let reason: string | null = null;
  if (toStatus === "cancelled") {
    reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (reason.length < CANCEL_REASON_MIN || reason.length > CANCEL_REASON_MAX) {
      return NextResponse.json(REFUSED.REASON_REQUIRED, { status: 400 });
    }
  }

  // never a change that only looks saved: wrong/missing database -> 503
  try {
    await assertPersistentWrite("orders");
  } catch (err) {
    if (!(err instanceof PersistenceUnavailableError)) throw err;
    logPersistenceRefusal(err, { orderNumber, toStatus, by: scope.user.name });
    return NextResponse.json({ error: err.userMessage }, { status: 503 });
  }

  let result;
  try {
    result = await getOrderRepository().changeStatus({
      orderNumber,
      toStatus,
      reason,
      actor: actorOf(scope),
      branchIds: scope.authorizedBranchIds,
    });
  } catch (err) {
    console.error("[api/admin/orders] status change failed", { orderNumber, toStatus, error: (err as Error).message });
    return NextResponse.json({ error: "Sipariş durumu kaydedilemedi. Lütfen tekrar deneyin." }, { status: 502 });
  }

  if (!result.ok) {
    const r = REFUSED[result.error];
    return NextResponse.json({ error: r.error }, { status: r.status });
  }
  const o = result.order;
  return NextResponse.json({
    ok: true,
    order: { orderNumber: o.orderNumber, status: o.orderStatus, cancellation: o.cancellation, lastChange: o.statusHistory.at(-1) ?? null },
  });
}
