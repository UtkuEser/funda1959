/**
 * Admin session — a small, dependency-free signed cookie.
 *
 * This is a demo-grade authentication layer: env-var credentials
 * (`credentials.ts`) + this HMAC-signed session, NOT a real identity
 * provider. It exists so the admin panel is no longer "trust whatever the
 * URL says" — but before production this MUST be replaced with Supabase
 * Auth (or another real IdP) with real user records, password hashing,
 * and session revocation. Keep that TODO in mind wherever this is read.
 *
 * The signing scheme is intentionally simple (no new dependency): a
 * base64url JSON payload + an HMAC-SHA256 signature over it, verified with
 * a constant-time comparison. Good enough to make the cookie tamper-evident
 * without pulling in a JWT library for two small, non-sensitive fields
 * (role, branchId).
 */
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

if (typeof window !== "undefined") {
  throw new Error("admin/session.ts must never be imported on the client");
}

export const ADMIN_SESSION_COOKIE = "funda_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours — an admin work session, not a long-lived login

export type BranchId = "gop" | "panora" | "incek";
export const BRANCH_IDS: BranchId[] = ["gop", "panora", "incek"];

export type AdminSessionPayload =
  | { role: "SUPER_ADMIN"; exp: number }
  | { role: "BRANCH_MANAGER"; branchId: BranchId; exp: number };

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("ADMIN_SESSION_SECRET is not configured");
  return s;
}

function sign(payloadB64: string): string {
  return createHmac("sha256", secret()).update(payloadB64).digest("base64url");
}

function isBranchId(value: unknown): value is BranchId {
  return typeof value === "string" && (BRANCH_IDS as string[]).includes(value);
}

function encode(payload: AdminSessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Verifies the signature, expiry, and shape. Never throws — bad input just yields `null`. */
function decode(token: string | undefined): AdminSessionPayload | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;

  const body = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(body);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Partial<AdminSessionPayload>;
    if (typeof parsed.exp !== "number" || parsed.exp < Date.now() / 1000) return null;

    if (parsed.role === "SUPER_ADMIN") return { role: "SUPER_ADMIN", exp: parsed.exp };
    if (parsed.role === "BRANCH_MANAGER" && isBranchId((parsed as { branchId?: unknown }).branchId)) {
      return { role: "BRANCH_MANAGER", branchId: (parsed as { branchId: BranchId }).branchId, exp: parsed.exp };
    }
    return null;
  } catch {
    return null;
  }
}

/** Sets the signed session cookie. Only callable from a Route Handler (or Server Action). */
export async function createAdminSession(payload: { role: "SUPER_ADMIN" } | { role: "BRANCH_MANAGER"; branchId: BranchId }): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const token = encode({ ...payload, exp } as AdminSessionPayload);
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/** Clears the session cookie. Only callable from a Route Handler (or Server Action). */
export async function destroyAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);
}

/** Reads + verifies the session cookie. Safe to call from Server Components (read-only). */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const store = await cookies();
  return decode(store.get(ADMIN_SESSION_COOKIE)?.value);
}
