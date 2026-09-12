/**
 * Order repository abstraction.
 *
 * The checkout/payment flow talks to `getOrderRepository()`, never Supabase or
 * an array directly. `MockOrderRepository` is an in-memory store used while
 * Supabase is not wired; a `SupabaseOrderRepository` slots in with the same
 * interface later. `/hesabim/siparislerim` will read through the same seam.
 */

import type { CheckoutAddress, OrderStatus, OrderSummary, PaymentStatus, SalesChannel } from "../order";
import { generateOrderReference } from "../order";
import { getBranch } from "../branch";

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

export type StoredOrder = {
  id: string;
  orderNumber: string;
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
  orderStatus: OrderStatus;
  reservationId: string | null;
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
  };
}

/* -------------------------------------------------------------------------- */

export interface OrderRepository {
  create(input: NewOrderInput): StoredOrder;
  get(orderNumber: string): StoredOrder | null;
  list(scope?: { authorizedBranchIds?: string[] }): StoredOrder[];
  updateStatus(orderNumber: string, status: OrderStatus): StoredOrder | null;
}

export type NewOrderInput = Omit<
  StoredOrder,
  "id" | "orderNumber" | "createdAt" | "updatedAt" | "paymentStatus" | "orderStatus"
> & {
  paymentStatus?: PaymentStatus;
  orderStatus?: OrderStatus;
};

const nowISO = () => new Date().toISOString();

/**
 * In-memory store. Kept on `globalThis` so a Route Handler and a Server
 * Component in the same Node process share the same rows (Next may load the
 * module into separate registries per entry otherwise).
 */
const globalStore = globalThis as unknown as { __fundaOrders?: Map<string, StoredOrder> };
globalStore.__fundaOrders ??= new Map<string, StoredOrder>();

class MockOrderRepository implements OrderRepository {
  private readonly rows = globalStore.__fundaOrders!;

  create(input: NewOrderInput): StoredOrder {
    const orderNumber = generateOrderReference();
    const order: StoredOrder = {
      ...input,
      id: `ord_${orderNumber}`,
      orderNumber,
      paymentStatus: input.paymentStatus ?? "paid",
      orderStatus: input.orderStatus ?? "new",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    this.rows.set(orderNumber, order);
    return order;
  }

  get(orderNumber: string): StoredOrder | null {
    return this.rows.get(orderNumber) ?? null;
  }

  list(scope?: { authorizedBranchIds?: string[] }): StoredOrder[] {
    const all = [...this.rows.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (!scope?.authorizedBranchIds) return all;
    const allow = new Set(scope.authorizedBranchIds);
    return all.filter((o) => o.branchId && allow.has(o.branchId));
  }

  updateStatus(orderNumber: string, status: OrderStatus): StoredOrder | null {
    const cur = this.rows.get(orderNumber);
    if (!cur) return null;
    const next = { ...cur, orderStatus: status, updatedAt: nowISO() };
    this.rows.set(orderNumber, next);
    return next;
  }
}

let repo: OrderRepository = new MockOrderRepository();

export function setOrderRepository(next: OrderRepository): void {
  repo = next;
}
export function getOrderRepository(): OrderRepository {
  return repo;
}
