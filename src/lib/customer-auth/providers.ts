/**
 * Which sign-in options to show (D22) and the Auth settings summary for
 * Merkez's /api/health. Server-only.
 *
 * Read from the connected project's public Auth settings
 * (`GET /auth/v1/settings`, anon key) after the environment marker check.
 * A social button shows only when the provider is enabled there AND allowed
 * in code (`SOCIAL_PROVIDERS_ALLOWED`); if the settings can't be read, none
 * shows. Cached a minute per instance.
 */

import type { SocialAuthProvider } from "../auth";
import { SOCIAL_PROVIDERS, SOCIAL_PROVIDERS_ALLOWED } from "./config";
import { authEnvironment, CustomerAuthUnavailableError } from "./server";

if (typeof window !== "undefined") {
  throw new Error("customer-auth/providers.ts must never be imported on the client");
}

export type AuthSettings = {
  /** "Allow new users to sign up" */
  signupEnabled: boolean;
  /** true = "Confirm email" off (D23) */
  emailAutoconfirm: boolean;
  /** the providers switched on in the Supabase dashboard */
  externalEnabled: Partial<Record<SocialAuthProvider | "email", boolean>>;
};

const TTL_MS = 60_000;
const cache = globalThis as unknown as { __fundaAuthSettings?: { at: number; value: AuthSettings } };

export async function readAuthSettings({ fresh = false }: { fresh?: boolean } = {}): Promise<AuthSettings | null> {
  const hit = cache.__fundaAuthSettings;
  if (!fresh && hit && Date.now() - hit.at < TTL_MS) return hit.value;
  try {
    const cfg = await authEnvironment();
    const res = await fetch(`${cfg.url}/auth/v1/settings`, { headers: { apikey: cfg.anonKey }, cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      disable_signup?: boolean;
      mailer_autoconfirm?: boolean;
      external?: Record<string, boolean>;
    };
    const value: AuthSettings = {
      signupEnabled: body.disable_signup !== true,
      emailAutoconfirm: body.mailer_autoconfirm === true,
      externalEnabled: {
        email: body.external?.email === true,
        google: body.external?.google === true,
        apple: body.external?.apple === true,
        facebook: body.external?.facebook === true,
      },
    };
    cache.__fundaAuthSettings = { at: Date.now(), value };
    return value;
  } catch (err) {
    if (!(err instanceof CustomerAuthUnavailableError)) {
      console.error("[customer-auth] settings could not be read", { error: (err as Error).message });
    }
    return null;
  }
}

/** The social buttons to render on /giris and /uye-ol — none until one is allowed AND enabled. */
export async function availableSocialProviders(): Promise<SocialAuthProvider[]> {
  const allowed = SOCIAL_PROVIDERS.filter((p) => SOCIAL_PROVIDERS_ALLOWED[p]);
  if (allowed.length === 0) return [];
  const settings = await readAuthSettings();
  if (!settings) return [];
  return allowed.filter((p) => settings.externalEnabled[p] === true);
}

/** May this provider start or finish a sign-in right now? */
export async function isSocialProviderAvailable(provider: string): Promise<boolean> {
  return (await availableSocialProviders()).includes(provider as SocialAuthProvider);
}
