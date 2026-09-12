/**
 * Which admin sections require SUPER_ADMIN — the single source of truth
 * for both sidebar visibility (`AdminShell`, a client component) and the
 * server-side route guard (`admin/page.tsx`), so the two can never drift
 * apart.
 *
 * Deliberately client-safe: no session/cookie code, no server-only guard.
 * `access.ts` holds the actual session resolution and IS server-only —
 * this file only holds the (non-secret) list of which section keys are
 * restricted, so a client component can import it directly instead of
 * duplicating the list.
 */
import type { AdminRole } from "./access";

export const SUPER_ADMIN_ONLY_SECTIONS = ["campaigns", "instagram", "funda-puan", "branches"] as const;

export function isSectionAllowed(role: AdminRole, section: string): boolean {
  if (role === "SUPER_ADMIN") return true;
  return !(SUPER_ADMIN_ONLY_SECTIONS as readonly string[]).includes(section);
}
