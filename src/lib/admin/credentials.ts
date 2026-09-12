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

/** A GOP login only ever succeeds for `branchId: "gop"` — the env lookup is keyed by branch. */
export function verifyBranchCredentials(branchId: BranchId, username: string, password: string): boolean {
  const envNames = BRANCH_ENV_VARS[branchId];
  const expectedUser = process.env[envNames.user];
  const expectedPass = process.env[envNames.pass];
  if (!expectedUser || !expectedPass) return false; // not configured -> deny, never a default/fallback account
  return safeEqual(username, expectedUser) && safeEqual(password, expectedPass);
}

export function verifyCentralCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.MERKEZ_ADMIN_USERNAME;
  const expectedPass = process.env.MERKEZ_ADMIN_PASSWORD;
  if (!expectedUser || !expectedPass) return false;
  return safeEqual(username, expectedUser) && safeEqual(password, expectedPass);
}
