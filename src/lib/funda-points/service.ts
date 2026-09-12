/**
 * Funda Puan domain service — earning rate, eligible-amount calculation,
 * the online-only channel rule, and the award/reverse/adjust/redeem ledger
 * operations. Also the SUPER_ADMIN access boundary for admin reads/writes:
 * see "Admin access boundary" below — hiding the sidebar item is not
 * enough, these functions refuse a BRANCH_MANAGER role outright.
 */

import type { AdminRole } from "../admin/access";
import type { StoredOrder } from "../orders/repository";
import type { SalesChannel } from "../order";
import { getFundaPointsConfig } from "./config";
import { getFundaPointsRepository } from "./repository";
import type {
  AdjustPointsInput,
  AdjustPointsResult,
  AwardPointsResult,
  FundaPointAccount,
  FundaPointTransaction,
  RedeemPointsInput,
  RedeemPointsResult,
  ReversePointsResult,
} from "./types";

/* -------------------------------------------------------------------------- */
/* Sales channel                                                              */
/* -------------------------------------------------------------------------- */

/** Orders from before `salesChannel` existed default to "web" (today's only channel). */
export function resolveOrderSalesChannel(order: Pick<StoredOrder, "salesChannel">): SalesChannel {
  return order.salesChannel ?? "web";
}

export function isOnlineSalesChannel(channel: SalesChannel): boolean {
  return channel !== "store";
}

/** Funda Puan can only be redeemed online — never at a physical till/POS. */
export function canRedeemFundaPoints(input: { salesChannel: SalesChannel }): boolean {
  return isOnlineSalesChannel(input.salesChannel);
}

/* -------------------------------------------------------------------------- */
/* Money / points math — integer kuruş only, one rounding rule               */
/* -------------------------------------------------------------------------- */

/** ₺ -> kuruş. Exact for the whole/near-whole TL amounts this project uses. */
function toKurus(amountTL: number): number {
  return Math.round(amountTL * 100);
}

/**
 * Points earned for an eligible TL amount, at the configured basis-point
 * rate — computed entirely in integer kuruş so it never drifts the way
 * `amount * 0.10` can. This is the only place rounding happens (floor);
 * do not re-implement the earn calculation anywhere else.
 */
export function calculateEarnedPoints(eligibleAmountTL: number): number {
  const kurus = toKurus(eligibleAmountTL);
  if (kurus <= 0) return 0;
  const { earnRateBasisPoints } = getFundaPointsConfig();
  // kurus * (basisPoints / 10_000) / 100  ==  kurus * basisPoints / 1_000_000
  return Math.floor((kurus * earnRateBasisPoints) / 1_000_000);
}

/**
 * The TL amount that earns Funda Puan: product subtotal minus discounts
 * minus any Funda Puan already redeemed on this order (so redeemed points
 * never re-earn points) — delivery fee is always excluded. Never negative.
 */
export function getEligibleFundaPointAmount(order: {
  subtotal: number;
  discount: number;
  pointsRedeemedAmount?: number;
}): number {
  const eligible = order.subtotal - order.discount - (order.pointsRedeemedAmount ?? 0);
  return Math.max(0, eligible);
}

/* -------------------------------------------------------------------------- */
/* Customer identity — bridge to a real customer/account system later        */
/* -------------------------------------------------------------------------- */

/**
 * No registered-customer/auth model exists yet in this project, so Funda
 * Puan keys accounts off the checkout phone number (normalized to its last
 * 10 digits). Everything downstream keys off `customerId` only — swap this
 * one function for a real customer id once accounts/auth ship. Guest
 * checkout is intentionally still covered here (phone is always collected
 * at checkout); a later "registered vs. guest" split can gate this instead.
 */
export function resolveCustomerId(customer: { phone: string }): string | null {
  const digits = customer.phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const normalized = digits.slice(-10);
  return `cust_${normalized}`;
}

/* -------------------------------------------------------------------------- */
/* Ledger operations                                                          */
/* -------------------------------------------------------------------------- */

function purchaseEarnKey(orderId: string): string {
  return `${orderId}:PURCHASE_EARN`;
}
function refundReversalKey(orderId: string): string {
  return `${orderId}:REFUND_REVERSAL`;
}

/**
 * Awards Funda Puan for a successfully created order. Idempotent: calling
 * this twice for the same order writes at most one PURCHASE_EARN
 * transaction (unique business key `<orderId>:PURCHASE_EARN`, enforced in
 * the repository).
 *
 * Never throws for expected non-award outcomes (offline channel, no
 * resolvable customer, zero eligible points) — the order engine must not
 * let Funda Puan bookkeeping fail order creation. Callers should still
 * wrap this in try/catch for genuine ledger errors.
 */
export function awardPointsForOrder(order: StoredOrder): AwardPointsResult {
  const channel = resolveOrderSalesChannel(order);
  if (!isOnlineSalesChannel(channel)) return { awarded: false, reason: "OFFLINE_CHANNEL" };

  const repo = getFundaPointsRepository();
  const businessKey = purchaseEarnKey(order.id);
  const existing = repo.findTransactionByBusinessKey(businessKey);
  if (existing) return { awarded: false, reason: "ALREADY_AWARDED", transaction: existing };

  const customerId = resolveCustomerId(order.customer);
  if (!customerId) return { awarded: false, reason: "NO_CUSTOMER" };

  const eligibleAmount = getEligibleFundaPointAmount(order);
  const points = calculateEarnedPoints(eligibleAmount);
  if (points <= 0) return { awarded: false, reason: "ZERO_POINTS" };

  const transaction = repo.appendTransaction({
    customerId,
    type: "PURCHASE_EARN",
    points,
    orderId: order.id,
    orderNumber: order.orderNumber,
    businessKey,
    description: `Online alışveriş — ${order.orderNumber}`,
    customer: {
      name: order.customer.fullName,
      phone: order.customer.phone,
      email: order.customer.email,
    },
  });

  return { awarded: true, transaction };
}

/**
 * Reverses previously-earned Funda Puan for an order (e.g. on refund).
 * Idempotent: a second call finds the existing reversal and no-ops rather
 * than reversing twice.
 *
 * `points` is a partial-refund extension point: pass the portion to claw
 * back (capped at what was actually earned); omit it for a full reversal.
 * No payment-provider/refund integration is wired to this in this round —
 * callers trigger it manually.
 */
export function reversePointsForOrder(orderId: string, points?: number): ReversePointsResult {
  const repo = getFundaPointsRepository();
  const earn = repo.findTransactionByBusinessKey(purchaseEarnKey(orderId));
  if (!earn) return { reversed: false, reason: "NO_EARN_FOUND" };

  const reversalKey = refundReversalKey(orderId);
  if (repo.findTransactionByBusinessKey(reversalKey)) {
    return { reversed: false, reason: "ALREADY_REVERSED" };
  }

  const reverseAmount = Math.max(0, Math.min(earn.points, points ?? earn.points));

  const transaction = repo.appendTransaction({
    customerId: earn.customerId,
    type: "REFUND_REVERSAL",
    points: -reverseAmount,
    orderId,
    orderNumber: earn.orderNumber,
    businessKey: reversalKey,
    description: `İade nedeniyle geri alındı — ${earn.orderNumber ?? orderId}`,
  });

  return { reversed: true, transaction };
}

/**
 * SUPER_ADMIN manual correction ("Puan Düzenle"). Always a signed +/- op
 * against the ledger, never a raw balance overwrite, and never allowed to
 * take the balance negative.
 */
export function adjustPoints(input: AdjustPointsInput): AdjustPointsResult {
  const points = Math.floor(input.points);
  if (!Number.isFinite(points) || points <= 0) return { ok: false, reason: "INVALID_POINTS" };

  const repo = getFundaPointsRepository();
  const account = repo.getAccount(input.customerId);

  if (input.direction === "subtract") {
    if (!account || account.balance < points) return { ok: false, reason: "INSUFFICIENT_BALANCE" };
  } else if (!account) {
    return { ok: false, reason: "ACCOUNT_NOT_FOUND" };
  }

  const signedPoints = input.direction === "add" ? points : -points;
  const transaction = repo.appendTransaction({
    customerId: input.customerId,
    type: "ADMIN_ADJUSTMENT",
    points: signedPoints,
    description: input.description,
  });

  return { ok: true, transaction };
}

/**
 * Redemption scaffold — not wired into checkout this round (no points-as-
 * discount UI yet). Online-only and cannot overdraw the balance, so
 * checkout can call this directly once that UI ships.
 */
export function redeemPoints(input: RedeemPointsInput): RedeemPointsResult {
  if (!canRedeemFundaPoints({ salesChannel: input.salesChannel })) {
    return { ok: false, reason: "OFFLINE_CHANNEL" };
  }
  const points = Math.floor(input.points);
  if (!Number.isFinite(points) || points <= 0) return { ok: false, reason: "INVALID_POINTS" };

  const repo = getFundaPointsRepository();
  const account = repo.getAccount(input.customerId);
  if (!account) return { ok: false, reason: "ACCOUNT_NOT_FOUND" };
  if (account.balance < points) return { ok: false, reason: "INSUFFICIENT_BALANCE" };

  const transaction = repo.appendTransaction({
    customerId: input.customerId,
    type: "REDEEM",
    points: -points,
    orderId: input.orderId ?? null,
    orderNumber: input.orderNumber ?? null,
    description: input.description ?? "Funda Puan kullanımı",
  });

  return { ok: true, transaction };
}

/* -------------------------------------------------------------------------- */
/* Reads (unscoped — for system/internal callers, e.g. a future "my points") */
/* -------------------------------------------------------------------------- */

export function getPointAccount(customerId: string): FundaPointAccount | null {
  return getFundaPointsRepository().getAccount(customerId);
}

export function listPointAccounts(): FundaPointAccount[] {
  return getFundaPointsRepository().listAccounts();
}

export function getPointTransactions(customerId: string): FundaPointTransaction[] {
  return getFundaPointsRepository().listTransactions(customerId);
}

/* -------------------------------------------------------------------------- */
/* Admin access boundary                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Funda Puan is a SUPER_ADMIN-only module: a BRANCH_MANAGER must not be
 * able to read it even via a direct function/repository call, not just a
 * hidden sidebar item. Every admin-facing read/write below asserts this.
 */
export class FundaPointsAccessError extends Error {
  constructor() {
    super("FUNDA_POINTS_FORBIDDEN");
    this.name = "FundaPointsAccessError";
  }
}

function assertSuperAdmin(role: AdminRole): void {
  if (role !== "SUPER_ADMIN") throw new FundaPointsAccessError();
}

export type FundaPointsOverview = {
  totalBalance: number;
  totalEarned: number;
  totalSpent: number;
  customersWithPoints: number;
};

export function getFundaPointsOverview(role: AdminRole): FundaPointsOverview {
  assertSuperAdmin(role);
  const accounts = listPointAccounts();
  return {
    totalBalance: accounts.reduce((sum, a) => sum + a.balance, 0),
    totalEarned: accounts.reduce((sum, a) => sum + a.lifetimeEarned, 0),
    totalSpent: accounts.reduce((sum, a) => sum + a.lifetimeSpent, 0),
    customersWithPoints: accounts.filter((a) => a.balance > 0).length,
  };
}

export function listPointAccountsForAdmin(role: AdminRole): FundaPointAccount[] {
  assertSuperAdmin(role);
  return listPointAccounts();
}

export function getCustomerPointDetailForAdmin(
  role: AdminRole,
  customerId: string,
): { account: FundaPointAccount; transactions: FundaPointTransaction[] } | null {
  assertSuperAdmin(role);
  const account = getPointAccount(customerId);
  if (!account) return null;
  return { account, transactions: getPointTransactions(customerId) };
}

export function adjustPointsAsAdmin(role: AdminRole, input: AdjustPointsInput): AdjustPointsResult {
  assertSuperAdmin(role);
  return adjustPoints(input);
}
