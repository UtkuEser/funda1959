/**
 * Funda Puan access rules — server-only.
 *
 * - A member reads only their own points: the user id comes from the
 *   verified session (`requireMemberPage`, `resolveOrderMember`), never from
 *   a request.
 * - The admin views and corrections are Merkez (SUPER_ADMIN) only. Hiding
 *   the menu item isn't the boundary: every function here refuses a branch
 *   account, and the database function refuses any actor but "merkez".
 * - Corrections carry a reason and the admin account + name (D40).
 */

import type { AdminRole, AdminScope } from "../admin/access";
import { isFundaPointsActive } from "./config";
import { getFundaPointsStore } from "./store";
import type {
  AdjustPointsError,
  AdjustPointsInput,
  FundaPointsAdminDetail,
  FundaPointsAdminRow,
  FundaPointsOverview,
  FundaPointsSummary,
} from "./types";

if (typeof window !== "undefined") {
  throw new Error("funda-points/service.ts must never be imported on the client");
}

export class FundaPointsAccessError extends Error {
  constructor() {
    super("FUNDA_POINTS_FORBIDDEN");
    this.name = "FundaPointsAccessError";
  }
}

function assertSuperAdmin(role: AdminRole): void {
  if (role !== "SUPER_ADMIN") throw new FundaPointsAccessError();
}

/* -------------------------------------------------------------------------- */
/* Member                                                                      */
/* -------------------------------------------------------------------------- */

/** The signed-in member's own points (Hesabım). `userId` must come from the session. */
export async function getMemberPointsSummary(userId: string): Promise<FundaPointsSummary> {
  return getFundaPointsStore().summary(userId, 100);
}

/**
 * What checkout may offer: nothing while earning/spending is off (D41) —
 * no balance is even read then.
 */
export async function getCheckoutPoints(userId: string): Promise<{ active: true; available: number } | null> {
  if (!isFundaPointsActive()) return null;
  const summary = await getFundaPointsStore().summary(userId, 1);
  return { active: true, available: summary.available };
}

/* -------------------------------------------------------------------------- */
/* Merkez                                                                      */
/* -------------------------------------------------------------------------- */

export async function getFundaPointsAdminPage(
  role: AdminRole,
  q: { search?: string | null; limit?: number; offset?: number } = {},
): Promise<{ total: number; overview: FundaPointsOverview; rows: FundaPointsAdminRow[] }> {
  assertSuperAdmin(role);
  return getFundaPointsStore().adminList({ search: q.search ?? null, limit: q.limit ?? 200, offset: q.offset ?? 0 });
}

/**
 * Merkez search by name, e-mail or phone over every member — including one
 * with no points account yet, so a first correction can be made. Read only:
 * the account is created by the correction itself (adjust_funda_points).
 */
export async function searchFundaPointsMembers(role: AdminRole, search: string): Promise<FundaPointsAdminRow[]> {
  assertSuperAdmin(role);
  return getFundaPointsStore().adminSearch({ search, limit: 50 });
}

export async function getFundaPointsAdminDetail(role: AdminRole, userId: string): Promise<FundaPointsAdminDetail | null> {
  assertSuperAdmin(role);
  return getFundaPointsStore().adminDetail(userId);
}

/** Merkez correction: the actor is the session's admin, never a request field. */
export async function adjustFundaPointsAsAdmin(
  scope: AdminScope,
  input: AdjustPointsInput,
): Promise<{ ok: true; detail: FundaPointsAdminDetail } | { ok: false; error: AdjustPointsError }> {
  assertSuperAdmin(scope.user.role);
  return getFundaPointsStore().adjust(input, { account: "merkez", name: scope.user.name });
}
