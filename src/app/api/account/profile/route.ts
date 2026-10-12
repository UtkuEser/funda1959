import { accountJsonRoute } from "@/lib/customer-auth/next";
import { completeMembership, updateMemberProfile } from "@/lib/customer-auth/operations";

export const dynamic = "force-dynamic";

/** POST /api/account/profile — first profile of a signed-in account that has none (/uyelik-tamamla). */
export async function POST(request: Request) {
  return accountJsonRoute(request, completeMembership);
}

/** PATCH /api/account/profile — name + phone of the signed-in member (the e-mail isn't edited, D24). */
export async function PATCH(request: Request) {
  return accountJsonRoute(request, updateMemberProfile);
}
