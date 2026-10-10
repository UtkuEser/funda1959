/**
 * Server-only Supabase access via the PostgREST endpoint. No SDK dependency.
 * The service-role key is read here and MUST NOT be imported into any client
 * component / "use client" module.
 *
 * Every request through `supabaseRest()` — reads, writes and RPCs — first
 * checks that the connected project is the one this deployment must use
 * (SUPABASE_PLAN.md, D3):
 *   funda1959-test        <- local development + Vercel Preview
 *   funda1959-production  <- Vercel Production
 * Each project carries a one-row marker (`public.app_environment`, migration
 * 0004). If the marker is missing, unreadable or names the other project, no
 * request reaches an application table: the call fails with
 * `DataEnvironmentError` instead.
 */

import type { OrderStatus, OrderSummary } from "./order";

if (typeof window !== "undefined") {
  throw new Error("supabase-server.ts must never be imported on the client");
}

function baseUrl(): string {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("SUPABASE_URL is not configured");
  return url.replace(/\/+$/, "");
}

function serviceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return key;
}

/** True once both the URL and the service-role key are present — used to pick a real vs. mock repository. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * A failed PostgREST call. `status` is the HTTP status, `code` the
 * PostgREST/Postgres error code when the body carries one (e.g. "PGRST205" /
 * "42P01" for a missing table). The message never contains the key.
 */
export class SupabaseRestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
    body: string,
  ) {
    super(`Supabase ${status}: ${body.slice(0, 500)}`);
    this.name = "SupabaseRestError";
  }
}

/**
 * The unchecked request. Private on purpose: only the marker read and the
 * row-free schema probe use it; everything else goes through `supabaseRest`.
 */
async function rawRest<T>(path: string, init?: RequestInit): Promise<T> {
  const key = serviceKey();
  const res = await fetch(`${baseUrl()}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    let code: string | null = null;
    try {
      code = (JSON.parse(text) as { code?: string }).code ?? null;
    } catch {
      /* non-JSON error body */
    }
    throw new SupabaseRestError(res.status, code, text);
  }
  return (text ? JSON.parse(text) : null) as T;
}

/* -------------------------------------------------------------------------- */
/* Data environment (test / production)                                       */
/* -------------------------------------------------------------------------- */

export type DataEnvironment = "test" | "production";

/** Vercel Production -> production data; local development and Vercel Preview -> test data. */
export function expectedDataEnvironment(): DataEnvironment {
  return process.env.VERCEL_ENV === "production" ? "production" : "test";
}

export type MarkerState =
  | { status: "ok"; marker: DataEnvironment }
  | { status: "mismatch"; marker: DataEnvironment }
  | { status: "missing" } // table exists, no row yet
  | { status: "no_table" } // migration 0004 not applied
  | { status: "unreachable"; detail: string };

const MARKER_TTL_MS = 60_000;
const shared = globalThis as unknown as {
  __fundaEnvMarker?: { at: number; state: MarkerState };
  __fundaEnvMarkerInflight?: Promise<MarkerState>;
};

const isMissingRelation = (err: unknown) =>
  err instanceof SupabaseRestError && (err.status === 404 || err.code === "PGRST205" || err.code === "42P01");

/**
 * Reads the connected project's environment marker with the unchecked
 * request (never `supabaseRest`, so this can't recurse). Only stable answers
 * (ok / mismatch) are cached, for a minute per instance; anything else is
 * re-checked on the next call. Concurrent callers share one request.
 */
export async function readDataEnvironmentMarker({ fresh = false }: { fresh?: boolean } = {}): Promise<MarkerState> {
  const hit = shared.__fundaEnvMarker;
  if (!fresh && hit && Date.now() - hit.at < MARKER_TTL_MS) return hit.state;
  if (!fresh && shared.__fundaEnvMarkerInflight) return shared.__fundaEnvMarkerInflight;

  const run = (async (): Promise<MarkerState> => {
    try {
      const rows = await rawRest<{ name: string }[]>("/app_environment?select=name&limit=1");
      const name = rows?.[0]?.name;
      if (name !== "test" && name !== "production") return { status: "missing" };
      return name === expectedDataEnvironment() ? { status: "ok", marker: name } : { status: "mismatch", marker: name };
    } catch (err) {
      return isMissingRelation(err) ? { status: "no_table" } : { status: "unreachable", detail: (err as Error).message };
    }
  })();
  shared.__fundaEnvMarkerInflight = run;
  try {
    const state = await run;
    if (state.status === "ok" || state.status === "mismatch") shared.__fundaEnvMarker = { at: Date.now(), state };
    else delete shared.__fundaEnvMarker;
    return state;
  } finally {
    if (shared.__fundaEnvMarkerInflight === run) delete shared.__fundaEnvMarkerInflight;
  }
}

export type DataEnvironmentFailure = "ENV_MISMATCH" | "ENV_MARKER_MISSING" | "UNREACHABLE";

/** The connected project may not be used by this deployment — no data request was sent. */
export class DataEnvironmentError extends Error {
  constructor(
    readonly reason: DataEnvironmentFailure,
    detail: string,
  ) {
    super(`${reason} — ${detail}`);
    this.name = "DataEnvironmentError";
  }
}

/** Maps a non-ok marker state to the error every caller sees. */
export function dataEnvironmentError(state: Exclude<MarkerState, { status: "ok" }>): DataEnvironmentError {
  switch (state.status) {
    case "mismatch":
      return new DataEnvironmentError("ENV_MISMATCH", `connected project is "${state.marker}", this deployment expects "${expectedDataEnvironment()}"`);
    case "missing":
      return new DataEnvironmentError("ENV_MARKER_MISSING", "public.app_environment has no row — insert the project's marker");
    case "no_table":
      return new DataEnvironmentError("ENV_MARKER_MISSING", "public.app_environment not found — apply migration 0004");
    default:
      return new DataEnvironmentError("UNREACHABLE", state.detail);
  }
}

/**
 * Thin PostgREST client, shared by every domain module that persists to
 * Supabase. Checks the project's environment marker before every read, write
 * or RPC (cached a minute) and throws `DataEnvironmentError` instead of
 * touching a project this deployment must not use.
 */
export async function supabaseRest<T>(path: string, init?: RequestInit): Promise<T> {
  const marker = await readDataEnvironmentMarker();
  if (marker.status !== "ok") throw dataEnvironmentError(marker);
  return rawRest<T>(path, init);
}

/**
 * Schema probe for /api/health: does `table(columns)` exist? `limit=0`, so no
 * row is ever returned. The health route only calls it once the marker is ok.
 */
export async function probeRelation(table: string, columns: string): Promise<"ok" | "missing" | "error"> {
  try {
    await rawRest(`/${table}?select=${columns}&limit=0`);
    return "ok";
  } catch (err) {
    if (isMissingRelation(err) || (err instanceof SupabaseRestError && err.status === 400)) return "missing";
    return "error";
  }
}

/* -------------------------------------------------------------------------- */
/* Orders                                                                      */
/* -------------------------------------------------------------------------- */

type PublicOrderRow = {
  order_number: string;
  status: OrderStatus;
  delivery_type: "delivery" | "pickup";
  delivery_date: string;
  delivery_time_slot: string;
  total: number | string;
  branch_name: string | null;
  /** migration 0006; absent before it is applied */
  is_demo?: boolean | null;
};

function toSummary(row: PublicOrderRow | null): OrderSummary | null {
  if (!row || !row.order_number) return null;
  return {
    orderNumber: row.order_number,
    status: row.status,
    deliveryType: row.delivery_type,
    deliveryDate: row.delivery_date,
    deliveryTimeSlot: row.delivery_time_slot,
    branchName: row.branch_name,
    total: Number(row.total),
    // unknown counts as demo, like the column default (0006)
    isDemo: row.is_demo !== false,
  };
}

/** Atomic order creation via the security-definer RPC. */
export async function createOrder(payload: unknown): Promise<OrderSummary> {
  const row = await supabaseRest<PublicOrderRow | null>("/rpc/create_order", {
    method: "POST",
    body: JSON.stringify({ p_payload: payload }),
  });
  const summary = toSummary(row);
  if (!summary) throw new Error("create_order returned no summary");
  return summary;
}

/** PII-free order summary for the confirmation page. */
export async function getOrderSummary(orderNumber: string): Promise<OrderSummary | null> {
  const row = await supabaseRest<PublicOrderRow | null>("/rpc/get_order_public", {
    method: "POST",
    body: JSON.stringify({ p_order_number: orderNumber }),
  });
  return toSummary(row);
}
