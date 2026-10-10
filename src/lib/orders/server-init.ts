/**
 * Server-only bootstrap: swaps in the Supabase-backed order repository when
 * Supabase is configured, so the admin lists and status changes use the
 * database instead of this process's memory.
 *
 * Kept OUT of `orders/index.ts` so nothing client-reachable pulls in
 * `supabase-server.ts`. Import it only for its side effect, only from server
 * entry points: `app/admin/page.tsx`, `app/api/admin/orders/route.ts`.
 * Without Supabase env vars it is a no-op and the in-memory store keeps
 * serving (developer machine only).
 */
import { isSupabaseConfigured } from "../supabase-server";
import { setOrderRepository } from "./repository";
import { SupabaseOrderRepository } from "./supabase-repository";

if (isSupabaseConfigured()) {
  setOrderRepository(new SupabaseOrderRepository());
}
