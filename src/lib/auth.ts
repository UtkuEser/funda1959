/**
 * Auth service boundary — TUR 1 (frontend only).
 *
 * These are STUBS. There is no real backend, no session, no credential
 * storage, no email delivery. The password is never persisted or logged.
 *
 * To connect Supabase Auth later, replace only the bodies below:
 *   signIn               -> supabase.auth.signInWithPassword({ email/phone, password })
 *   signUp               -> supabase.auth.signUp({ email, password, options: { data } })
 *   requestPasswordReset -> supabase.auth.resetPasswordForEmail(email)
 * TODO: connect Supabase Auth.
 */

import { isValidEmail, isValidPhone } from "./checkout-utils";

export type AuthActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; code?: string };

/** Consumer social login providers wired into this auth architecture. */
export type SocialAuthProvider = "google" | "apple" | "facebook";

export type LoginPayload = {
  identifier: string; // e-posta or telefon
  password: string;
  remember: boolean;
};

export type RegisterPayload = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  consentKvkk: boolean;
  consentMarketing: boolean;
};

export type ForgotPasswordPayload = {
  email: string;
};

/** Shared password policy — used by register + profile password change. */
export const PASSWORD_HINT = "En az 8 karakter, bir harf ve bir rakam.";
export const isValidPassword = (value: string): boolean =>
  value.length >= 8 && /[a-zA-Z]/.test(value) && /[0-9]/.test(value);

export function identifierKind(value: string): "email" | "phone" | "unknown" {
  const v = value.trim();
  if (v.includes("@")) return isValidEmail(v) ? "email" : "unknown";
  if (isValidPhone(v)) return "phone";
  return "unknown";
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function signIn(payload: LoginPayload): Promise<AuthActionResult> {
  await wait(600);
  if (identifierKind(payload.identifier) === "unknown" || payload.password.length === 0) {
    return { ok: false, error: "Bilgilerinizi kontrol edip tekrar deneyin." };
  }
  // TODO: connect Supabase Auth. No session is created in TUR 1.
  return { ok: true, message: "Giriş bilgileriniz doğrulandı." };
}

export async function signUp(payload: RegisterPayload): Promise<AuthActionResult> {
  await wait(700);
  if (!payload.consentKvkk) {
    return { ok: false, error: "Devam etmek için gerekli onayı işaretleyin." };
  }
  // TODO: connect Supabase Auth. No user is created in TUR 1.
  return { ok: true, message: "Hesabınız oluşturulmaya hazır." };
}

const SOCIAL_PROVIDER_LABEL: Record<SocialAuthProvider, string> = {
  google: "Google",
  apple: "Apple",
  facebook: "Facebook",
};

/**
 * Social sign-in boundary — STUB. No real OAuth is started here.
 *
 * Nothing is persisted: no token, no session, no cookie, no localStorage /
 * sessionStorage, no fake user. The stub returns a controlled
 * `provider_not_configured` result so the UI can show a calm "coming soon"
 * notice without pretending a login happened.
 *
 * TODO: connect Supabase OAuth. Replace the body with, per provider:
 *   return supabaseBrowser().auth.signInWithOAuth({
 *     provider,                       // "google" | "apple" | "facebook"
 *     options: { redirectTo: `${window.location.origin}/auth/callback?next=/hesabim` },
 *   });
 * Provider credentials (Google Cloud / Meta / Apple Developer) are configured in
 * the Supabase dashboard, not in this file. The /auth/callback route and the
 * post-login redirect are added together with that integration.
 *
 * TODO: collect missing phone after first social sign-in — Google / Apple /
 * Facebook do not reliably return a phone number and checkout/orders need one.
 */
export async function signInWithSocialProvider(
  provider: SocialAuthProvider,
): Promise<AuthActionResult> {
  await wait(400);
  return {
    ok: false,
    code: "provider_not_configured",
    error: `${SOCIAL_PROVIDER_LABEL[provider]} ile giriş yakında etkinleştirilecek.`,
  };
}

export async function requestPasswordReset(
  payload: ForgotPasswordPayload,
): Promise<AuthActionResult> {
  await wait(600);
  if (!isValidEmail(payload.email)) {
    return { ok: false, error: "Geçerli bir e-posta adresi girin." };
  }
  // TODO: connect Supabase Auth. Generic response — never reveals whether the
  // account exists (account-enumeration safe).
  return { ok: true };
}
