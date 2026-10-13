/**
 * Payment completion — server-only, prepared for the payment integration
 * (Aşama 9). Nothing calls `confirmOrderPayment` / `failOrderPayment` yet:
 * no provider is chosen and every order is a demo order (D8), which the
 * database refuses to mark paid.
 *
 * `completePointsOnlyOrder` finishes an order whose whole amount was paid
 * with Funda Puan (total 0) on the server (D37). It can't open anything the
 * gates keep closed: Funda Puan must be switched on, order intake must be
 * open (never in Production today), and the database accepts only a
 * non-demo order with total 0 and an active reservation.
 */

import { supabaseRest, isSupabaseConfigured } from "../supabase-server";
import { isFundaPointsActive } from "../funda-points/config";
import { isOrderIntakeOpen } from "./engine";

if (typeof window !== "undefined") {
  throw new Error("orders/payment.ts must never be imported on the client");
}

export type PaymentResult = {
  order_number: string;
  payment_status: string;
  points_redeemed?: number;
  points_earned?: number;
  points_status?: string;
};

export class PaymentClosedError extends Error {
  constructor(reason: string) {
    super(`PAYMENT_CLOSED: ${reason}`);
    this.name = "PaymentClosedError";
  }
}

/** Provider confirmed the payment: paid, reserved points captured, points earned (members). */
export async function confirmOrderPayment(orderNumber: string, method: string, reference: string): Promise<PaymentResult> {
  if (!isOrderIntakeOpen()) throw new PaymentClosedError("order intake closed");
  if (!isSupabaseConfigured()) throw new PaymentClosedError("no database");
  return supabaseRest<PaymentResult>("/rpc/complete_order_payment", {
    method: "POST",
    body: JSON.stringify({ p_order_number: orderNumber, p_method: method, p_reference: reference }),
  });
}

/** Provider reported a failed payment: the order's reserved points go back to their lots. */
export async function failOrderPayment(orderNumber: string): Promise<PaymentResult> {
  if (!isSupabaseConfigured()) throw new PaymentClosedError("no database");
  return supabaseRest<PaymentResult>("/rpc/fail_order_payment", {
    method: "POST",
    body: JSON.stringify({ p_order_number: orderNumber }),
  });
}

/** Whole amount paid with points (total 0): completed on the server, no provider involved. */
export async function completePointsOnlyOrder(orderNumber: string): Promise<PaymentResult> {
  if (!isFundaPointsActive()) throw new PaymentClosedError("funda points off");
  if (!isOrderIntakeOpen()) throw new PaymentClosedError("order intake closed");
  if (!isSupabaseConfigured()) throw new PaymentClosedError("no database");
  return supabaseRest<PaymentResult>("/rpc/complete_order_payment", {
    method: "POST",
    body: JSON.stringify({ p_order_number: orderNumber, p_method: "funda_points", p_reference: null }),
  });
}
