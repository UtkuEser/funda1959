import { accountJsonRoute } from "@/lib/customer-auth/next";
import { loginCustomer } from "@/lib/customer-auth/operations";

export const dynamic = "force-dynamic";

/** POST /api/account/login — e-mail + password. One message for every wrong combination. */
export async function POST(request: Request) {
  return accountJsonRoute(request, loginCustomer);
}
