import { accountJsonRoute } from "@/lib/customer-auth/next";
import { logoutCustomer } from "@/lib/customer-auth/operations";

export const dynamic = "force-dynamic";

/** POST /api/account/logout — ends this browser's session only; other sessions are untouched. */
export async function POST(request: Request) {
  return accountJsonRoute(request, (jar) => logoutCustomer(jar));
}
