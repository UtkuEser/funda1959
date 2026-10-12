import { NextResponse } from "next/server";
import { NO_STORE, routeCookieJar } from "@/lib/customer-auth/next";
import { finishSocialSignIn } from "@/lib/customer-auth/operations";

export const dynamic = "force-dynamic";

/**
 * GET /auth/callback — end of a social sign-in. The provider is checked again
 * before the code is exchanged: a provider that isn't allowed (Google today,
 * §8.2) never yields a session on this site.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = await finishSocialSignIn(await routeCookieJar(), url.searchParams);
  return NextResponse.redirect(new URL(target, url.origin), { status: 303, headers: NO_STORE });
}
