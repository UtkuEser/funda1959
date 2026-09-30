/**
 * Admin login credentials — read from server-only environment variables.
 * Never imported by a "use client" file; never logged.
 *
 * Demo-grade: this is a fixed, single account per branch (plus one central
 * account), not a user table. Before production, replace with Supabase
 * Auth (or another real IdP) with per-person accounts and hashed passwords
 * — see the TODO in `session.ts`.
 */
import { timingSafeEqual } from "node:crypto";
import type { BranchId } from "./session";

if (typeof window !== "undefined") {
  throw new Error("admin/credentials.ts must never be imported on the client");
}

const BRANCH_ENV_VARS: Record<BranchId, { user: string; pass: string }> = {
  gop: { user: "ADMIN_GOP_USERNAME", pass: "ADMIN_GOP_PASSWORD" },
  panora: { user: "ADMIN_PANORA_USERNAME", pass: "ADMIN_PANORA_PASSWORD" },
  incek: { user: "ADMIN_INCEK_USERNAME", pass: "ADMIN_INCEK_PASSWORD" },
};

/** Constant-time-ish string compare — avoids a naive `===` timing leak on the secret. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

const warnedUnconfigured = new Set<string>();

/**
 * Missing env vars look exactly like a wrong password to the client (same
 * generic message by design), so name the real cause in the server log —
 * variable names only, once per account.
 */
function warnUnconfigured(userVar: string, passVar: string): void {
  if (warnedUnconfigured.has(userVar)) return;
  warnedUnconfigured.add(userVar);
  console.warn(`[admin-login] ${userVar} / ${passVar} is not configured — every login for this account is rejected. See .env.example.`);
}

/** A GOP login only ever succeeds for `branchId: "gop"` — the env lookup is keyed by branch. */
export function verifyBranchCredentials(branchId: BranchId, username: string, password: string): boolean {
  const envNames = BRANCH_ENV_VARS[branchId];
  const expectedUser = process.env[envNames.user];
  const expectedPass = process.env[envNames.pass];
  if (!expectedUser || !expectedPass) {
    warnUnconfigured(envNames.user, envNames.pass);
    return false; // not configured -> deny, never a default/fallback account
  }
  return safeEqual(username, expectedUser) && safeEqual(password, expectedPass);
}

export function verifyCentralCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.MERKEZ_ADMIN_USERNAME;
  const expectedPass = process.env.MERKEZ_ADMIN_PASSWORD;
  if (!expectedUser || !expectedPass) {
    warnUnconfigured("MERKEZ_ADMIN_USERNAME", "MERKEZ_ADMIN_PASSWORD");
    return false;
  }
  return safeEqual(username, expectedUser) && safeEqual(password, expectedPass);
}
