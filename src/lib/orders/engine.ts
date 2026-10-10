/**
 * Order engine — the seam between "payment succeeded" and a real order.
 *
 * `placeOrder()` takes the snake_case payload `buildOrderPayload()` already
 * produces (so the API route is a thin adapter) and writes through the
 * matching Supabase project (RPC `create_order`) or — only on a developer
 * machine without Supabase — the in-memory mock. There is no capacity hold:
 * no hourly order limit exists (SUPABASE_PLAN.md, D11).
 *
 * No payment provider is connected (D8): every order is created with
 * payment status "pending" — never "paid" without a provider confirmation —
 * and is marked `is_demo = true` here, whatever the payload says. Production
 * order intake is closed (§6.1), so demo orders only reach the test project.
 *
 * No Funda Puan is earned here, in any store: every order is a demo order
 * (D13), and earning for paid orders is wired with the database ledger in
 * Aşama 6 — not switched on by this file.
 */

import type { OrderSummary } from "../order";
import { createOrder as createOrderViaSupabase, expectedDataEnvironment, isSupabaseConfigured } from "../supabase-server";
import { assertPersistentWrite } from "../persistence";
import {
  memoryOrders,
  orderToSummary,
  type NewOrderInput,
  type StoredOrderItem,
} from "./repository";

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
    zone_id?: unknown;
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

/**
 * Online order intake is closed in production until a payment provider is
 * connected and opening is approved separately (SUPABASE_PLAN.md, D2/D8,
 * §6.1). Decided only by the deployment (`VERCEL_ENV`), never by a request
 * field; opening it takes a code change, not an environment variable.
 */
export function isOrderIntakeOpen(): boolean {
  return expectedDataEnvironment() !== "production";
}

export class OrderIntakeClosedError extends Error {
  constructor() {
    super("ORDER_INTAKE_CLOSED: production order intake is not open");
    this.name = "OrderIntakeClosedError";
  }
}

const s = (v: unknown): string => (typeof v === "string" ? v : "");
const n = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0);

/**
 * Writes an order `buildOrderPayload()` produced — branch, zone and amounts
 * are already the server's own. Never call it with browser input directly.
 */
export async function placeOrder(payload: unknown): Promise<OrderSummary> {
  if (!isOrderIntakeOpen()) throw new OrderIntakeClosedError();

  // every order is a demo order (D8) — set here, never taken from the payload
  const demoPayload = { ...((payload ?? {}) as Record<string, unknown>), is_demo: true };

  // Where the order may be written: the matching Supabase project, or — only on
  // a developer machine without Supabase — the in-memory mock. On Vercel this
  // throws PersistenceUnavailableError instead of "saving" into instance memory.
  const target = await assertPersistentWrite("orders");

  if (target === "database") {
    return createOrderViaSupabase(demoPayload);
  }

  // ---- local demo / mock path (developer machine without Supabase) -------
  const p = demoPayload as OrderPayload;
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
    clientRequestId: s(p.client_request_id) || null,
    branchId,
    deliveryZoneId: type === "delivery" ? s(d.zone_id) || null : null,
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
    // no payment was taken (D8) — a demo order is never recorded as paid
    paymentStatus: "pending",
    isDemo: true,
    orderStatus: "new",
  };

  // a demo order earns no Funda Puan (D13) — no award call here
  const stored = memoryOrders.create(input);
  return orderToSummary(stored);
}

/** PII-free summary for /siparis-takip and /siparis-basarili. */
export async function getPublicOrder(orderNumber: string): Promise<OrderSummary | null> {
  if (isSupabaseConfigured()) {
    const { getOrderSummary } = await import("../supabase-server");
    return getOrderSummary(orderNumber);
  }
  const row = await memoryOrders.get(orderNumber);
  return row ? orderToSummary(row) : null;
}
