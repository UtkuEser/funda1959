import { accountJsonRoute } from "@/lib/customer-auth/next";
import { requestPasswordReset } from "@/lib/customer-auth/operations";

export const dynamic = "force-dynamic";

/**
 * POST /api/account/password-reset — sends the reset e-mail. The answer is
 * the same whether or not the address has an account. The link comes back
 * to /auth/confirm on this deployment (must be an allowed Redirect URL in
 * Supabase).
 */
export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  return accountJsonRoute(request, (jar, body) => requestPasswordReset(jar, body, origin));
}
