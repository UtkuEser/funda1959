/**
 * Customer membership switches — Aşama 5 (SUPABASE_PLAN.md §8.2, D22–D26).
 * Server-only.
 *
 * Like the production order-intake gate, these are decided in code, never by
 * an environment variable or a request field: opening any of them is a code
 * change, a deploy and a separate approval.
 */

import { expectedDataEnvironment } from "../supabase-server";
import type { MembershipTermsView, SocialAuthProvider } from "../auth";

if (typeof window !== "undefined") {
  throw new Error("customer-auth/config.ts must never be imported on the client");
}

export const SOCIAL_PROVIDERS: SocialAuthProvider[] = ["google", "apple", "facebook"];

/**
 * Social providers the code allows (D22). A button shows only when the
 * provider is allowed here AND enabled in the connected Supabase project.
 *
 * google — BLOCKED. Supabase links an OAuth sign-in to an existing account
 * with the same e-mail automatically, and with "Confirm email" off (D23) a
 * password account's e-mail counts as confirmed — so a password account
 * opened with someone else's address would keep working after the real
 * owner signs in with Google (Supabase docs, "Identity Linking"; no setting
 * turns automatic linking off). Not opened until that is solved without
 * invalidating passwords or signing sessions out (§8.2 "Google engeli").
 * The Google provider must also stay off in the Supabase dashboard: this
 * switch only covers our own buttons and callback.
 *
 * apple, facebook — later (D22).
 */
export const SOCIAL_PROVIDERS_ALLOWED: Record<SocialAuthProvider, boolean> = {
  google: false,
  apple: false,
  facebook: false,
};

/** `version` is stored with each consent (customer_profiles.terms_version). */
export type MembershipTerms = MembershipTermsView;

/**
 * The published membership texts (D26, A24) — none yet. While this is null
 * no consent is asked for and none is stored: the profile's consent columns
 * stay empty, nothing is recorded "as if" accepted.
 */
export function membershipTerms(): MembershipTerms | null {
  return null;
}

/**
 * New accounts may be created only with test data (local development and
 * Vercel Preview, project marked "test") so the web team can try the sign-up
 * flow. Production stays closed: opening membership to real customers needs
 * the published texts and a separate approval (D26).
 */
export function isSignupOpen(): boolean {
  return expectedDataEnvironment() === "test";
}

export type CustomerAuthConfig = { url: string; anonKey: string };

/**
 * Supabase Auth needs the project URL, the anon (publishable) key — server-only
 * here, never sent to the browser — and the service role for the member's
 * rows. Null when any is missing (e.g. no `.env.local`): membership is then
 * unavailable, guest checkout keeps working.
 */
export function customerAuthConfig(): CustomerAuthConfig | null {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return { url: url.replace(/\/+$/, ""), anonKey };
}
