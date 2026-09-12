/**
 * Admin access scope.
 *
 * Roles:
 *   SUPER_ADMIN     — every branch
 *   BRANCH_MANAGER  — only the branch(es) they are linked to
 *
 * A user is never `user.branchId` — the link is many-to-many via
 * `AdminUserBranch`, so a manager can cover more than one branch later.
 *
 * No auth is wired yet: the demo resolves scope from a `?as=` query param.
 * Every repository read in the admin pages passes `authorizedBranchIds` so the
 * same boundary holds once Supabase RLS is in place.
 */

import { listBranches } from "../branch";

export type AdminRole = "SUPER_ADMIN" | "BRANCH_MANAGER";

export type AdminUser = {
  id: string;
  name: string;
  role: AdminRole;
};

export type AdminUserBranch = {
  userId: string;
  branchId: string;
};

export type AdminScope = {
  user: AdminUser;
  /** null = all branches (super admin) */
  authorizedBranchIds: string[] | null;
  /** which branch view is active in the UI */
  activeBranchId: string | null;
};

/** demo directory — replace with an admin_users + admin_user_branches query */
const DEMO_USERS: AdminUser[] = [
  { id: "u-super", name: "Merkez Ekip", role: "SUPER_ADMIN" },
  { id: "u-gop", name: "GOP Müdürü", role: "BRANCH_MANAGER" },
  { id: "u-panora", name: "Panora Müdürü", role: "BRANCH_MANAGER" },
  { id: "u-incek", name: "İncek Müdürü", role: "BRANCH_MANAGER" },
];

const DEMO_LINKS: AdminUserBranch[] = [
  { userId: "u-gop", branchId: "gop" },
  { userId: "u-panora", branchId: "panora" },
  { userId: "u-incek", branchId: "incek" },
];

export function adminUsers(): AdminUser[] {
  return DEMO_USERS;
}

function branchesForUser(user: AdminUser): string[] | null {
  if (user.role === "SUPER_ADMIN") return null;
  return DEMO_LINKS.filter((l) => l.userId === user.id).map((l) => l.branchId);
}

/**
 * `as` values: "super" | "manager:<branchId>" | "<userId>"
 * `branch` selects the active branch view within the authorized set.
 */
export function resolveAdminScope(params: {
  as?: string;
  branch?: string;
}): AdminScope {
  const as = params.as ?? "super";
  let user: AdminUser | undefined;

  if (as === "super") user = DEMO_USERS.find((u) => u.role === "SUPER_ADMIN");
  else if (as.startsWith("manager:")) {
    const bid = as.slice("manager:".length);
    user = DEMO_USERS.find((u) => branchesForUser(u)?.includes(bid));
  } else user = DEMO_USERS.find((u) => u.id === as);

  user ??= DEMO_USERS[0];

  const authorizedBranchIds = branchesForUser(user);
  const allBranchIds = listBranches().map((b) => b.id);
  const scopeIds = authorizedBranchIds ?? allBranchIds;

  const wanted = params.branch && scopeIds.includes(params.branch) ? params.branch : null;
  const activeBranchId = wanted ?? (authorizedBranchIds ? authorizedBranchIds[0] : null);

  return { user, authorizedBranchIds, activeBranchId };
}

/** repositories take `{ authorizedBranchIds?: string[] }` — undefined = all */
export function repoScope(scope: AdminScope): { authorizedBranchIds?: string[] } {
  return scope.authorizedBranchIds ? { authorizedBranchIds: scope.authorizedBranchIds } : {};
}
