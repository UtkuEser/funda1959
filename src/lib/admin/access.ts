/**
 * Admin access scope.
 *
 * Roles:
 *   SUPER_ADMIN     — every branch
 *   BRANCH_MANAGER  — only the branch they logged in as
 *
 * Scope comes ONLY from the signed session cookie (see `./session.ts`) —
 * never from a query param. `resolveAdminScope`'s `branch` argument is a
 * pure view-selector (which branch a SUPER_ADMIN is currently looking at in
 * Stock/Slots/Overview); it can never widen a BRANCH_MANAGER's own
 * authorized set, since it's clamped against `scopeIds` below.
 */
import { redirect } from "next/navigation";
import { listBranches, getBranch } from "../branch";
import { getAdminSession } from "./session";

if (typeof window !== "undefined") {
  throw new Error("admin/access.ts must never be imported on the client");
}

export type AdminRole = "SUPER_ADMIN" | "BRANCH_MANAGER";

export type AdminUser = {
  /** display name for the sidebar/topbar — a branch short name, or "Merkez Yönetim" */
  name: string;
  role: AdminRole;
};

export type AdminScope = {
  user: AdminUser;
  /** null = all branches (super admin) */
  authorizedBranchIds: string[] | null;
  /** which branch view is active in the UI */
  activeBranchId: string | null;
};

function branchDisplayName(branchId: string): string {
  return getBranch(branchId)?.name.replace("Funda 1959 ", "") ?? branchId;
}

/**
 * Resolves the admin scope from the session cookie. Returns `null` when
 * there is no valid session — callers that render UI should use
 * `requireAdminScope` instead, which redirects.
 */
export async function resolveAdminScope(params: { branch?: string } = {}): Promise<AdminScope | null> {
  const session = await getAdminSession();
  if (!session) return null;

  const user: AdminUser =
    session.role === "SUPER_ADMIN"
      ? { name: "Merkez Yönetim", role: "SUPER_ADMIN" }
      : { name: branchDisplayName(session.branchId), role: "BRANCH_MANAGER" };

  const authorizedBranchIds = session.role === "SUPER_ADMIN" ? null : [session.branchId];
  const allBranchIds = listBranches().map((b) => b.id);
  const scopeIds = authorizedBranchIds ?? allBranchIds;

  const wanted = params.branch && scopeIds.includes(params.branch) ? params.branch : null;
  const activeBranchId = wanted ?? (authorizedBranchIds ? authorizedBranchIds[0] : null);

  return { user, authorizedBranchIds, activeBranchId };
}

/** Same as `resolveAdminScope`, but redirects to the branch login instead of returning null. */
export async function requireAdminScope(params: { branch?: string } = {}): Promise<AdminScope> {
  const scope = await resolveAdminScope(params);
  if (!scope) redirect("/admin-giris");
  return scope;
}

/** repositories take `{ authorizedBranchIds?: string[] }` — undefined = all */
export function repoScope(scope: AdminScope): { authorizedBranchIds?: string[] } {
  return scope.authorizedBranchIds ? { authorizedBranchIds: scope.authorizedBranchIds } : {};
}
