import { NextResponse } from "next/server";
import { resolveAdminScope } from "@/lib/admin/access";
import { isSupabaseConfigured, probeRelation } from "@/lib/supabase-server";
import { customerAuthConfig, isSignupOpen } from "@/lib/customer-auth/config";
import { readAuthSettings } from "@/lib/customer-auth/providers";
import {
  expectedDataEnvironment,
  isServerlessRuntime,
  readDataEnvironmentMarker,
  runtimeLabel,
} from "@/lib/persistence";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — is this deployment connected to the right database?
 *   database: "ready"            configured, reachable, marker matches
 *             "not_configured"   no SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 *             "unreachable"      configured but the project didn't answer
 *             "marker_missing"   migration 0004 not applied / marker row not inserted
 *             "env_mismatch"     connected to the other project (test <-> production)
 * Public answer: status words only. A Merkez Yönetim session additionally
 * gets per-table checks (which migrations are applied) — only once the
 * marker matches, and schema-only (`limit=0`): no customer or order row is
 * ever read — plus the customer Auth settings that matter for Aşama 5
 * (sign-ups open, "Confirm email" off, enabled providers). Never any key or URL.
 */

const TABLE_PROBES: { table: string; select: string; migration: string }[] = [
  { table: "branches", select: "slug", migration: "0001" },
  { table: "orders", select: "id", migration: "0001" },
  { table: "campaigns", select: "id", migration: "0002" },
  { table: "branch_product_status", select: "branch_slug", migration: "0003" },
  { table: "app_environment", select: "name", migration: "0004" },
  { table: "campaigns", select: "image_has_text,seed_key", migration: "0005" },
  { table: "orders", select: "is_demo", migration: "0006" },
  { table: "orders", select: "sales_channel,delivery_zone_id,cancel_reason", migration: "0007" },
  { table: "order_status_events", select: "id", migration: "0007" },
  { table: "delivery_zone_fees", select: "zone_id,state,fee,updated_by,updated_at", migration: "0008" },
  { table: "product_prices", select: "product_id,variant_key,price,updated_by,updated_at", migration: "0009" },
  { table: "customer_profiles", select: "auth_user_id,full_name,phone,email,terms_version,terms_accepted_at", migration: "0010" },
  { table: "customer_addresses", select: "id,auth_user_id,is_default", migration: "0010" },
  { table: "orders", select: "customer_user_id", migration: "0010" },
];

export async function GET() {
  const configured = isSupabaseConfigured();
  const expected = expectedDataEnvironment();

  let database: "ready" | "not_configured" | "unreachable" | "marker_missing" | "env_mismatch" = "not_configured";
  let marker: string | null = null;
  if (configured) {
    const state = await readDataEnvironmentMarker({ fresh: true });
    if (state.status === "ok") database = "ready";
    else if (state.status === "mismatch") database = "env_mismatch";
    else if (state.status === "unreachable") database = "unreachable";
    else database = "marker_missing";
    marker = state.status === "ok" || state.status === "mismatch" ? state.marker : null;
  }

  // on Vercel nothing but "ready" can store data; a developer machine may run on local stores
  const ok = database === "ready" || (!isServerlessRuntime() && database === "not_configured");

  const body: Record<string, unknown> = {
    ok,
    runtime: runtimeLabel(),
    expectedData: expected,
    database,
  };

  const scope = await resolveAdminScope();
  if (scope?.user.role === "SUPER_ADMIN") {
    body.connectedData = marker;
    if (database === "ready") {
      body.migrations = Object.fromEntries(
        await Promise.all(
          TABLE_PROBES.map(async (p) => [`${p.migration} ${p.table}(${p.select})`, await probeRelation(p.table, p.select)] as const),
        ),
      );
    } else if (configured) {
      // wrong or unmarked project: nothing but the marker is touched
      body.migrations = "not_checked";
    }
    // customer membership (§8.2): only once the marker matches
    if (!customerAuthConfig()) {
      body.customerAuth = { configured: false };
    } else if (database === "ready") {
      const settings = await readAuthSettings({ fresh: true });
      body.customerAuth = settings
        ? {
            configured: true,
            signupOpenInCode: isSignupOpen(),
            signupEnabledInSupabase: settings.signupEnabled,
            emailConfirmationOff: settings.emailAutoconfirm,
            providersEnabledInSupabase: settings.externalEnabled,
          }
        : { configured: true, settings: "unreadable" };
    } else {
      body.customerAuth = { configured: true, settings: "not_checked" };
    }
  }

  return NextResponse.json(body, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
