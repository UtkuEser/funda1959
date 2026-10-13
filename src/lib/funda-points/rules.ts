/**
 * Funda Puan arithmetic shared by the screens and the server (D9, D33–D36).
 * Client-safe, integer kuruş math — the same results as the database's exact
 * numeric math in 0011 (floor of 10% of the product amount left after
 * discount and points).
 */
import { FUNDA_POINTS_RULES } from "./config";
import type { SalesChannel } from "../order";

/** ₺ -> kuruş, exact for the 2-decimal amounts this project uses. */
function toKurus(amountTL: number): number {
  return Math.round(amountTL * 100);
}

/** Only online orders earn or spend points; a till / store sale never does. */
export function isOnlineSalesChannel(channel: SalesChannel): boolean {
  return channel !== "store";
}

/**
 * The amount points are earned on: products − discount − points spent on the
 * order. The delivery fee never counts. Example: 1.000 TL products, 200
 * points spent -> 800 TL.
 */
export function getEligibleFundaPointAmount(order: { subtotal: number; discount: number; pointsRedeemed?: number }): number {
  const kurus = toKurus(order.subtotal) - toKurus(order.discount) - toKurus(order.pointsRedeemed ?? 0);
  return Math.max(0, kurus) / 100;
}

/** floor(10% of the eligible amount) — 800 TL -> 80, 785 TL -> 78, 598,80 TL -> 59. */
export function calculateEarnedPoints(eligibleAmountTL: number): number {
  const kurus = toKurus(eligibleAmountTL);
  if (kurus <= 0) return 0;
  // kurus * (basisPoints / 10_000) / 100  ==  kurus * basisPoints / 1_000_000
  return Math.floor((kurus * FUNDA_POINTS_RULES.earnRateBasisPoints) / 1_000_000);
}

/**
 * The most points an order can use: the whole product amount after discount
 * (never the delivery fee), in whole points — a kuruş remainder is paid —
 * and never more than the member's spendable balance.
 */
export function maxRedeemablePoints(order: { subtotal: number; discount: number }, available: number): number {
  const productKurus = Math.max(0, toKurus(order.subtotal) - toKurus(order.discount));
  const byProducts = Math.floor(productKurus / 100 / FUNDA_POINTS_RULES.pointValueTL);
  return Math.max(0, Math.min(byProducts, Math.floor(available)));
}
