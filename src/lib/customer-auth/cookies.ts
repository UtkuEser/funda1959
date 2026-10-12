/**
 * Customer session cookies. Server-only (also used by `src/proxy.ts`).
 *
 * Supabase's own cookies (`sb-<project>-auth-token`, chunked `.0`, `.1`, and
 * the PKCE `-code-verifier`) are written by @supabase/ssr; we only change
 * their options: httpOnly (no browser code reads them — every Supabase call
 * is made by our server), secure in production, and session-only when the
 * customer unticked "Beni hatırla".
 */

import type { CookieOptions } from "@supabase/ssr";

/** "0" = the customer chose not to be remembered: auth cookies end with the browser session. */
export const PERSIST_COOKIE = "funda_auth_persist";

export type CookieJar = {
  getAll(): { name: string; value: string }[];
  set(name: string, value: string, options: CookieOptions): void;
};

export const isAuthCookieName = (name: string): boolean => name.startsWith("sb-") && name.includes("-auth-token");

/** A session (or a sign-in in progress) may exist — otherwise nothing needs Supabase. */
export const hasAuthCookie = (jar: Pick<CookieJar, "getAll">): boolean => jar.getAll().some((c) => isAuthCookieName(c.name));

export const persistFromJar = (jar: Pick<CookieJar, "getAll">): boolean =>
  jar.getAll().find((c) => c.name === PERSIST_COOKIE)?.value !== "0";

export function authCookieOptions(options: CookieOptions, persist: boolean): CookieOptions {
  const out: CookieOptions = {
    ...options,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
  // a deletion (maxAge 0) stays a deletion; only lasting cookies become session cookies
  if (!persist && typeof out.maxAge === "number" && out.maxAge > 0) {
    delete out.maxAge;
    delete out.expires;
  }
  return out;
}

/** The "Beni hatırla" marker itself: lives exactly as long as the auth cookies, removed on sign-out. */
export function persistMarker(persist: boolean): { name: string; value: string; options: CookieOptions } {
  return {
    name: PERSIST_COOKIE,
    value: persist ? "1" : "0",
    options: authCookieOptions({ maxAge: persist ? 400 * 24 * 60 * 60 : undefined }, persist),
  };
}
