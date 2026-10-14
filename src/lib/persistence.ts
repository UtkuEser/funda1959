/**
 * Persistence guard — decides, for every write, whether it may happen and
 * where it lands. Server-only.
 *
 * Which Supabase project may be used (test / production) is enforced for
 * every request — reads, writes and RPCs — in `supabase-server.ts`. This
 * module checks the same marker up front so a refused write becomes a plain
 * 503, and adds the write-side rule: on a serverless host (Vercel Preview /
 * Production) a write NEVER falls back to process memory or a local file —
 * those are per-instance and vanish, so a "saved" answer would be a fake
 * success. Such writes fail with `PersistenceUnavailableError` (-> HTTP 503);
 * the reason goes to the log. Only a developer machine without Supabase keeps
 * the in-memory / file stores.
 */
import {
  dataEnvironmentError,
  expectedDataEnvironment,
  isSupabaseConfigured,
  readDataEnvironmentMarker,
  type DataEnvironment,
  type MarkerState,
} from "./supabase-server";

if (typeof window !== "undefined") {
  throw new Error("persistence.ts must never be imported on the client");
}

export { expectedDataEnvironment, readDataEnvironmentMarker, type DataEnvironment, type MarkerState };

export type PersistentDomain = "inventory" | "orders" | "campaigns" | "funda-points" | "delivery-fees" | "prices" | "contact";

/** Domains whose data already has a Supabase table + store in this codebase. */
const DATABASE_BACKED: Record<PersistentDomain, boolean> = {
  inventory: true, // branch_product_status (0003)
  orders: true, // create_order RPC (0001)
  campaigns: true, // campaigns (0002, 0005)
  "funda-points": true, // funda_point_* ledger (0011)
  "delivery-fees": true, // delivery_zone_fees (0008)
  prices: true, // product_prices (0009)
  contact: true, // contact_requests (0012)
};

/** Plain wording per domain — the technical reason is logged, never shown. */
const USER_MESSAGE: Record<PersistentDomain, string> = {
  inventory: "Kayıt servisi şu an kullanılamıyor; değişiklik kaydedilmedi.",
  orders: "Siparişiniz şu an alınamıyor. Lütfen daha sonra tekrar deneyin.",
  campaigns: "Kampanya kaydedilemedi: kayıt servisi şu an kullanılamıyor.",
  "funda-points": "Puan hareketi kaydedilemedi: kayıt servisi şu an kullanılamıyor.",
  "delivery-fees": "Teslimat ücreti kaydedilemedi: kayıt servisi şu an kullanılamıyor.",
  prices: "Fiyat kaydedilemedi: kayıt servisi şu an kullanılamıyor.",
  contact: "Mesajınız şu an kaydedilemedi. Lütfen daha sonra tekrar deneyin veya şubelerimizi arayın.",
};

/** Vercel (Preview + Production) or another serverless host. */
export function isServerlessRuntime(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

/** "vercel-production" | "vercel-preview" | "vercel-development" | "serverless" | "local" — for logs and /api/health. */
export function runtimeLabel(): string {
  if (process.env.VERCEL) return `vercel-${process.env.VERCEL_ENV ?? "unknown"}`;
  return isServerlessRuntime() ? "serverless" : "local";
}

export type PersistenceFailureReason =
  | "NOT_CONFIGURED"
  | "NOT_DATABASE_BACKED"
  | "ENV_MISMATCH"
  | "ENV_MARKER_MISSING"
  | "UNREACHABLE";

export class PersistenceUnavailableError extends Error {
  constructor(
    readonly domain: PersistentDomain,
    readonly reason: PersistenceFailureReason,
    detail: string,
  ) {
    super(`${domain}: ${reason} — ${detail}`);
    this.name = "PersistenceUnavailableError";
  }
  /** what the customer / admin sees */
  get userMessage(): string {
    return USER_MESSAGE[this.domain];
  }
}

/** Where an allowed write lands. */
export type WriteTarget = "database" | "local";

/**
 * Call before every write; throws instead of letting it land somewhere that
 * would only look saved.
 *   - Supabase configured + the domain has a table: the project's marker must
 *     match this deployment, otherwise refuse.
 *   - Serverless and (no Supabase, or the domain has no table yet): refuse.
 *   - Developer machine otherwise: the local in-memory / file store.
 */
export async function assertPersistentWrite(domain: PersistentDomain): Promise<WriteTarget> {
  const configured = isSupabaseConfigured();

  if (configured && DATABASE_BACKED[domain]) {
    const marker = await readDataEnvironmentMarker();
    if (marker.status === "ok") return "database";
    const err = dataEnvironmentError(marker);
    throw new PersistenceUnavailableError(domain, err.reason, err.message);
  }

  if (isServerlessRuntime()) {
    throw configured
      ? new PersistenceUnavailableError(domain, "NOT_DATABASE_BACKED", "this domain has no Supabase store yet; in-memory data would not survive")
      : new PersistenceUnavailableError(domain, "NOT_CONFIGURED", "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing on a serverless deployment");
  }
  return "local";
}

/**
 * Server-log line for a refused write (no secrets). Domain and reason are in
 * the text too: the dev log file keeps only the message string.
 */
export function logPersistenceRefusal(err: PersistenceUnavailableError, context: Record<string, unknown> = {}): void {
  console.error(`[persistence] write refused domain=${err.domain} reason=${err.reason}`, {
    domain: err.domain,
    reason: err.reason,
    runtime: runtimeLabel(),
    expected: expectedDataEnvironment(),
    ...context,
    error: err.message,
  });
}
