/**
 * Order types.
 *
 * `OrderDraft` = the shape the checkout form assembles before submit.
 * `CreateOrderRequest` = what the client POSTs to /api/orders.
 * `OrderSummary` / persistence types = the real, server-owned order.
 * These are deliberately kept separate.
 */

export type CheckoutAddress = {
  district: string;
  neighborhood: string;
  addressLine: string;
  building?: string;
  floor?: string;
  apartment?: string;
  note?: string;
};

export type OrderCustomer = {
  fullName: string;
  phone: string;
  email: string;
};

export type OrderItem = {
  productId: string;
  slug: string;
  productName: string;
  image: string;
  variantLabel: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  customization: { message?: string; note?: string; extras: string[] };
};

export type OrderDelivery = {
  type: "delivery" | "pickup";
  branch?: string;
  address?: CheckoutAddress;
  date: string;
  timeSlot: string;
  deliveryFee: number;
};

/** Pre-submit form assembly (client-side only, not persisted). */
export type OrderDraft = {
  customer: OrderCustomer;
  items: OrderItem[];
  delivery: OrderDelivery;
  subtotal: number;
  discount: number;
  total: number;
  orderNote?: string;
};

/* -------------------------------------------------------------------------- */
/* Persistence model                                                          */
/* -------------------------------------------------------------------------- */

export type OrderStatus =
  | "new"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

/** Non-sensitive order info — safe to render on the confirmation page. */
export type OrderSummary = {
  orderNumber: string;
  status: OrderStatus;
  deliveryType: "delivery" | "pickup";
  deliveryDate: string;
  deliveryTimeSlot: string;
  branchName: string | null;
  total: number;
};

/* -------------------------------------------------------------------------- */
/* API contract — POST /api/orders                                            */
/* -------------------------------------------------------------------------- */

export type CreateOrderRequestItem = {
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string | null;
  variantLabel: string | null;
  quantity: number;
  /** advisory only — the server re-prices from its own product data */
  unitPrice: number;
  cakeMessage?: string;
  extras?: string[];
  note?: string;
};

export type CreateOrderRequest = {
  clientRequestId: string;
  customer: OrderCustomer;
  delivery: {
    type: "delivery" | "pickup";
    branchSlug: string | null;
    date: string;
    timeSlot: string;
    address: CheckoutAddress | null;
  };
  items: CreateOrderRequestItem[];
  orderNote?: string;
};

export type CreateOrderResult =
  | { ok: true; order: OrderSummary }
  | { ok: false; error: string };

/* -------------------------------------------------------------------------- */
/* Demo helper — kept for local testing / fallback only. Production checkout   */
/* uses the server-generated order number, never this.                        */
/* -------------------------------------------------------------------------- */

export function generateOrderReference(date: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const stamp = `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}`;
  let suffix = "";
  for (let i = 0; i < 4; i += 1) {
    suffix += Math.floor(Math.random() * 36)
      .toString(36)
      .toUpperCase();
  }
  return `FND-${stamp}-${suffix}`;
}
