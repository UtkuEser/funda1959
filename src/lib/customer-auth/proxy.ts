/**
 * Session refresh for `src/proxy.ts` (Next 16's Proxy, Node runtime).
 *
 * The one place a customer's expired access token is refreshed (refresh
 * tokens are single-use, so refreshing in two places signs people out). Only
 * runs when an auth cookie exists and the connected project's environment
 * marker matches; it never redirects — each page and route checks the
 * session itself (Next "Data Access Layer" guidance, Supabase SSR guide).
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { authCookieOptions, isAuthCookieName, persistFromJar } from "./cookies";
import { authEnvironment, CustomerAuthUnavailableError } from "./server";

export async function refreshCustomerSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  if (!request.cookies.getAll().some((c) => isAuthCookieName(c.name))) return response;

  try {
    const cfg = await authEnvironment();
    const persist = persistFromJar(request.cookies);
    const supabase = createServerClient(cfg.url, cfg.anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list, headers) => {
          for (const c of list) request.cookies.set(c.name, c.value);
          response = NextResponse.next({ request });
          for (const c of list) response.cookies.set(c.name, c.value, authCookieOptions(c.options, persist));
          for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
        },
      },
    });
    // verifies the token and refreshes it if it expired (never getSession() here)
    await supabase.auth.getClaims();
  } catch (err) {
    if (!(err instanceof CustomerAuthUnavailableError)) {
      console.error("[proxy] customer session refresh failed", { error: (err as Error).message });
    }
  }
  return response;
}
