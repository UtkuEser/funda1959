import { NextResponse } from "next/server";
import { NO_STORE, routeCookieJar } from "@/lib/customer-auth/next";
import { confirmEmailLink } from "@/lib/customer-auth/operations";

export const dynamic = "force-dynamic";

/**
 * GET /auth/confirm — the password-reset e-mail's link (`token_hash` +
 * `type=recovery`, or a PKCE `code`). Opens a short session for
 * /sifre-yenile; an invalid or expired link goes back to /sifremi-unuttum.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = await confirmEmailLink(await routeCookieJar(), url.searchParams);
  return NextResponse.redirect(new URL(target, url.origin), { status: 303, headers: NO_STORE });
}
