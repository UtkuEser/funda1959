/**
 * In-memory hand-off between /checkout and /hizli-siparis-odeme.
 *
 * Holds the (non-sensitive) order request the checkout form produced plus a
 * short display summary for the payment screen. Deliberately NOT persisted —
 * it lives only for the current client-side navigation. A full page reload
 * clears it and /hizli-siparis-odeme degrades gracefully (order summary still comes from the
 * cart; "Düzenle" sends the user back to /checkout).
 *
 * Card data is NEVER stored here — or anywhere outside React component state.
 *
 * When a real payment provider is integrated, order creation moves to the
 * payment-success step and `request` is exactly what gets submitted there.
 */

import type { CreateOrderRequest } from "./order";

export type CheckoutHandoffSummary = {
  fullName: string;
  phone: string;
  /** "Adrese Teslim" | "Mağazadan Teslim" */
  deliveryLabel: string;
  /** full address line, or the branch name for pickup */
  addressText: string | null;
  /** ISO date */
  date: string;
  timeSlot: string | null;
};

export type CheckoutHandoff = {
  request: CreateOrderRequest;
  summary: CheckoutHandoffSummary;
};

let handoff: CheckoutHandoff | null = null;

export function setCheckoutHandoff(next: CheckoutHandoff | null): void {
  handoff = next;
}

export function getCheckoutHandoff(): CheckoutHandoff | null {
  return handoff;
}
