/**
 * Order engine — the seam between "payment succeeded" and a real order.
 *
 * Flow:  payment success -> confirmReservation() -> createOrder(branchId, zone)
 *
 * `placeOrder()` takes the snake_case payload `buildOrderPayload()` already
 * produces (so the API route is a thin adapter), optionally confirms a
 * reservation, and writes through `OrderRepository`. When Supabase is
 * configured it defers to the RPC; otherwise it uses the in-memory mock so the
 * demo funnel completes end to end.
 */

import type { OrderSummary } from "../order";
import { createOrder as createOrderViaSupabase } from "../supabase-server";
import { confirmReservation, getReservation } from "../reservations";
import { awardPointsForOrder } from "../funda-points";
import {
  getOrderRepository,
  orderToSummary,
  type NewOrderInput,
  type StoredOrderItem,
} from "./repository";

function supabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL);
}

type PayloadItem = {
  product_id?: unknown;
  product_slug?: unknown;
  product_name?: unknown;
  variant_id?: unknown;
  variant_label?: unknown;
  quantity?: unknown;
  unit_price?: unknown;
  total_price?: unknown;
  cake_message?: unknown;
  extras?: unknown;
  note?: unknown;
};

type OrderPayload = {
  client_request_id?: unknown;
  customer?: { full_name?: unknown; phone?: unknown; email?: unknown };
  delivery?: {
    type?: unknown;
    branch_slug?: unknown;
    date?: unknown;
    time_slot?: unknown;
    address?: unknown;
  };
  items?: PayloadItem[];
  subtotal?: unknown;
  delivery_fee?: unknown;
  discount?: unknown;
  total?: unknown;
  order_note?: unknown;
};

const s = (v: unknown): string => (typeof v === "string" ? v : "");
const n = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0);

export type PlaceOrderOptions = {
  reservationId?: string | null;
  deliveryZoneId?: string | null;
};

export async function placeOrder(
  payload: unknown,
  options: PlaceOrderOptions = {},
): Promise<OrderSummary> {
  // Confirm the hold (if any) before we commit the order.
  if (options.reservationId) {
    const reservation = getReservation(options.reservationId);
    if (!reservation) {
      throw new Error("RESERVATION_NOT_FOUND");
    }
    if (reservation.status === "expired") {
      throw new Error("RESERVATION_EXPIRED");
    }
    if (reservation.status === "active") {
      confirmReservation(options.reservationId);
    }
  }

  if (supabaseConfigured()) {
    return createOrderViaSupabase(payload);
  }

  // ---- demo / mock path -------------------------------------------------
  const p = (payload ?? {}) as OrderPayload;
  const d = p.delivery ?? {};
  const type = s(d.type) === "pickup" ? "pickup" : "delivery";
  const branchId = s(d.branch_slug) || null;

  const items: StoredOrderItem[] = (Array.isArray(p.items) ? p.items : []).map((raw) => ({
    productId: s(raw.product_id),
    productSlug: s(raw.product_slug),
    productName: s(raw.product_name),
    variantId: raw.variant_id == null ? null : s(raw.variant_id) || null,
    variantLabel: raw.variant_label == null ? null : s(raw.variant_label) || null,
    quantity: n(raw.quantity),
    unitPrice: n(raw.unit_price),
    lineTotal: n(raw.total_price),
    cakeMessage: raw.cake_message == null ? null : s(raw.cake_message) || null,
    extras: Array.isArray(raw.extras) ? (raw.extras as string[]) : null,
    note: raw.note == null ? null : s(raw.note) || null,
  }));

  const rawAddress = d.address as Record<string, unknown> | null | undefined;
  const address =
    type === "delivery" && rawAddress
      ? {
          district: s(rawAddress.district),
          neighborhood: s(rawAddress.neighborhood),
          addressLine: s(rawAddress.address_line),
          building: s(rawAddress.building) || undefined,
          floor: s(rawAddress.floor) || undefined,
          apartment: s(rawAddress.apartment) || undefined,
          note: s(rawAddress.note) || undefined,
        }
      : null;

  const input: NewOrderInput = {
    branchId,
    deliveryZoneId: options.deliveryZoneId ?? null,
    fulfillmentType: type,
    // this flow is the web checkout; a future mobile app sets "mobile" here.
    salesChannel: "web",
    customer: {
      fullName: s(p.customer?.full_name),
      phone: s(p.customer?.phone),
      email: s(p.customer?.email),
    },
    address,
    items,
    deliveryDate: s(d.date),
    deliverySlot: s(d.time_slot),
    subtotal: n(p.subtotal),
    deliveryFee: n(p.delivery_fee),
    discount: n(p.discount),
    total: n(p.total),
    reservationId: options.reservationId ?? null,
    paymentStatus: "paid",
    orderStatus: "new",
  };

  const stored = getOrderRepository().create(input);

  // Funda Puan bookkeeping must never break order creation — a real
  // deployment would move this behind a transaction/outbox so a crash here
  // can be retried instead of silently dropping the award.
  try {
    awardPointsForOrder(stored);
  } catch (err) {
    console.error(`[funda-points] awardPointsForOrder failed for ${stored.orderNumber}`, err);
  }

  return orderToSummary(stored);
}

/** PII-free summary for /siparis-takip and /siparis-basarili. */
export async function getPublicOrder(orderNumber: string): Promise<OrderSummary | null> {
  if (supabaseConfigured()) {
    const { getOrderSummary } = await import("../supabase-server");
    return getOrderSummary(orderNumber);
  }
  const row = getOrderRepository().get(orderNumber);
  return row ? orderToSummary(row) : null;
}
