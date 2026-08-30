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
