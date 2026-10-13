/**
 * Funda Puan in the database (migration 0011) — server-only.
 *
 * Every call is an RPC through `supabaseRest` (service role + the test /
 * production environment marker check). The rules — lots, expiry, FEFO,
 * reservations, reversals, debt, idempotency — are inside those functions;
 * nothing here recomputes a balance. The member's id always comes from the
 * caller's verified session (customer) or the admin route (Merkez).
 *
 * Without Supabase (a developer machine) there is no ledger: reads are empty
 * and writes are refused — there is no in-memory stand-in any more.
 */

import { isSupabaseConfigured, SupabaseRestError, supabaseRest } from "../supabase-server";
import type {
  AdjustPointsError,
  AdjustPointsInput,
  FundaPointLot,
  FundaPointsAdminDetail,
  FundaPointsAdminRow,
  FundaPointsOverview,
  FundaPointsSummary,
  FundaPointTransaction,
  FundaPointTransactionType,
} from "./types";

if (typeof window !== "undefined") {
  throw new Error("funda-points/store.ts must never be imported on the client");
}

/** Migration 0011 isn't applied to the connected project. */
export class FundaPointsNotReadyError extends Error {
  constructor(detail: string) {
    super(`funda points tables/functions missing (0011) — ${detail}`);
    this.name = "FundaPointsNotReadyError";
  }
}

type LotRow = {
  id: string;
  source: "earn" | "admin";
  points: number;
  remaining: number;
  earned_at: string;
  expires_at: string;
  order_number: string | null;
};
type TxRow = {
  id: number | string;
  type: FundaPointTransactionType;
  points: number;
  expired_points: number;
  order_number: string | null;
  available_after: number;
  debt_after: number;
  created_at: string;
  reason?: string | null;
  actor_name?: string | null;
};
type SummaryRow = { available: number; debt: number; lots: LotRow[]; transactions: TxRow[] };
type DetailRow = SummaryRow & { user_id: string; full_name: string; email: string; phone: string };
type ListRow = {
  total: number;
  overview: { available: number; debt: number; earned: number; spent: number; members_with_points: number };
  rows: {
    user_id: string;
    full_name: string;
    email: string;
    phone: string;
    available: number;
    debt: number;
    earned: number;
    spent: number;
    last_activity: string;
  }[];
};
type ProfileRow = { auth_user_id: string; full_name: string; email: string; phone: string };

const toLot = (l: LotRow): FundaPointLot => ({
  id: l.id,
  source: l.source,
  points: l.points,
  remaining: l.remaining,
  earnedAt: l.earned_at,
  expiresAt: l.expires_at,
  orderNumber: l.order_number,
});

function toTx(t: TxRow, admin: boolean): FundaPointTransaction {
  const base: FundaPointTransaction = {
    id: String(t.id),
    type: t.type,
    points: t.points,
    expiredPoints: t.expired_points ?? 0,
    orderNumber: t.order_number,
    availableAfter: t.available_after,
    debtAfter: t.debt_after,
    createdAt: t.created_at,
  };
  return admin ? { ...base, reason: t.reason ?? null, actorName: t.actor_name ?? null } : base;
}

const toSummary = (r: SummaryRow | null, admin = false): FundaPointsSummary => ({
  available: r?.available ?? 0,
  debt: r?.debt ?? 0,
  lots: (r?.lots ?? []).map(toLot),
  transactions: (r?.transactions ?? []).map((t) => toTx(t, admin)),
});

const EMPTY: FundaPointsSummary = { available: 0, debt: 0, lots: [], transactions: [] };

function notReady(err: unknown): boolean {
  return (
    err instanceof SupabaseRestError &&
    (err.status === 404 || err.code === "PGRST202" || err.code === "PGRST205" || err.code === "42P01" || err.code === "42883")
  );
}

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  try {
    return await supabaseRest<T>(`/rpc/${name}`, { method: "POST", body: JSON.stringify(args) });
  } catch (err) {
    if (notReady(err)) throw new FundaPointsNotReadyError(`${name}: ${(err as Error).message.slice(0, 160)}`);
    throw err;
  }
}

/** `raise exception` texts of adjust_funda_points -> app errors */
const ADJUST_ERRORS: Record<string, AdjustPointsError> = {
  forbidden: "FORBIDDEN",
  missing_request_id: "INVALID",
  invalid_points: "INVALID",
  reason_required: "REASON_REQUIRED",
  member_not_found: "MEMBER_NOT_FOUND",
  insufficient_points: "INSUFFICIENT_POINTS",
};

export type FundaPointsStore = {
  readonly kind: "supabase" | "none";
  summary(userId: string, limit?: number): Promise<FundaPointsSummary>;
  adminList(q: { search?: string | null; limit: number; offset: number }): Promise<{
    total: number;
    overview: FundaPointsOverview;
    rows: FundaPointsAdminRow[];
  }>;
  /** Merkez search over every member, with or without a points account. Reads only. */
  adminSearch(q: { search: string; limit: number }): Promise<FundaPointsAdminRow[]>;
  adminDetail(userId: string): Promise<FundaPointsAdminDetail | null>;
  adjust(
    input: AdjustPointsInput,
    actor: { account: string; name: string },
  ): Promise<{ ok: true; detail: FundaPointsAdminDetail } | { ok: false; error: AdjustPointsError }>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toAdminRow = (x: ListRow["rows"][number]): FundaPointsAdminRow => ({
  userId: x.user_id,
  fullName: x.full_name,
  email: x.email,
  phone: x.phone,
  available: x.available,
  debt: x.debt,
  earned: x.earned,
  spent: x.spent,
  lastActivity: x.last_activity,
});

/**
 * Search text as an ILIKE fragment: `%`, `_` and `\` match themselves. `*` is
 * PostgREST's wildcard and can't be escaped there, so it is dropped.
 */
function likeTerm(search: string): string {
  return search.replace(/\*/g, "").trim().slice(0, 100).replace(/[\\%_]/g, "\\$&");
}

/** `*term*` as a quoted PostgREST value (commas, parentheses are safe inside). */
const quotedPattern = (like: string) => `"*${like.replace(/[\\"]/g, "\\$&")}*"`;

function toDetail(r: DetailRow): FundaPointsAdminDetail {
  return { ...toSummary(r, true), userId: r.user_id, fullName: r.full_name, email: r.email, phone: r.phone };
}

export const supabaseFundaPointsStore: FundaPointsStore = {
  kind: "supabase",

  async summary(userId, limit = 50) {
    if (!UUID.test(userId)) return EMPTY;
    return toSummary(await rpc<SummaryRow | null>("get_funda_points_summary", { p_user_id: userId, p_limit: limit }));
  },

  async adminList({ search = null, limit, offset }) {
    const r = await rpc<ListRow>("list_funda_point_accounts", { p_search: search || null, p_limit: limit, p_offset: offset });
    return {
      total: Number(r?.total ?? 0),
      overview: {
        available: Number(r?.overview?.available ?? 0),
        debt: Number(r?.overview?.debt ?? 0),
        earned: Number(r?.overview?.earned ?? 0),
        spent: Number(r?.overview?.spent ?? 0),
        membersWithPoints: Number(r?.overview?.members_with_points ?? 0),
      },
      rows: (r?.rows ?? []).map(toAdminRow),
    };
  },

  async adminSearch({ search, limit }) {
    // list_funda_point_accounts only knows members with a points account, so
    // a member who never had a point is looked up in customer_profiles too.
    // Both are reads: nothing is created until a correction is saved.
    const like = likeTerm(search);
    if (!like) return [];
    const [accounts, profiles] = await Promise.all([
      rpc<ListRow>("list_funda_point_accounts", { p_search: like, p_limit: limit, p_offset: 0 }),
      supabaseRest<ProfileRow[]>(
        `/customer_profiles?select=auth_user_id,full_name,email,phone&or=${encodeURIComponent(
          `(${["full_name", "email", "phone"].map((c) => `${c}.ilike.${quotedPattern(like)}`).join(",")})`,
        )}&order=full_name.asc&limit=${limit}`,
      ),
    ]);
    const rows = (accounts?.rows ?? []).map(toAdminRow);
    const seen = new Set(rows.map((r) => r.userId));
    for (const p of profiles ?? []) {
      if (seen.has(p.auth_user_id)) continue;
      seen.add(p.auth_user_id);
      rows.push({
        userId: p.auth_user_id,
        fullName: p.full_name,
        email: p.email,
        phone: p.phone,
        available: 0,
        debt: 0,
        earned: 0,
        spent: 0,
        lastActivity: null,
      });
    }
    return rows.slice(0, limit);
  },

  async adminDetail(userId) {
    if (!UUID.test(userId)) return null;
    const r = await rpc<DetailRow | null>("get_funda_points_admin_detail", { p_user_id: userId, p_limit: 100 });
    return r ? toDetail(r) : null;
  },

  async adjust(input, actor) {
    if (!UUID.test(input.userId)) return { ok: false, error: "MEMBER_NOT_FOUND" };
    try {
      const r = await rpc<DetailRow>("adjust_funda_points", {
        p_user_id: input.userId,
        p_direction: input.direction,
        p_points: input.points,
        p_reason: input.reason,
        p_actor_account: actor.account,
        p_actor_name: actor.name,
        p_request_id: input.requestId,
      });
      return { ok: true, detail: toDetail(r) };
    } catch (err) {
      const known = err instanceof SupabaseRestError && err.dbMessage ? ADJUST_ERRORS[err.dbMessage] : undefined;
      if (known) return { ok: false, error: known };
      throw err;
    }
  },
};

/** No Supabase (developer machine): nothing to read, nothing may be written. */
export const noFundaPointsStore: FundaPointsStore = {
  kind: "none",
  async summary() {
    return EMPTY;
  },
  async adminList() {
    return { total: 0, overview: { available: 0, debt: 0, earned: 0, spent: 0, membersWithPoints: 0 }, rows: [] };
  },
  async adminSearch() {
    return [];
  },
  async adminDetail() {
    return null;
  },
  async adjust() {
    return { ok: false, error: "UNAVAILABLE" };
  },
};

let override: FundaPointsStore | null = null;

/** verify scripts only — swaps the store (e.g. to watch the RPC calls). */
export function setFundaPointsStoreForTests(next: FundaPointsStore | null): void {
  override = next;
}

export function getFundaPointsStore(): FundaPointsStore {
  return override ?? (isSupabaseConfigured() ? supabaseFundaPointsStore : noFundaPointsStore);
}
