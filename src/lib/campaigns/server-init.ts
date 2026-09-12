/**
 * Server-only bootstrap: swaps in the Supabase-backed campaign repository
 * when Supabase is configured, so admin writes actually persist instead of
 * only ever touching the in-memory mock.
 *
 * Deliberately kept OUT of `campaigns/index.ts` (the barrel `AdminCampaigns.tsx`
 * — a "use client" component — imports from). `supabase-repository.ts`
 * imports `supabase-server.ts`, which throws if it ever loads in the
 * browser; keeping that whole chain out of the client-reachable barrel is
 * what makes the throw purely defensive instead of a real crash risk.
 *
 * Import this file only for its side effect, only from server-only entry
 * points: `CampaignsSection.tsx`, `admin/page.tsx`, `api/admin/campaigns/route.ts`.
 * Without Supabase env vars, this is a no-op and the in-memory mock keeps
 * serving (local dev only — not real persistence).
 */
import { setCampaignRepository } from "./repository";
import { SupabaseCampaignRepository } from "./supabase-repository";
import { isSupabaseConfigured } from "../supabase-server";

if (isSupabaseConfigured()) {
  setCampaignRepository(new SupabaseCampaignRepository());
}
