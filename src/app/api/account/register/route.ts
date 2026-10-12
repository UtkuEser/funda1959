import { accountJsonRoute } from "@/lib/customer-auth/next";
import { registerCustomer } from "@/lib/customer-auth/operations";

export const dynamic = "force-dynamic";

/**
 * POST /api/account/register — e-mail + password sign-up (D23: no e-mail
 * confirmation; the new member is signed in). Test data only — closed in
 * Production until the membership texts are published and opening is
 * approved (D26). No consent is recorded while no text exists.
 */
export async function POST(request: Request) {
  return accountJsonRoute(request, registerCustomer);
}
