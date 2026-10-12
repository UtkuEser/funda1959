/**
 * Customer auth — the browser's side (Aşama 5, SUPABASE_PLAN.md §8.2).
 *
 * Every call goes to our own `/api/account/*` routes; the browser never talks
 * to Supabase and never holds a Supabase key or token (the session lives in
 * httpOnly cookies set by the server). Passwords are sent once, to our
 * server, and never stored or logged here.
 *
 * Client-safe: no server imports. `safeNextPath` and the password rule are
 * shared with the server.
 */

export type AuthActionResult =
  | { ok: true; message?: string; redirect?: string }
  | { ok: false; error: string; code?: string };

/** Social providers the code knows about (D22). Instagram is not a customer sign-in. */
export type SocialAuthProvider = "google" | "apple" | "facebook";

export type LoginPayload = {
  email: string;
  password: string;
  remember: boolean;
  next?: string;
};

export type RegisterPayload = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  /** only sent once the membership texts are published (D26); never assumed */
  acceptTerms?: boolean;
  next?: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

/** The published membership texts, as the forms show them (none yet — D26, A24). */
export type MembershipTermsView = {
  version: string;
  /** KVKK aydınlatma metni */
  privacyNoticeHref: string;
  /** üyelik koşulları */
  termsHref: string;
};

/** Shared password policy — used by register, reset and profile password change. */
export const PASSWORD_HINT = "En az 8 karakter, bir harf ve bir rakam.";
export const isValidPassword = (value: string): boolean =>
  value.length >= 8 && value.length <= 72 && /[a-zA-Z]/.test(value) && /[0-9]/.test(value);

/**
 * A redirect target from a `?next=` value: only a path on this site, never
 * another origin ("//evil", "/\\evil", "https://…") and never an API route.
 */
export function safeNextPath(raw: unknown, fallback = "/hesabim"): string {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 300) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\") || /[\r\n\t]/.test(raw)) return fallback;
  if (raw === "/api" || raw.startsWith("/api/")) return fallback;
  return raw;
}

const NETWORK_ERROR = "Bağlantı kurulamadı. Lütfen tekrar deneyin.";

/** POST/PATCH/DELETE to one of our account routes; the server's message is shown as is. */
export async function accountRequest<T extends Record<string, unknown> = Record<string, unknown>>(
  url: string,
  body: unknown,
  method: "POST" | "PATCH" | "DELETE" = "POST",
): Promise<({ ok: true } & T) | { ok: false; error: string; code?: string; fieldErrors?: Record<string, string> }> {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as
      | ({ ok?: boolean; error?: string; code?: string; fieldErrors?: Record<string, string> } & T)
      | null;
    if (res.ok && data?.ok) return data as { ok: true } & T;
    return { ok: false, error: data?.error ?? NETWORK_ERROR, code: data?.code, fieldErrors: data?.fieldErrors };
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
}

export async function signIn(payload: LoginPayload): Promise<AuthActionResult> {
  return accountRequest<{ redirect?: string }>("/api/account/login", payload);
}

export async function signUp(payload: RegisterPayload): Promise<AuthActionResult> {
  return accountRequest<{ redirect?: string; message?: string }>("/api/account/register", payload);
}

export async function signOut(): Promise<AuthActionResult> {
  return accountRequest("/api/account/logout", {});
}

/** Same answer whether or not an account exists for the address (no account enumeration). */
export async function requestPasswordReset(payload: ForgotPasswordPayload): Promise<AuthActionResult> {
  return accountRequest("/api/account/password-reset", payload);
}

/** New password after an e-mailed reset link (`/sifre-yenile`); the server checks the link's session. */
export async function setNewPassword(payload: { newPassword: string }): Promise<AuthActionResult> {
  return accountRequest<{ redirect?: string }>("/api/account/password", { mode: "recovery", ...payload });
}

/** First profile of a signed-in account that has none yet (`/uyelik-tamamla`). */
export async function completeMembership(payload: {
  fullName: string;
  phone: string;
  acceptTerms?: boolean;
  next?: string;
}): Promise<AuthActionResult> {
  return accountRequest<{ redirect?: string }>("/api/account/profile", payload, "POST");
}

/** Where a social sign-in starts — a full-page navigation, not a fetch. */
export function socialSignInHref(provider: SocialAuthProvider, next?: string): string {
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  return `/api/account/oauth/${provider}${q}`;
}
