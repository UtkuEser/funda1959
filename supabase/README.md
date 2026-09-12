# Supabase — order & campaign persistence

## What lives here

`migrations/0001_init_orders.sql` — the full order schema:

- `branches` (seeded: GOP, Panora, İncek TONA), `customers`, `addresses`,
  `orders`, `order_items`
- RLS enabled on every table; no anon/authenticated table access
- `create_order(jsonb)` — atomic, security-definer, idempotent on
  `client_request_id`. Generates the real `order_number` server-side
  (`FND-YYYYMMDD-XXXX`, guaranteed unique via constraint + retry loop)
- `get_order_public(text)` — PII-free summary for the confirmation page

`migrations/0002_campaigns.sql` — the `campaigns` table (homepage "Aktif
Kampanyalar" content, managed from `/admin?section=campaigns`):

- plain CRUD table, no RPCs — reads/writes go through
  `src/lib/campaigns/supabase-repository.ts` (server-only, service role)
- `check` constraints: `end_at > start_at`, `branch_ids` never empty
- `updated_at` kept current by the same trigger function 0001 defines
- RLS enabled, no policies — locked to the service role until real auth ships
- idempotent demo seed (the 4 campaigns the in-memory mock used to serve) —
  only inserts when the table is still empty, never duplicates

## Applying it

With the Supabase CLI (project linked):

```bash
supabase db push
```

Or paste a migration file into **SQL Editor** and run it, in order
(`0001_init_orders.sql` then `0002_campaigns.sql`).

## Environment

Copy `.env.example` → `.env.local` and fill:

| var | used by | notes |
| --- | --- | --- |
| `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) | server | project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | `POST /api/orders`, confirmation page, campaign admin CRUD, homepage campaign reads. Never shipped to the browser. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — | reserved for future client use |

Both `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) and
`SUPABASE_SERVICE_ROLE_KEY` must be set for campaigns to use Supabase —
`isSupabaseConfigured()` in `src/lib/supabase-server.ts` checks both. Without
them, `src/lib/campaigns` falls back to the in-memory mock (local dev
convenience only — nothing persists across a restart).

## Flow

**Orders:** `checkout → POST /api/orders` (validates + re-prices against
`src/lib/data.ts`) `→ rpc create_order` (atomic insert) `→ order_number`
`→ /siparis-basarili?order=…` (server reads `get_order_public`).

**Campaigns:** `/admin?section=campaigns` (SUPER_ADMIN) `→ POST/PATCH/DELETE
/api/admin/campaigns → SupabaseCampaignRepository` (plain REST CRUD, no RPC
needed) `→` homepage `CampaignsSection` reads the same table on every
request (`/` is `force-dynamic` specifically because of this — see
`src/app/page.tsx`).
