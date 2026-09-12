/**
 * Funda Puan domain types.
 *
 * Ledger-based: a customer's balance is never written directly — it is
 * always the result of appending a `FundaPointTransaction`. See
 * `repository.ts` (the append + recompute path) and `service.ts` (the
 * business rules that decide when/how much to append).
 */

import type { SalesChannel } from "../order";

export type { SalesChannel };

export type FundaPointTransactionType =
  | "PURCHASE_EARN"
  | "REDEEM"
  | "REFUND_REVERSAL"
  | "ADMIN_ADJUSTMENT"
  | "EXPIRED";

/** Turkish labels for the admin UI — never show the raw enum to a user. */
export const FUNDA_POINT_TRANSACTION_LABEL_TR: Record<FundaPointTransactionType, string> = {
  PURCHASE_EARN: "Online alışveriş kazanımı",
  REDEEM: "Funda Puan kullanımı",
  REFUND_REVERSAL: "İade nedeniyle geri alındı",
  ADMIN_ADJUSTMENT: "Merkez düzeltmesi",
  EXPIRED: "Süresi doldu",
};

export type FundaPointAccount = {
  customerId: string;
  /** denormalized display copy — no separate customer directory exists yet */
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  createdAt: string;
  updatedAt: string;
};

export type FundaPointTransaction = {
  id: string;
  customerId: string;
  type: FundaPointTransactionType;
  /** signed: positive credits the balance, negative debits it */
  points: number;
  balanceAfter: number;
  orderId?: string | null;
  orderNumber?: string | null;
  /** idempotency key, e.g. "<orderId>:PURCHASE_EARN" — unique per repository */
  businessKey?: string | null;
  description?: string | null;
  createdAt: string;
};

export type NewFundaPointTransactionInput = {
  customerId: string;
  type: FundaPointTransactionType;
  points: number;
  orderId?: string | null;
  orderNumber?: string | null;
  businessKey?: string | null;
  description?: string | null;
  /** used only to create the account on its first transaction */
  customer?: { name: string; phone: string; email: string };
};

export type AwardPointsResult =
  | { awarded: true; transaction: FundaPointTransaction }
  | {
      awarded: false;
      reason: "OFFLINE_CHANNEL" | "NO_CUSTOMER" | "ZERO_POINTS" | "ALREADY_AWARDED";
      transaction?: FundaPointTransaction;
    };

export type ReversePointsResult =
  | { reversed: true; transaction: FundaPointTransaction }
  | { reversed: false; reason: "NO_EARN_FOUND" | "ALREADY_REVERSED" };

export type AdjustPointsInput = {
  customerId: string;
  direction: "add" | "subtract";
  points: number;
  description: string;
};

export type AdjustPointsResult =
  | { ok: true; transaction: FundaPointTransaction }
  | { ok: false; reason: "INVALID_POINTS" | "INSUFFICIENT_BALANCE" | "ACCOUNT_NOT_FOUND" };

export type RedeemPointsInput = {
  customerId: string;
  points: number;
  salesChannel: SalesChannel;
  orderId?: string | null;
  orderNumber?: string | null;
  description?: string | null;
};

export type RedeemPointsResult =
  | { ok: true; transaction: FundaPointTransaction }
  | {
      ok: false;
      reason: "OFFLINE_CHANNEL" | "INVALID_POINTS" | "INSUFFICIENT_BALANCE" | "ACCOUNT_NOT_FOUND";
    };
