/**
 * Funda Puan rules (SUPABASE_PLAN.md D9, D31–D41). Client-safe.
 *
 * The ledger itself — lots, expiry, FEFO, reservations, reversals, debt —
 * lives in the database (supabase/migrations/0011_funda_points.sql). These
 * values are what the screens and the server's pre-checks use and must stay
 * equal to it.
 */
export const FUNDA_POINTS_RULES = {
  /** 10% as basis points of 10,000 — integer math only (see rules.ts) */
  earnRateBasisPoints: 1000,
  /** 1 puan = 1 TL (D9) */
  pointValueTL: 1,
  /** every earning is its own lot, valid one year from when it was earned (D34) */
  lotValidityLabel: "1 yıl",
  /** points taken for an unpaid order are held this long (create_order -> fp_reserve_for_order) */
  reservationHoldMinutes: 30,
} as const;

/** "10" — for display only ("%10 kazanım"), never used in the point math. */
export const FUNDA_POINTS_EARN_RATE_PERCENT_DISPLAY = FUNDA_POINTS_RULES.earnRateBasisPoints / 100;

/**
 * Earning and spending switch. OFF until the payment integration is done
 * (Aşama 9): points are earned when a payment is confirmed, and no order is
 * paid yet — every order is a demo order (D8, D13). Like the production
 * order-intake gate, this is a code change + deploy + separate approval,
 * never an environment variable or a request field. While off the server
 * refuses any points in an order or quote, checkout shows no points
 * control, and Hesabım says the programme isn't active yet.
 */
export function isFundaPointsActive(): boolean {
  return false;
}
