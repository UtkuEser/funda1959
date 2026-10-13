/**
 * Funda Puan types — the database ledger (0011) as the app sees it.
 * Client-safe.
 */

export type FundaPointTransactionType =
  | "EARN"
  | "REDEEM"
  | "REDEEM_RELEASE"
  | "REFUND"
  | "REVERSAL"
  | "EXPIRE"
  | "ADMIN_ADD"
  | "ADMIN_SUBTRACT";

/** Turkish labels — never show the raw type to anyone. */
export const FUNDA_POINT_TRANSACTION_LABEL_TR: Record<FundaPointTransactionType, string> = {
  EARN: "Online alışveriş kazanımı",
  REDEEM: "Siparişte kullanıldı",
  REDEEM_RELEASE: "Ödeme tamamlanmadı — iade edildi",
  REFUND: "Sipariş iptali — iade edildi",
  REVERSAL: "Sipariş iptali — kazanım geri alındı",
  EXPIRE: "Süresi doldu",
  ADMIN_ADD: "Merkez düzeltmesi (ekleme)",
  ADMIN_SUBTRACT: "Merkez düzeltmesi (düşüş)",
};

/** A spendable lot: what is left of one earning, and when it expires. */
export type FundaPointLot = {
  id: string;
  source: "earn" | "admin";
  points: number;
  remaining: number;
  earnedAt: string;
  expiresAt: string;
  orderNumber: string | null;
};

export type FundaPointTransaction = {
  id: string;
  type: FundaPointTransactionType;
  /** signed: positive credits, negative debits */
  points: number;
  /** a refund / release whose lot had already expired: these points did not come back */
  expiredPoints: number;
  orderNumber: string | null;
  availableAfter: number;
  debtAfter: number;
  createdAt: string;
  /** admin views only */
  reason?: string | null;
  actorName?: string | null;
};

/** A member's own points (Hesabım) — never the admin's name or reason. */
export type FundaPointsSummary = {
  /** spendable now (never below zero) */
  available: number;
  /** points owed after a cancelled order's earning had been spent (D39) */
  debt: number;
  /** spendable lots, soonest expiry first */
  lots: FundaPointLot[];
  /** newest first */
  transactions: FundaPointTransaction[];
};

export type FundaPointsAdminRow = {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  available: number;
  debt: number;
  earned: number;
  spent: number;
  /** null: a member found by search who has no point activity yet */
  lastActivity: string | null;
};

export type FundaPointsOverview = {
  available: number;
  debt: number;
  earned: number;
  spent: number;
  membersWithPoints: number;
};

export type FundaPointsAdminDetail = FundaPointsSummary & {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
};

/** Merkez correction (D40): signed by the session's admin, with a reason. */
export type AdjustPointsInput = {
  userId: string;
  direction: "add" | "subtract";
  points: number;
  reason: string;
  /** idempotency key — a repeated submit is applied once */
  requestId: string;
};

export type AdjustPointsError =
  | "INVALID"
  | "REASON_REQUIRED"
  | "INSUFFICIENT_POINTS"
  | "MEMBER_NOT_FOUND"
  | "FORBIDDEN"
  | "UNAVAILABLE"
  | "NOT_READY";
