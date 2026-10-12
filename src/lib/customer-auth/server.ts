/**
 * Supabase Auth for customers, on the server only (SUPABASE_PLAN.md §8.2).
 *
 * The anon (publishable) key and the user's tokens stay on the server; the
 * browser only ever holds httpOnly cookies. Before any Auth request the
 * connected project's environment marker is checked, exactly like
 * `supabaseRest` does for tables (§7.4): a deployment never signs anyone in
 * against the other project.
 *
 * No `next/headers` here — callers pass a cookie jar, so the same code runs
 * in Route Handlers, Server Components, the proxy and the verify scripts.
 */

import { createServerClient } from "@supabase/ssr";
import { isAuthRetryableFetchError, type JwtPayload, type SupabaseClient } from "@supabase/supabase-js";
import { dataEnvironmentError, readDataEnvironmentMarker, type DataEnvironmentFailure } from "../supabase-server";
import { customerAuthConfig, type CustomerAuthConfig } from "./config";
import { authCookieOptions, hasAuthCookie, persistFromJar, type CookieJar } from "./cookies";

if (typeof window !== "undefined") {
  throw new Error("customer-auth/server.ts must never be imported on the client");
}

export type AuthUnavailableReason = "NOT_CONFIGURED" | DataEnvironmentFailure;

/** Membership can't be used right now — no Auth request was sent. */
export class CustomerAuthUnavailableError extends Error {
  constructor(
    readonly reason: AuthUnavailableReason,
    detail: string,
  ) {
    super(`customer auth: ${reason} — ${detail}`);
    this.name = "CustomerAuthUnavailableError";
  }
}

/** Config + a verified environment marker, or CustomerAuthUnavailableError. */
export async function authEnvironment(): Promise<CustomerAuthConfig> {
  const cfg = customerAuthConfig();
  if (!cfg) {
    throw new CustomerAuthUnavailableError("NOT_CONFIGURED", "SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY missing");
  }
  const marker = await readDataEnvironmentMarker();
  if (marker.status !== "ok") {
    const err = dataEnvironmentError(marker);
    throw new CustomerAuthUnavailableError(err.reason, err.message);
  }
  return cfg;
}

/**
 * A Supabase client bound to one request's cookies. Create one per request
 * (never share it). `persist` overrides the "Beni hatırla" marker — only at
 * sign-in, before the marker cookie exists.
 */
export function createCustomerAuthClient(
  cfg: CustomerAuthConfig,
  jar: CookieJar,
  { persist }: { persist?: boolean } = {},
): SupabaseClient {
  const keep = persist ?? persistFromJar(jar);
  return createServerClient(cfg.url, cfg.anonKey, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => {
        for (const c of list) jar.set(c.name, c.value, authCookieOptions(c.options, keep));
      },
    },
  });
}

export type CustomerSession =
  | { status: "signed_out" }
  | { status: "unavailable"; reason: AuthUnavailableReason | "AUTH_UNREACHABLE" }
  | { status: "signed_in"; userId: string; email: string | null; claims: JwtPayload };

/**
 * Who is signed in, verified by Supabase (`getClaims`: the token's signature,
 * or the Auth server for symmetric keys) — never a cookie taken on trust.
 * No auth cookie -> signed out without any request.
 */
export async function readCustomerSession(jar: CookieJar): Promise<CustomerSession> {
  if (!hasAuthCookie(jar)) return { status: "signed_out" };

  let cfg: CustomerAuthConfig;
  try {
    cfg = await authEnvironment();
  } catch (err) {
    if (err instanceof CustomerAuthUnavailableError) {
      // stale cookies without a usable project: nobody is signed in here
      return err.reason === "NOT_CONFIGURED" ? { status: "signed_out" } : { status: "unavailable", reason: err.reason };
    }
    throw err;
  }

  try {
    const { data, error } = await createCustomerAuthClient(cfg, jar).auth.getClaims();
    if (error) {
      return isAuthRetryableFetchError(error) ? { status: "unavailable", reason: "AUTH_UNREACHABLE" } : { status: "signed_out" };
    }
    const claims = data?.claims;
    if (!claims?.sub) return { status: "signed_out" };
    return { status: "signed_in", userId: claims.sub, email: typeof claims.email === "string" ? claims.email : null, claims };
  } catch (err) {
    console.error("[customer-auth] session check failed", { error: (err as Error).message });
    return { status: "unavailable", reason: "AUTH_UNREACHABLE" };
  }
}
