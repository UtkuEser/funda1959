import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminScope } from "@/lib/admin/access";

export const metadata: Metadata = {
  title: "Funda 1959 Admin",
  robots: { index: false, follow: false },
};

/**
 * Route guard: no valid session -> redirect to /admin-giris (see
 * `requireAdminScope`). This also runs in `admin/page.tsx` (which reads
 * `searchParams.branch` for the real data-scoping) — a layout's checks
 * don't re-run on every query-param-only navigation, so the enforcement
 * that matters lives in the page; this one protects the shell itself and
 * supplies the display-only user info (name/role) shown in it.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const scope = await requireAdminScope();
  return <AdminShell user={scope.user}>{children}</AdminShell>;
}
