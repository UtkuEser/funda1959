/**
 * Customer account operations — the logic behind `/api/account/*`,
 * `/auth/confirm` and `/auth/callback` (SUPABASE_PLAN.md §8.2). Server-only.
 *
 * Each operation takes the request's cookie jar and answers a status + JSON
 * body (or a redirect target); the routes only adapt that to Next. The
 * member's id always comes from the session Supabase verified — never from
 * the request body.
 *
 * Deliberately NOT here (§8.2, D23–D26): signing other sessions out,
 * invalidating passwords, recording a consent no text was published for,
 * marketing consent, linking guest orders, Funda Puan.
 */

import { createClient, isAuthApiError, isAuthRetryableFetchError, type AuthError, type Provider } from "@supabase/supabase-js";
import { isValidPassword, PASSWORD_HINT, safeNextPath } from "../auth";
import { isValidEmail } from "../checkout-utils";
import { DataEnvironmentError } from "../supabase-server";
import type { AccountProfile } from "../account-service";
import { MAX_SAVED_ADDRESSES } from "../account-service";
import { checkAddressInput, checkProfileInput } from "../customers/validation";
import { AREAS_DISPLAY_MAX_AGE_MS, refreshDeliveryAreas } from "../delivery/areas-server";
import { areasState } from "../delivery/zones";
import { getCustomerRepository, membershipReady, MembershipNotReadyError } from "../customers/repository";
import { isSignupOpen, membershipTerms, type CustomerAuthConfig } from "./config";
import { PERSIST_COOKIE, authCookieOptions, isAuthCookieName, persistMarker, type CookieJar } from "./cookies";
import {
  authEnvironment,
  createCustomerAuthClient,
  CustomerAuthUnavailableError,
  readCustomerSession,
  type CustomerSession,
} from "./server";
import { isSocialProviderAvailable } from "./providers";

if (typeof window !== "undefined") {
  throw new Error("customer-auth/operations.ts must never be imported on the client");
}

export type OpBody = { ok: boolean; error?: string; code?: string } & Record<string, unknown>;
export type OpResult = { status: number; body: OpBody };

export const MESSAGES = {
  unavailable: "Üyelik servisi şu an kullanılamıyor. Siparişinizi üye olmadan verebilirsiniz.",
  notReady: "Üyelik altyapısı henüz hazır değil. Siparişinizi üye olmadan verebilirsiniz.",
  signupClosed: "Üyelik henüz açılmadı. Siparişinizi üye olmadan verebilirsiniz.",
  exists: "Bu e-postayla bir hesap var. Giriş yapın veya şifrenizi sıfırlayın.",
  invalidCredentials: "E-posta veya şifre hatalı.",
  rateLimited: "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin.",
  generic: "İşlem şu an tamamlanamadı. Lütfen tekrar deneyin.",
  signedOut: "Oturumunuz bulunamadı. Lütfen yeniden giriş yapın.",
  profileRequired: "Devam etmek için üyelik bilgilerinizi tamamlayın.",
  recoveryExpired: "Şifre yenileme bağlantısının süresi doldu. Lütfen yeni bir bağlantı isteyin.",
} as const;

const ok = (extra: Record<string, unknown> = {}): OpResult => ({ status: 200, body: { ok: true, ...extra } });
const fail = (status: number, error: string, extra: Record<string, unknown> = {}): OpResult => ({
  status,
  body: { ok: false, error, ...extra },
});

const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** Service-side refusals -> 503 with a plain message; the reason goes to the log only. */
function serviceFailure(op: string, err: unknown): OpResult {
  if (err instanceof CustomerAuthUnavailableError || err instanceof DataEnvironmentError) {
    console.error(`[account] ${op} refused`, { reason: err.reason });
    return fail(503, MESSAGES.unavailable, { code: "UNAVAILABLE" });
  }
  if (err instanceof MembershipNotReadyError) {
    console.error(`[account] ${op} refused: migration 0010 not applied`);
    return fail(503, MESSAGES.notReady, { code: "NOT_READY" });
  }
  console.error(`[account] ${op} failed`, { error: (err as Error)?.message });
  return fail(502, MESSAGES.generic);
}

/** Supabase Auth errors -> what the customer reads. Never says whether an e-mail exists, except at sign-up (§8.2). */
function authFailure(op: string, error: AuthError): OpResult {
  const code = error.code ?? "";
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit" || error.status === 429) {
    return fail(429, MESSAGES.rateLimited, { code: "RATE_LIMITED" });
  }
  if (isAuthRetryableFetchError(error)) {
    console.error(`[account] ${op}: Auth unreachable`, { status: error.status });
    return fail(503, MESSAGES.unavailable, { code: "UNAVAILABLE" });
  }
  if (code === "weak_password") return fail(400, PASSWORD_HINT, { code: "WEAK_PASSWORD" });
  if (code === "email_address_invalid") return fail(400, "Geçerli bir e-posta adresi girin.", { code: "INVALID_EMAIL" });
  console.error(`[account] ${op}: Auth error`, { code, status: error.status });
  return fail(isAuthApiError(error) && error.status >= 400 && error.status < 500 ? 400 : 502, MESSAGES.generic);
}

/* -------------------------------------------------------------------------- */
/* Session + member                                                            */
/* -------------------------------------------------------------------------- */

export type MemberState =
  | { kind: "signed_out" }
  | { kind: "unavailable"; reason: string }
  | { kind: "needs_profile"; userId: string; email: string | null }
  | { kind: "member"; userId: string; email: string | null; profile: AccountProfile };

/** The signed-in member and their profile, or why there is none. */
export async function loadMember(session: CustomerSession): Promise<MemberState> {
  if (session.status === "signed_out") return { kind: "signed_out" };
  if (session.status === "unavailable") return { kind: "unavailable", reason: session.reason };
  try {
    const profile = await getCustomerRepository().getProfile(session.userId);
    return profile
      ? { kind: "member", userId: session.userId, email: session.email, profile }
      : { kind: "needs_profile", userId: session.userId, email: session.email };
  } catch (err) {
    if (err instanceof MembershipNotReadyError) return { kind: "unavailable", reason: "NOT_READY" };
    if (err instanceof DataEnvironmentError) return { kind: "unavailable", reason: err.reason };
    console.error("[account] member profile could not be read", { error: (err as Error).message });
    return { kind: "unavailable", reason: "UNREACHABLE" };
  }
}

/** For routes that need a member: the member, or the answer to send instead. */
async function memberOrRefusal(jar: CookieJar): Promise<Extract<MemberState, { kind: "member" }> | OpResult> {
  const state = await loadMember(await readCustomerSession(jar));
  if (state.kind === "member") return state;
  if (state.kind === "signed_out") return fail(401, MESSAGES.signedOut, { code: "SIGNED_OUT", redirect: "/giris" });
  if (state.kind === "needs_profile") {
    return fail(409, MESSAGES.profileRequired, { code: "PROFILE_REQUIRED", redirect: "/uyelik-tamamla" });
  }
  return fail(503, state.reason === "NOT_READY" ? MESSAGES.notReady : MESSAGES.unavailable, { code: "UNAVAILABLE" });
}

const isOp = (v: unknown): v is OpResult => Boolean(v && typeof v === "object" && "status" in v && "body" in v);

/**
 * The member an order belongs to (D24) — for POST /api/orders. Guest when
 * nobody is signed in, when the account has no profile yet, or when the
 * membership tables don't exist; refused (503) only when a session exists
 * but can't be checked, so a member's order never silently becomes a guest's.
 */
export async function resolveOrderMember(jar: CookieJar): Promise<{ ok: true; userId: string | null } | { ok: false }> {
  const state = await loadMember(await readCustomerSession(jar));
  if (state.kind === "member") return { ok: true, userId: state.userId };
  if (state.kind === "unavailable" && state.reason !== "NOT_READY") return { ok: false };
  return { ok: true, userId: null };
}

/* -------------------------------------------------------------------------- */
/* Sign-up, sign-in, sign-out                                                  */
/* -------------------------------------------------------------------------- */

/** Consent for the published texts (D26) — or none at all while there are none. */
function consentFrom(body: Record<string, unknown>): { ok: true; consent: { version: string; acceptedAt: string } | null } | { ok: false } {
  const terms = membershipTerms();
  if (!terms) return { ok: true, consent: null };
  if (body.acceptTerms !== true) return { ok: false };
  return { ok: true, consent: { version: terms.version, acceptedAt: new Date().toISOString() } };
}

export async function registerCustomer(jar: CookieJar, raw: unknown): Promise<OpResult> {
  // production stays closed until the texts are published and opening is approved (D26)
  if (!isSignupOpen()) return fail(403, MESSAGES.signupClosed, { code: "SIGNUP_CLOSED" });

  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const profile = checkProfileInput(body);
  const email = str(body.email).trim().toLowerCase();
  const password = str(body.password);
  const fieldErrors: Record<string, string> = profile.ok ? {} : { ...profile.errors };
  if (!isValidEmail(email) || email.length > 320) fieldErrors.email = "Geçerli bir e-posta adresi girin.";
  if (!isValidPassword(password)) fieldErrors.password = PASSWORD_HINT;
  const consent = consentFrom(body);
  if (!consent.ok) fieldErrors.acceptTerms = "Devam etmek için üyelik metinlerini onaylayın.";
  if (!profile.ok || !consent.ok || Object.keys(fieldErrors).length > 0) {
    return fail(400, "Lütfen işaretli alanları kontrol edin.", { code: "INVALID", fieldErrors });
  }

  let cfg: CustomerAuthConfig;
  try {
    cfg = await authEnvironment();
    // no account is created where its profile couldn't be stored (0010 missing)
    if (!(await membershipReady())) throw new MembershipNotReadyError("customer_profiles");
  } catch (err) {
    return serviceFailure("register", err);
  }

  const client = createCustomerAuthClient(cfg, jar, { persist: true });
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { full_name: profile.value.fullName } },
  });
  if (error) {
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      return fail(409, MESSAGES.exists, { code: "EXISTS" });
    }
    if (error.code === "signup_disabled") {
      console.error("[account] register refused by Supabase: sign-ups are disabled in the project");
      return fail(403, MESSAGES.signupClosed, { code: "SIGNUP_CLOSED" });
    }
    return authFailure("register", error);
  }
  const user = data.user;
  // "Confirm email" on: Supabase answers an existing address with a user that has no identities
  if (!user || (Array.isArray(user.identities) && user.identities.length === 0)) {
    return fail(409, MESSAGES.exists, { code: "EXISTS" });
  }

  try {
    await getCustomerRepository().createProfile(
      user.id,
      { fullName: profile.value.fullName, phone: profile.value.phone, email: user.email ?? email },
      consent.consent,
    );
  } catch (err) {
    // the account exists; its profile is asked for again on /uyelik-tamamla
    console.error("[account] register: profile could not be stored", { error: (err as Error).message });
    if (data.session) {
      const m = persistMarker(true);
      jar.set(m.name, m.value, m.options);
    }
    return ok({ redirect: `/uyelik-tamamla?next=${encodeURIComponent(safeNextPath(body.next))}` });
  }

  if (!data.session) {
    // D23 expects "Confirm email" off; with it on, nobody is signed in yet
    console.error("[account] register: no session returned — is \"Confirm email\" still on in Supabase?");
    return ok({ redirect: null, message: "Hesabınız oluşturuldu. Giriş yapabilmek için e-postanıza gelen bağlantıyı onaylayın." });
  }
  const m = persistMarker(true);
  jar.set(m.name, m.value, m.options);
  return ok({ redirect: safeNextPath(body.next) });
}

export async function loginCustomer(jar: CookieJar, raw: unknown): Promise<OpResult> {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const email = str(body.email).trim().toLowerCase();
  const password = str(body.password);
  if (!isValidEmail(email) || password.length === 0) return fail(401, MESSAGES.invalidCredentials, { code: "INVALID_CREDENTIALS" });
  const persist = body.remember !== false;

  let cfg: CustomerAuthConfig;
  try {
    cfg = await authEnvironment();
  } catch (err) {
    return serviceFailure("login", err);
  }

  const client = createCustomerAuthClient(cfg, jar, { persist });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "invalid_credentials" || error.code === "user_not_found") {
      return fail(401, MESSAGES.invalidCredentials, { code: "INVALID_CREDENTIALS" });
    }
    if (error.code === "email_not_confirmed") {
      return fail(403, "E-posta adresiniz henüz doğrulanmamış.", { code: "EMAIL_NOT_CONFIRMED" });
    }
    return authFailure("login", error);
  }
  const m = persistMarker(persist);
  jar.set(m.name, m.value, m.options);

  const next = safeNextPath(body.next);
  const userId = data.user?.id;
  try {
    const profile = userId ? await getCustomerRepository().getProfile(userId) : null;
    if (!profile) return ok({ redirect: `/uyelik-tamamla?next=${encodeURIComponent(next)}` });
  } catch {
    // profile unreadable: the member pages say so themselves
  }
  return ok({ redirect: next });
}

/** Ends THIS browser's session only (`scope: "local"`) — never the member's other sessions. */
export async function logoutCustomer(jar: CookieJar): Promise<OpResult> {
  const authCookies = jar.getAll().filter((c) => isAuthCookieName(c.name));
  if (authCookies.length > 0) {
    try {
      const cfg = await authEnvironment();
      await createCustomerAuthClient(cfg, jar).auth.signOut({ scope: "local" });
    } catch (err) {
      console.error("[account] logout: Supabase sign-out failed, cookies cleared anyway", { error: (err as Error).message });
    }
  }
  // whatever Supabase answered, this browser holds no session afterwards
  for (const c of jar.getAll()) {
    if (isAuthCookieName(c.name) || c.name === PERSIST_COOKIE) jar.set(c.name, "", authCookieOptions({ maxAge: 0 }, true));
  }
  return ok({ redirect: "/" });
}

/* -------------------------------------------------------------------------- */
/* Passwords                                                                   */
/* -------------------------------------------------------------------------- */

/** Same answer whether or not the address has an account. */
export async function requestPasswordReset(jar: CookieJar, raw: unknown, origin: string): Promise<OpResult> {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const email = str(body.email).trim().toLowerCase();
  if (!isValidEmail(email)) return fail(400, "Geçerli bir e-posta adresi girin.", { code: "INVALID_EMAIL" });

  let cfg: CustomerAuthConfig;
  try {
    cfg = await authEnvironment();
  } catch (err) {
    return serviceFailure("password-reset", err);
  }
  const { error } = await createCustomerAuthClient(cfg, jar).auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent("/sifre-yenile")}`,
  });
  if (error) return authFailure("password-reset", error);
  return ok();
}

const RECOVERY_WINDOW_S = 15 * 60;
const RECOVERY_METHODS = new Set(["recovery", "otp", "magiclink"]);

/**
 * Did this session come from an e-mailed link in the last 15 minutes? Read
 * from the token's `amr` claim (signed by Supabase). Without timestamps, or
 * older than that, the current password is required instead.
 */
export function isRecentRecoverySession(claims: { amr?: unknown }, nowS = Math.floor(Date.now() / 1000)): boolean {
  if (!Array.isArray(claims.amr)) return false;
  return claims.amr.some(
    (e) =>
      e &&
      typeof e === "object" &&
      RECOVERY_METHODS.has(String((e as { method?: unknown }).method)) &&
      typeof (e as { timestamp?: unknown }).timestamp === "number" &&
      nowS - (e as { timestamp: number }).timestamp <= RECOVERY_WINDOW_S,
  );
}

/**
 * mode "recovery": new password after a reset link (no current password).
 * mode "change": from the profile page, current password required — checked
 * with a separate, stateless sign-in whose session is ended right after
 * (`scope: "local"`, that session only).
 */
export async function changePassword(jar: CookieJar, raw: unknown): Promise<OpResult> {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const mode = body.mode === "recovery" ? "recovery" : "change";
  const newPassword = str(body.newPassword);
  if (!isValidPassword(newPassword)) return fail(400, PASSWORD_HINT, { code: "WEAK_PASSWORD", fieldErrors: { newPassword: PASSWORD_HINT } });

  const session = await readCustomerSession(jar);
  if (session.status === "signed_out") {
    return fail(401, mode === "recovery" ? MESSAGES.recoveryExpired : MESSAGES.signedOut, { code: "SIGNED_OUT" });
  }
  if (session.status === "unavailable") return fail(503, MESSAGES.unavailable, { code: "UNAVAILABLE" });

  let cfg: CustomerAuthConfig;
  try {
    cfg = await authEnvironment();
  } catch (err) {
    return serviceFailure("password", err);
  }

  if (mode === "recovery") {
    if (!isRecentRecoverySession(session.claims)) return fail(403, MESSAGES.recoveryExpired, { code: "RECOVERY_EXPIRED" });
  } else {
    const current = str(body.currentPassword);
    if (!current || !session.email) {
      return fail(400, "Mevcut şifrenizi girin.", { code: "CURRENT_PASSWORD", fieldErrors: { currentPassword: "Mevcut şifrenizi girin." } });
    }
    const check = createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { error } = await check.auth.signInWithPassword({ email: session.email, password: current });
    if (error) {
      if (error.code === "invalid_credentials") {
        return fail(400, "Mevcut şifreniz hatalı.", { code: "CURRENT_PASSWORD", fieldErrors: { currentPassword: "Mevcut şifreniz hatalı." } });
      }
      return authFailure("password-check", error);
    }
    // the check's own session only — the member's sessions are untouched
    await check.auth.signOut({ scope: "local" }).catch(() => undefined);
  }

  const { error } = await createCustomerAuthClient(cfg, jar).auth.updateUser({ password: newPassword });
  if (error) {
    if (error.code === "same_password") return fail(400, "Yeni şifreniz eskisinden farklı olmalı.", { code: "SAME_PASSWORD" });
    if (error.code === "reauthentication_needed") return fail(403, MESSAGES.recoveryExpired, { code: "REAUTHENTICATION_NEEDED" });
    return authFailure("password", error);
  }
  return ok({ redirect: mode === "recovery" ? "/hesabim" : null, message: "Şifreniz güncellendi." });
}

/* -------------------------------------------------------------------------- */
/* Links from e-mails and providers                                            */
/* -------------------------------------------------------------------------- */

/**
 * `/auth/confirm` — a password-reset link: `token_hash` + `type=recovery`
 * (cross-device; the template sends these), or a PKCE `code` (same browser).
 * Answers where to redirect.
 */
export async function confirmEmailLink(jar: CookieJar, params: URLSearchParams): Promise<string> {
  const next = safeNextPath(params.get("next"), "/sifre-yenile");
  const failed = "/sifremi-unuttum?baglanti=gecersiz";
  let cfg: CustomerAuthConfig;
  try {
    cfg = await authEnvironment();
  } catch (err) {
    serviceFailure("confirm", err);
    return failed;
  }
  const client = createCustomerAuthClient(cfg, jar, { persist: false });
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  const code = params.get("code");
  try {
    if (tokenHash && type === "recovery") {
      const { error } = await client.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
      if (error) return failed;
    } else if (code) {
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (error) return failed;
    } else {
      return failed;
    }
  } catch (err) {
    console.error("[account] confirm link failed", { error: (err as Error).message });
    return failed;
  }
  const m = persistMarker(false);
  jar.set(m.name, m.value, m.options);
  return next;
}

/** `/api/account/oauth/[provider]` — where to send the browser. Unavailable providers never start (D22). */
export async function startSocialSignIn(jar: CookieJar, provider: string, origin: string, nextRaw: string | null): Promise<string> {
  if (!(await isSocialProviderAvailable(provider))) return "/giris?hata=saglayici";
  try {
    const cfg = await authEnvironment();
    const next = safeNextPath(nextRaw);
    const { data, error } = await createCustomerAuthClient(cfg, jar, { persist: true }).auth.signInWithOAuth({
      provider: provider as Provider,
      options: {
        redirectTo: `${origin}/auth/callback?provider=${provider}&next=${encodeURIComponent(next)}`,
        skipBrowserRedirect: true,
      },
    });
    if (error || !data.url) return "/giris?hata=saglayici";
    return data.url;
  } catch (err) {
    serviceFailure("oauth-start", err);
    return "/giris?hata=servis";
  }
}

/**
 * `/auth/callback` — finishes a social sign-in. The provider is checked again
 * BEFORE the code is exchanged, so a provider that isn't allowed never yields
 * a session on this site.
 */
export async function finishSocialSignIn(jar: CookieJar, params: URLSearchParams): Promise<string> {
  const provider = params.get("provider") ?? "";
  const code = params.get("code");
  if (!code || !(await isSocialProviderAvailable(provider))) return "/giris?hata=saglayici";
  try {
    const cfg = await authEnvironment();
    const { data, error } = await createCustomerAuthClient(cfg, jar, { persist: true }).auth.exchangeCodeForSession(code);
    if (error || !data.user) return "/giris?hata=saglayici";
    const m = persistMarker(true);
    jar.set(m.name, m.value, m.options);
    const next = safeNextPath(params.get("next"));
    const profile = await getCustomerRepository().getProfile(data.user.id);
    return profile ? next : `/uyelik-tamamla?next=${encodeURIComponent(next)}`;
  } catch (err) {
    serviceFailure("oauth-callback", err);
    return "/giris?hata=servis";
  }
}

/* -------------------------------------------------------------------------- */
/* Profile + addresses                                                         */
/* -------------------------------------------------------------------------- */

/** `/uyelik-tamamla` — the first profile of a signed-in account that has none. */
export async function completeMembership(jar: CookieJar, raw: unknown): Promise<OpResult> {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const next = safeNextPath(body.next);
  const state = await loadMember(await readCustomerSession(jar));
  if (state.kind === "signed_out") return fail(401, MESSAGES.signedOut, { code: "SIGNED_OUT", redirect: "/giris" });
  if (state.kind === "unavailable") {
    return fail(503, state.reason === "NOT_READY" ? MESSAGES.notReady : MESSAGES.unavailable, { code: "UNAVAILABLE" });
  }
  if (state.kind === "member") return ok({ redirect: next });
  if (!isSignupOpen()) return fail(403, MESSAGES.signupClosed, { code: "SIGNUP_CLOSED" });

  const profile = checkProfileInput(body);
  const consent = consentFrom(body);
  const fieldErrors: Record<string, string> = profile.ok ? {} : { ...profile.errors };
  if (!consent.ok) fieldErrors.acceptTerms = "Devam etmek için üyelik metinlerini onaylayın.";
  if (!profile.ok || !consent.ok || !state.email) {
    return fail(400, state.email ? "Lütfen işaretli alanları kontrol edin." : "Hesabınızda e-posta adresi bulunamadı.", {
      code: "INVALID",
      fieldErrors,
    });
  }
  try {
    await getCustomerRepository().createProfile(
      state.userId,
      { fullName: profile.value.fullName, phone: profile.value.phone, email: state.email },
      consent.consent,
    );
  } catch (err) {
    return serviceFailure("complete", err);
  }
  return ok({ redirect: next });
}

export async function updateMemberProfile(jar: CookieJar, raw: unknown): Promise<OpResult> {
  const member = await memberOrRefusal(jar);
  if (isOp(member)) return member;
  const input = checkProfileInput(raw);
  if (!input.ok) return fail(400, "Lütfen işaretli alanları kontrol edin.", { code: "INVALID", fieldErrors: input.errors });
  try {
    const profile = await getCustomerRepository().updateProfile(member.userId, input.value);
    if (!profile) return fail(409, MESSAGES.profileRequired, { code: "PROFILE_REQUIRED", redirect: "/uyelik-tamamla" });
    return ok({ profile, message: "Bilgileriniz kaydedildi." });
  } catch (err) {
    return serviceFailure("profile", err);
  }
}

export async function saveMemberAddress(jar: CookieJar, raw: unknown): Promise<OpResult> {
  const member = await memberOrRefusal(jar);
  if (isOp(member)) return member;
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const id = typeof body.id === "string" && body.id ? body.id : null;
  // D49: whether a branch serves the area is Merkez's map — read before checking, never guessed
  await refreshDeliveryAreas({ maxAgeMs: AREAS_DISPLAY_MAX_AGE_MS });
  if (areasState() !== "ready") return fail(503, "Teslimat bölgeleri şu an doğrulanamadı; adres kaydedilmedi. Lütfen biraz sonra tekrar deneyin.", { code: "AREAS_UNAVAILABLE" });
  const input = checkAddressInput(body.address);
  if (!input.ok) return fail(400, "Lütfen işaretli alanları kontrol edin.", { code: "INVALID", fieldErrors: input.errors });
  try {
    const repo = getCustomerRepository();
    const saved = await repo.saveAddress(member.userId, input.value, id);
    if (!saved.ok) {
      if (saved.error === "LIMIT") return fail(409, `En fazla ${MAX_SAVED_ADDRESSES} adres kaydedebilirsiniz.`, { code: "ADDRESS_LIMIT" });
      if (saved.error === "NOT_FOUND") return fail(404, "Adres bulunamadı.", { code: "NOT_FOUND" });
      return fail(400, "Adres bilgileri geçersiz.", { code: "INVALID" });
    }
    return ok({ addresses: await repo.listAddresses(member.userId) });
  } catch (err) {
    return serviceFailure("address-save", err);
  }
}

export async function deleteMemberAddress(jar: CookieJar, id: string | null): Promise<OpResult> {
  const member = await memberOrRefusal(jar);
  if (isOp(member)) return member;
  if (!id) return fail(400, "Adres seçilmedi.", { code: "INVALID" });
  try {
    const repo = getCustomerRepository();
    if (!(await repo.deleteAddress(member.userId, id))) return fail(404, "Adres bulunamadı.", { code: "NOT_FOUND" });
    return ok({ addresses: await repo.listAddresses(member.userId) });
  } catch (err) {
    return serviceFailure("address-delete", err);
  }
}
