/**
 * Order repository abstraction.
 *
 * Admin screens and the status route talk to `getOrderRepository()`, never
 * Supabase or an array directly. `SupabaseOrderRepository`
 * (./supabase-repository.ts, registered by ./server-init.ts) reads the
 * database; `MockOrderRepository` is the in-memory store a developer machine
 * without Supabase uses. Both apply the same rules: branch scope, delivery-date
 * filter, pagination, and the status rules of SUPABASE_PLAN.md A12.
 * `/hesabim/siparislerim` will read through the same seam (Aşama 5).
 */

import type { CheckoutAddress, OrderStatus, OrderSummary, PaymentStatus, SalesChannel } from "../order";
import { generateOrderReference } from "../order";
import { getBranch } from "../branch";
import { CANCEL_REASON_MIN, canCancelOrder, nextOrderStatus } from "../order-status";

export type StoredOrderItem = {
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string | null;
  variantLabel: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  cakeMessage?: string | null;
  extras?: string[] | null;
  note?: string | null;
};

/** One admin status change — who, when, from what to what (and why, for a cancel). */
export type OrderStatusEvent = {
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  actorAccount: string;
  actorName: string;
  reason: string | null;
  at: string;
};

export type OrderCancellation = { reason: string; by: string; at: string };

export type StoredOrder = {
  id: string;
  orderNumber: string;
  /** branch slug; null only on delivery orders created before migration 0007 */
  branchId: string | null;
  deliveryZoneId: string | null;
  fulfillmentType: "delivery" | "pickup";
  /** undefined on legacy rows — treat as "web" (see funda-points/service.ts) */
  salesChannel?: SalesChannel;
  customer: { fullName: string; phone: string; email: string };
  address: CheckoutAddress | null;
  items: StoredOrderItem[];
  deliveryDate: string;
  deliverySlot: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentStatus: PaymentStatus;
  /**
   * Demo / test order — set explicitly, never inferred from `paymentStatus`.
   * Every order is a demo until a payment provider exists (SUPABASE_PLAN.md,
   * D8); DB column `orders.is_demo` (migration 0006) defaults to true for the
   * same reason, and a demo order can never be "paid".
   */
  isDemo: boolean;
  orderStatus: OrderStatus;
  cancellation: OrderCancellation | null;
  /** oldest first */
  statusHistory: OrderStatusEvent[];
  createdAt: string;
  updatedAt: string;
};

export function orderToSummary(o: StoredOrder): OrderSummary {
  return {
    orderNumber: o.orderNumber,
    status: o.orderStatus,
    deliveryType: o.fulfillmentType,
    deliveryDate: o.deliveryDate,
    deliveryTimeSlot: o.deliverySlot,
    branchName: getBranch(o.branchId)?.name ?? null,
    total: o.total,
    isDemo: o.isDemo,
  };
}

/* -------------------------------------------------------------------------- */

export type OrderListQuery = {
  /** null / undefined = every branch (Merkez); otherwise only these branch slugs */
  branchIds?: string[] | null;
  /** delivery-date range, inclusive (YYYY-MM-DD); open when null */
  from?: string | null;
  to?: string | null;
  limit: number;
  offset: number;
};

export type OrderPage = {
  /** newest first */
  rows: StoredOrder[];
  /** all orders matching the query, before paging */
  total: number;
  statusCounts: Partial<Record<OrderStatus, number>>;
};

export type OrderActor = { account: string; name: string };

export type StatusChangeRequest = {
  orderNumber: string;
  toStatus: OrderStatus;
  reason: string | null;
  actor: OrderActor;
  /** the caller's scope from the session: null = every branch (Merkez) */
  branchIds: string[] | null;
};

export type StatusChangeError = "NOT_FOUND" | "FORBIDDEN" | "ORDER_CLOSED" | "INVALID_TRANSITION" | "REASON_REQUIRED";

export type StatusChangeResult = { ok: true; order: StoredOrder } | { ok: false; error: StatusChangeError };

export interface OrderRepository {
  readonly kind: "memory" | "supabase";
  get(orderNumber: string): Promise<StoredOrder | null>;
  list(query: OrderListQuery): Promise<OrderPage>;
  changeStatus(req: StatusChangeRequest): Promise<StatusChangeResult>;
}

export type NewOrderInput = Omit<
  StoredOrder,
  "id" | "orderNumber" | "createdAt" | "updatedAt" | "paymentStatus" | "isDemo" | "orderStatus" | "cancellation" | "statusHistory"
> & {
  /** idempotency key — the same submit retried returns the order already created */
  clientRequestId?: string | null;
  paymentStatus?: PaymentStatus;
  /** defaults to true, like `orders.is_demo` (0006) */
  isDemo?: boolean;
  orderStatus?: OrderStatus;
};

const nowISO = () => new Date().toISOString();

/** Checks shared by both stores, in the same order as RPC update_order_status (0007). */
export function checkStatusChange(order: StoredOrder | null, req: StatusChangeRequest): StatusChangeError | null {
  if (!order) return "NOT_FOUND";
  if (req.branchIds && !(order.branchId && req.branchIds.includes(order.branchId))) return "FORBIDDEN";
  if (!canCancelOrder(order.orderStatus)) return "ORDER_CLOSED";
  if (req.toStatus === "cancelled") {
    return (req.reason?.trim().length ?? 0) >= CANCEL_REASON_MIN ? null : "REASON_REQUIRED";
  }
  return req.toStatus === nextOrderStatus(order.orderStatus, order.fulfillmentType) ? null : "INVALID_TRANSITION";
}

/**
 * In-memory store. Kept on `globalThis` so a Route Handler and a Server
 * Component in the same Node process share the same rows (Next may load the
 * module into separate registries per entry otherwise).
 */
const globalStore = globalThis as unknown as {
  __fundaOrders?: Map<string, StoredOrder>;
  __fundaOrderRequests?: Map<string, string>;
};
globalStore.__fundaOrders ??= new Map<string, StoredOrder>();
globalStore.__fundaOrderRequests ??= new Map<string, string>();

export class MockOrderRepository implements OrderRepository {
  readonly kind = "memory" as const;
  private readonly rows = globalStore.__fundaOrders!;
  private readonly requests = globalStore.__fundaOrderRequests!;

  create(input: NewOrderInput): StoredOrder {
    const { clientRequestId, ...rest } = input;
    const existing = clientRequestId ? this.rows.get(this.requests.get(clientRequestId) ?? "") : undefined;
    if (existing) return existing;

    const isDemo = rest.isDemo ?? true;
    // "paid" only ever comes from a payment provider's confirmation (D8)
    const paymentStatus = rest.paymentStatus ?? "pending";
    // same rule as the DB check `orders_demo_never_paid` (0006)
    if (isDemo && paymentStatus === "paid") throw new Error("a demo order can never be paid");
    const orderNumber = generateOrderReference();
    const order: StoredOrder = {
      ...rest,
      id: `ord_${orderNumber}`,
      orderNumber,
      paymentStatus,
      isDemo,
      orderStatus: rest.orderStatus ?? "new",
      cancellation: null,
      statusHistory: [],
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    this.rows.set(orderNumber, order);
    if (clientRequestId) this.requests.set(clientRequestId, orderNumber);
    return order;
  }

  async get(orderNumber: string): Promise<StoredOrder | null> {
    return this.rows.get(orderNumber) ?? null;
  }

  async list(q: OrderListQuery): Promise<OrderPage> {
    const matching = [...this.rows.values()]
      .filter((o) => !q.branchIds || (o.branchId !== null && q.branchIds.includes(o.branchId)))
      .filter((o) => (!q.from || o.deliveryDate >= q.from) && (!q.to || o.deliveryDate <= q.to))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const statusCounts: Partial<Record<OrderStatus, number>> = {};
    for (const o of matching) statusCounts[o.orderStatus] = (statusCounts[o.orderStatus] ?? 0) + 1;
    return { rows: matching.slice(q.offset, q.offset + q.limit), total: matching.length, statusCounts };
  }

  async changeStatus(req: StatusChangeRequest): Promise<StatusChangeResult> {
    const cur = this.rows.get(req.orderNumber) ?? null;
    const error = checkStatusChange(cur, req);
    if (error || !cur) return { ok: false, error: error ?? "NOT_FOUND" };

    const at = nowISO();
    const reason = req.toStatus === "cancelled" ? req.reason!.trim() : null;
    const next: StoredOrder = {
      ...cur,
      orderStatus: req.toStatus,
      cancellation: reason ? { reason, by: req.actor.name, at } : cur.cancellation,
      statusHistory: [
        ...cur.statusHistory,
        { fromStatus: cur.orderStatus, toStatus: req.toStatus, actorAccount: req.actor.account, actorName: req.actor.name, reason, at },
      ],
      updatedAt: at,
    };
    this.rows.set(req.orderNumber, next);
    return { ok: true, order: next };
  }
}

/** The in-memory store itself — the order engine writes here on a developer machine without Supabase. */
export const memoryOrders = new MockOrderRepository();

let repo: OrderRepository = memoryOrders;

export function setOrderRepository(next: OrderRepository): void {
  repo = next;
}
export function getOrderRepository(): OrderRepository {
  return repo;
}
