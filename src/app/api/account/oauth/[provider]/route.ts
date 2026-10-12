import { NextResponse } from "next/server";
import { NO_STORE, routeCookieJar } from "@/lib/customer-auth/next";
import { startSocialSignIn } from "@/lib/customer-auth/operations";

export const dynamic = "force-dynamic";

/**
 * GET /api/account/oauth/[provider]?next=… — starts a social sign-in. Only a
 * provider allowed in code AND enabled in Supabase starts; none is allowed
 * today (D22; Google blocked, SUPABASE_PLAN.md §8.2).
 */
export async function GET(request: Request, ctx: RouteContext<"/api/account/oauth/[provider]">) {
  const { provider } = await ctx.params;
  const url = new URL(request.url);
  const target = await startSocialSignIn(await routeCookieJar(), provider, url.origin, url.searchParams.get("next"));
  return NextResponse.redirect(new URL(target, url.origin), { status: 303, headers: NO_STORE });
}
