/**
 * Guard for the manual verify-* scripts. They create, change and delete data
 * (orders, campaigns, …), so they may only run against process memory (no
 * Supabase keys set) or a Supabase project whose environment marker
 * (`public.app_environment`, migration 0004) reads "test".
 *
 * Refused — before any data request is sent:
 *   - VERCEL_ENV=production in the shell;
 *   - a project marked "production", or one with no / an unreadable marker.
 * The connected URL and keys are never printed.
 */
import { isSupabaseConfigured, readDataEnvironmentMarker } from "@/lib/supabase-server";

function refuse(script: string, reason: string): never {
  console.error(`\n[${script}] refused: ${reason}`);
  console.error("  Verify scripts write data; they only run in memory or against the funda1959-test project.");
  process.exit(2);
}

/** Call first thing in `main()`. Returns where the script's writes will land. */
export async function requireTestEnvironmentForWrites(script: string): Promise<"memory" | "test-database"> {
  if (process.env.VERCEL_ENV === "production") refuse(script, "VERCEL_ENV=production");
  if (!isSupabaseConfigured()) return "memory";

  const marker = await readDataEnvironmentMarker({ fresh: true });
  if (marker.status === "ok" && marker.marker === "test") return "test-database";
  if (marker.status === "ok" || marker.status === "mismatch") {
    refuse(script, `connected project is marked "${marker.marker}", not "test"`);
  }
  refuse(script, `environment marker not verified (${marker.status})`);
}
