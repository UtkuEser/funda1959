import { accountJsonRoute } from "@/lib/customer-auth/next";
import { deleteMemberAddress, saveMemberAddress } from "@/lib/customer-auth/operations";

export const dynamic = "force-dynamic";

/**
 * POST /api/account/addresses — body `{ id: string | null, address }`:
 * creates (no id) or updates one of the signed-in member's addresses (at most
 * 10, one default, D24). Answers the saved list.
 */
export async function POST(request: Request) {
  return accountJsonRoute(request, saveMemberAddress);
}

/** DELETE /api/account/addresses?id=… — the default moves to the oldest remaining address. */
export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  return accountJsonRoute(request, (jar) => deleteMemberAddress(jar, id));
}
