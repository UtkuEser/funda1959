/**
 * Server-only Supabase access via the PostgREST endpoint. No SDK dependency.
 * The service-role key is read here and MUST NOT be imported into any client
 * component / "use client" module.
 */

import type { OrderStatus, OrderSummary } from "./order";

if (typeof window !== "undefined") {
  throw new Error("supabase-server.ts must never be imported on the client");
}

function baseUrl(): string {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("SUPABASE_URL is not configured");
  return url.replace(/\/+$/, "");
}

function serviceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return key;
}

async function rest<T>(path: string, init?: RequestInit): Promise<T> {
  const key = serviceKey();
  const res = await fetch(`${baseUrl()}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Supabase ${res.status}: ${text.slice(0, 500)}`);
  }
  return (text ? JSON.parse(text) : null) as T;
}

type PublicOrderRow = {
  order_number: string;
  status: OrderStatus;
  delivery_type: "delivery" | "pickup";
  delivery_date: string;
  delivery_time_slot: string;
  total: number | string;
  branch_name: string | null;
};

function toSummary(row: PublicOrderRow | null): OrderSummary | null {
  if (!row || !row.order_number) return null;
  return {
    orderNumber: row.order_number,
    status: row.status,
    deliveryType: row.delivery_type,
    deliveryDate: row.delivery_date,
    deliveryTimeSlot: row.delivery_time_slot,
    branchName: row.branch_name,
    total: Number(row.total),
  };
}

/** Atomic order creation via the security-definer RPC. */
export async function createOrder(payload: unknown): Promise<OrderSummary> {
  const row = await rest<PublicOrderRow | null>("/rpc/create_order", {
    method: "POST",
    body: JSON.stringify({ p_payload: payload }),
  });
  const summary = toSummary(row);
  if (!summary) throw new Error("create_order returned no summary");
  return summary;
}

/** PII-free order summary for the confirmation page. */
export async function getOrderSummary(orderNumber: string): Promise<OrderSummary | null> {
  const row = await rest<PublicOrderRow | null>("/rpc/get_order_public", {
    method: "POST",
    body: JSON.stringify({ p_order_number: orderNumber }),
  });
  return toSummary(row);
}
