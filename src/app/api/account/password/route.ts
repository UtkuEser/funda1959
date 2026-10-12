import { accountJsonRoute } from "@/lib/customer-auth/next";
import { changePassword } from "@/lib/customer-auth/operations";

export const dynamic = "force-dynamic";

/**
 * POST /api/account/password — `mode: "change"` (profile page, current
 * password required) or `mode: "recovery"` (after a reset link, within 15
 * minutes of it). Other sessions are not signed out here.
 */
export async function POST(request: Request) {
  return accountJsonRoute(request, changePassword);
}
