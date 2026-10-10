/**
 * Orders in Supabase — RPCs `list_orders` and `update_order_status`
 * (supabase/migrations/0007_orders_hardening.sql). Server-only: every call
 * goes through `supabaseRest`, which checks the project's environment marker
 * first. Branch scope is passed from the signed admin session and enforced
 * again inside the database functions.
 */
import type { OrderStatus, PaymentStatus, SalesChannel } from "../order";
import { SupabaseRestError, supabaseRest } from "../supabase-server";
import type {
  OrderListQuery,
  OrderPage,
  OrderRepository,
  StatusChangeError,
  StatusChangeRequest,
  StatusChangeResult,
  StoredOrder,
} from "./repository";

if (typeof window !== "undefined") {
  throw new Error("orders/supabase-repository.ts must never be imported on the client");
}

type Row = {
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  is_demo: boolean;
  sales_channel: SalesChannel;
  delivery_type: "delivery" | "pickup";
  branch_slug: string | null;
  delivery_zone_id: string | null;
  delivery_date: string;
  delivery_time_slot: string;
  subtotal: number | string;
  delivery_fee: number | string;
  discount: number | string;
  total: number | string;
  cancel_reason: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  customer: { full_name: string; phone: string; email: string } | null;
  address: {
    district: string;
    neighborhood: string;
    address_line: string;
    building: string | null;
    floor: string | null;
    apartment: string | null;
    note: string | null;
  } | null;
  items: {
    product_id: string;
    product_slug: string;
    product_name: string;
    variant_id: string | null;
    variant_label: string | null;
    quantity: number;
    unit_price: number | string;
    total_price: number | string;
    cake_message: string | null;
    extras: string[] | null;
    note: string | null;
  }[];
  events: {
    from_status: OrderStatus;
    to_status: OrderStatus;
    actor_account: string;
    actor_name: string;
    reason: string | null;
    created_at: string;
  }[];
};

type ListResult = { total: number; status_counts: Partial<Record<OrderStatus, number>>; rows: Row[] };

const opt = (v: string | null) => v ?? undefined;

function toStored(r: Row): StoredOrder {
  return {
    id: `ord_${r.order_number}`,
    orderNumber: r.order_number,
    branchId: r.branch_slug,
    deliveryZoneId: r.delivery_zone_id,
    fulfillmentType: r.delivery_type,
    salesChannel: r.sales_channel,
    customer: {
      fullName: r.customer?.full_name ?? "",
      phone: r.customer?.phone ?? "",
      email: r.customer?.email ?? "",
    },
    address: r.address
      ? {
          district: r.address.district,
          neighborhood: r.address.neighborhood,
          addressLine: r.address.address_line,
          building: opt(r.address.building),
          floor: opt(r.address.floor),
          apartment: opt(r.address.apartment),
          note: opt(r.address.note),
        }
      : null,
    items: r.items.map((i) => ({
      productId: i.product_id,
      productSlug: i.product_slug,
      productName: i.product_name,
      variantId: i.variant_id,
      variantLabel: i.variant_label,
      quantity: i.quantity,
      unitPrice: Number(i.unit_price),
      lineTotal: Number(i.total_price),
      cakeMessage: i.cake_message,
      extras: i.extras,
      note: i.note,
    })),
    deliveryDate: r.delivery_date,
    deliverySlot: r.delivery_time_slot,
    subtotal: Number(r.subtotal),
    deliveryFee: Number(r.delivery_fee),
    discount: Number(r.discount),
    total: Number(r.total),
    paymentStatus: r.payment_status,
    isDemo: r.is_demo !== false,
    orderStatus: r.status,
    cancellation:
      r.status === "cancelled" && r.cancel_reason
        ? { reason: r.cancel_reason, by: r.cancelled_by ?? "", at: r.cancelled_at ?? r.updated_at }
        : null,
    statusHistory: r.events.map((e) => ({
      fromStatus: e.from_status,
      toStatus: e.to_status,
      actorAccount: e.actor_account,
      actorName: e.actor_name,
      reason: e.reason,
      at: e.created_at,
    })),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** `raise exception` texts of update_order_status -> repository errors */
const STATUS_ERRORS: Record<string, StatusChangeError> = {
  order_not_found: "NOT_FOUND",
  forbidden_branch: "FORBIDDEN",
  order_closed: "ORDER_CLOSED",
  invalid_transition: "INVALID_TRANSITION",
  cancel_reason_required: "REASON_REQUIRED",
  cancel_reason_too_long: "REASON_REQUIRED",
};

export class SupabaseOrderRepository implements OrderRepository {
  readonly kind = "supabase" as const;

  private async call(q: OrderListQuery & { orderNumber?: string }): Promise<ListResult> {
    return supabaseRest<ListResult>("/rpc/list_orders", {
      method: "POST",
      body: JSON.stringify({
        p_branch_slugs: q.branchIds ?? null,
        p_from: q.from ?? null,
        p_to: q.to ?? null,
        p_limit: q.limit,
        p_offset: q.offset,
        p_order_number: q.orderNumber ?? null,
      }),
    });
  }

  async get(orderNumber: string): Promise<StoredOrder | null> {
    const res = await this.call({ limit: 1, offset: 0, orderNumber });
    return res.rows[0] ? toStored(res.rows[0]) : null;
  }

  async list(q: OrderListQuery): Promise<OrderPage> {
    const res = await this.call(q);
    return { rows: res.rows.map(toStored), total: Number(res.total), statusCounts: res.status_counts ?? {} };
  }

  async changeStatus(req: StatusChangeRequest): Promise<StatusChangeResult> {
    try {
      const row = await supabaseRest<Row | null>("/rpc/update_order_status", {
        method: "POST",
        body: JSON.stringify({
          p_order_number: req.orderNumber,
          p_to_status: req.toStatus,
          p_branch_slugs: req.branchIds,
          p_actor_account: req.actor.account,
          p_actor_name: req.actor.name,
          p_reason: req.reason,
        }),
      });
      if (!row) return { ok: false, error: "NOT_FOUND" };
      return { ok: true, order: toStored(row) };
    } catch (err) {
      const known = err instanceof SupabaseRestError && err.dbMessage ? STATUS_ERRORS[err.dbMessage] : undefined;
      if (known) return { ok: false, error: known };
      throw err;
    }
  }
}
