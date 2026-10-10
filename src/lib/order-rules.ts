/**
 * Order-level rules shared by the browser (cart, quick order, checkout) and
 * the server (quote, order creation). Client-safe: no server imports.
 *
 * Minimum order (SUPABASE_PLAN.md, D14): delivery orders only, 500 TL on
 * products − discount; the delivery fee does not count; pickup is exempt.
 * The same 500 is checked again inside `create_order` (migration 0008) —
 * change both together. How Funda Puan affects the minimum is open (A13).
 */

export const MIN_DELIVERY_ORDER_TL = 500;

/** money in kuruş precision — avoids 0.1 + 0.2 style drift in sums and checks */
export const roundMoney = (v: number): number => Math.round(v * 100) / 100;

/** How much is missing for the delivery minimum (0 = fine, always 0 for pickup). */
export function deliveryMinimumShortfall(
  fulfillmentType: "delivery" | "pickup",
  subtotal: number,
  discount = 0,
): number {
  if (fulfillmentType !== "delivery") return 0;
  const base = roundMoney(subtotal - discount);
  return base >= MIN_DELIVERY_ORDER_TL ? 0 : roundMoney(MIN_DELIVERY_ORDER_TL - base);
}
