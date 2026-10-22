/**
 * Customer auth inside Next (Route Handlers, Server Components). Server-only.
 *
 * Route Handlers may write cookies; Server Components may not (Next 16
 * `cookies()`), so their jar ignores writes — the session is refreshed by
 * `src/proxy.ts` before those pages render.
 */

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { CheckoutMember } from "../account-service";
import { getCustomerRepository } from "../customers/repository";
import { getCheckoutPoints } from "../funda-points/service";
import type { CookieJar } from "./cookies";
import { loadMember, type MemberState, type OpResult } from "./operations";
import { authEnvironment, readCustomerSession, type CustomerSession } from "./server";

/** Can membership be used on this deployment right now (Auth config + matching project)? */
export async function membershipAvailable(): Promise<boolean> {
  try {
    await authEnvironment();
    return true;
  } catch {
    return false;
  }
}

/** `?hata=` on /giris after a refused social sign-in. */
export function signInNotice(code: string | string[] | undefined): string | null {
  if (code === "saglayici") return "Bu giriş yöntemi şu an kullanılamıyor. E-posta ve şifrenizle giriş yapabilirsiniz.";
  if (code === "servis") return "Giriş servisi şu an kullanılamıyor. Lütfen biraz sonra tekrar deneyin.";
  return null;
}

if (typeof window !== "undefined") {
  throw new Error("customer-auth/next.ts must never be imported on the client");
}

/** Reads the request's cookies; writes go to the response and are visible to later reads of this jar. */
export async function routeCookieJar(): Promise<CookieJar> {
  const store = await cookies();
  const written = new Map<string, string>();
  return {
    getAll: () => {
      const merged = new Map(store.getAll().map((c) => [c.name, c.value] as const));
      for (const [name, value] of written) {
        if (value === "") merged.delete(name);
        else merged.set(name, value);
      }
      return [...merged].map(([name, value]) => ({ name, value }));
    },
    set: (name, value, options) => {
      written.set(name, options.maxAge === 0 ? "" : value);
      store.set(name, value, options);
    },
  };
}

async function pageCookieJar(): Promise<CookieJar> {
  const store = await cookies();
  return { getAll: () => store.getAll().map((c) => ({ name: c.name, value: c.value })), set: () => {} };
}

/** The session Supabase verified for this render (once per request). */
const getPageSession = cache(async (): Promise<CustomerSession> => readCustomerSession(await pageCookieJar()));

/** The signed-in member of this render (once per request). */
export const getMemberState = cache(async (): Promise<MemberState> => loadMember(await getPageSession()));

export type MemberPage = Extract<MemberState, { kind: "member" }> | { kind: "unavailable"; reason: string };

/**
 * For /hesabim pages: the member — or a redirect to /giris (signed out) or
 * /uyelik-tamamla (no profile yet). "unavailable" is returned for the page
 * to say so; nothing is guessed.
 */
export async function requireMemberPage(path: string): Promise<MemberPage> {
  const state = await getMemberState();
  if (state.kind === "signed_out") redirect(`/giris?next=${encodeURIComponent(path)}`);
  if (state.kind === "needs_profile") redirect(`/uyelik-tamamla?next=${encodeURIComponent(path)}`);
  return state;
}

export type Settled<T> = { ok: true; value: T } | { ok: false; error: unknown };

/**
 * `load` for the user id of the verified session (null when nobody is signed
 * in). Never rejects. Callers start it without awaiting, so it runs together
 * with the profile read, and use the result only once the member is confirmed.
 */
async function readForSessionUser<T>(load: (userId: string) => Promise<T>): Promise<Settled<T> | null> {
  try {
    const session = await getPageSession();
    if (session.status !== "signed_in") return null;
    return { ok: true, value: await load(session.userId) };
  } catch (error) {
    return { ok: false, error };
  }
}

/**
 * `requireMemberPage` plus the page's own reads for that member, fetched
 * together with the profile instead of after it. The reads' result is null
 * unless the member is confirmed.
 */
export async function requireMemberPageWith<T>(path: string, load: (userId: string) => Promise<T>): Promise<[MemberPage, Settled<T> | null]> {
  const pending = readForSessionUser(load); // awaited below
  const member = await requireMemberPage(path);
  if (member.kind !== "member") return [member, null];
  return [member, await pending];
}

/** Checkout prefill (D24): the member's profile and saved addresses, or null (guest / unavailable). */
export async function getCheckoutMember(): Promise<CheckoutMember | null> {
  // both started together with the profile read, awaited below
  const addressesRead = readForSessionUser((userId) => getCustomerRepository().listAddresses(userId));
  // Funda Puan: nothing is read or offered while points are off (D41)
  const pointsRead = readForSessionUser(getCheckoutPoints);
  const state = await getMemberState();
  if (state.kind !== "member") return null;
  const [addresses, points] = await Promise.all([addressesRead, pointsRead]);
  if (addresses && !addresses.ok) {
    console.error("[account] checkout: saved addresses could not be read", { error: (addresses.error as Error).message });
  }
  if (points && !points.ok) {
    console.error("[account] checkout: points could not be read", { error: (points.error as Error).message });
  }
  return {
    profile: state.profile,
    addresses: addresses?.ok ? addresses.value : [],
    points: points?.ok ? points.value : null,
  };
}

/** Same-origin check for the account routes' state-changing requests (login CSRF etc.). */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin navigations / older clients; cookies are SameSite=Lax anyway
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

/** Auth answers carry Set-Cookie: never cached by a CDN (Supabase SSR guidance). */
export const NO_STORE = { "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0" };

/**
 * One account API call: same-origin check, JSON body, the operation with
 * this request's cookie jar, the answer as JSON (never cached).
 */
export async function accountJsonRoute(
  request: Request,
  run: (jar: CookieJar, body: unknown) => Promise<OpResult>,
): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 403, headers: NO_STORE });
  }
  const body = request.method === "DELETE" ? null : await request.json().catch(() => null);
  const res = await run(await routeCookieJar(), body);
  return NextResponse.json(res.body, { status: res.status, headers: NO_STORE });
}
