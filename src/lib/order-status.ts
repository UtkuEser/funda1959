import type { OrderStatus } from "./order";

const LABELS: Record<OrderStatus, string> = {
  new: "Sipariş Alındı",
  confirmed: "Onaylandı",
  preparing: "Hazırlanıyor",
  ready: "Teslime Hazır",
  out_for_delivery: "Yolda",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
};

export function orderStatusLabel(status: OrderStatus): string {
  return LABELS[status] ?? status;
}

export type StatusTone = "neutral" | "active" | "success" | "cancelled";

export function orderStatusTone(status: OrderStatus): StatusTone {
  if (status === "delivered") return "success";
  if (status === "cancelled") return "cancelled";
  if (status === "new") return "neutral";
  return "active";
}

/** Muted, palette-adjacent badge classes. */
export const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-sand-light text-warm-brown",
  active: "bg-burgundy/[0.08] text-burgundy",
  success: "bg-sage/15 text-sage",
  cancelled: "bg-espresso/[0.06] text-taupe",
};

/** Ordered timeline steps by delivery type. Pickup has no "Yolda" stage. */
export const DELIVERY_TIMELINE: OrderStatus[] = [
  "new",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
];

export const PICKUP_TIMELINE: OrderStatus[] = [
  "new",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
];

/** Statuses that count as "still in progress". */
export const ACTIVE_STATUSES: OrderStatus[] = [
  "new",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
];

/*
 * Admin status changes (SUPABASE_PLAN.md, A12). A branch account changes only
 * its own branch's orders, Merkez any branch — the scope check lives on the
 * server (api/admin/orders + RPC update_order_status, migration 0007). The
 * same rules run in the DB function; these copies drive the panel and the
 * local in-memory store.
 */

/** The single next step on the order's timeline; null once delivered or cancelled. */
export function nextOrderStatus(status: OrderStatus, deliveryType: "delivery" | "pickup"): OrderStatus | null {
  const timeline = deliveryType === "pickup" ? PICKUP_TIMELINE : DELIVERY_TIMELINE;
  const i = timeline.indexOf(status);
  return i >= 0 && i < timeline.length - 1 ? timeline[i + 1] : null;
}

/** Cancelling a delivered order (or refunding a payment) is not part of this phase. */
export function canCancelOrder(status: OrderStatus): boolean {
  return status !== "delivered" && status !== "cancelled";
}

export const CANCEL_REASON_MIN = 3;
export const CANCEL_REASON_MAX = 500;
