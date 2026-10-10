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

`migrations/0003_branch_product_status.sql` — branch stock status for the
admin "Şube Stokları" screen:

- one row per `branch_slug` + `product_id`, boolean `is_active` (no
  quantities); `branch_slug` references `branches.slug`, so an empty or
  "all" branch can't be stored
- separate from the product's publish state: a passive (`false`) product stays
  listed and orderable, customers see "En erken yarına teslim"
- written only by `PATCH /api/admin/inventory` (service role, upsert); read by
  every server path that computes availability
- RLS enabled, no policies

**Production needs this table and the two env vars below.** On a serverless
host without them, stock changes are refused with a 503 (the deploy's file
system is read-only and per-instance, so nothing could be saved there) — the
panel never shows an unsaved change as saved.

`migrations/0004_app_environment.sql` — one-row marker table naming the
project (`test` / `production`). Identical in both projects; the row itself
is inserted by hand once per project (see "Applying it"). The app refuses
every Supabase request — reads, writes and RPCs — when the connected
project's marker is missing or doesn't match the deployment
(`src/lib/supabase-server.ts`; writes also get a 503 from
`src/lib/persistence.ts`): local + Vercel Preview → `test`, Vercel
Production → `production`.

`migrations/0005_campaign_posters.sql` — `campaigns.image_has_text` +
`campaigns.seed_key`; inserts the five poster campaigns (`/kampanya/1–5.png`)
once; switches off the four 0002 demo rows only if nobody edited them.
Re-running changes nothing.

`migrations/0006_orders_demo_flag.sql` — demo orders are marked explicitly:

- `orders.is_demo boolean not null default true` — every order is a demo
  until a payment provider exists (existing rows become demo too)
- check `orders_demo_never_paid`: a demo order can never be `paid`
- `create_order` redefined: writes `is_demo = true` and
  `payment_status = 'pending'`, refuses a payload with `is_demo` ≠ `true`;
  otherwise identical to 0001
- `get_order_public` also returns `is_demo`
- re-running changes nothing

The server always sends `is_demo: true` (`src/lib/orders/engine.ts`; the
browser can't set it), and production order intake is closed in the app
(`POST /api/orders` → 503), so demo orders only exist in the test project.

`migrations/0007_orders_hardening.sql` — Aşama 2 (orders read from the
database, admin status changes; SUPABASE_PLAN.md D12):

- `orders.sales_channel` (`web` / `mobile` / `store`), `orders.delivery_zone_id`,
  cancellation record `cancel_reason` / `cancelled_by` / `cancelled_at`
  (check: all three set once an order is cancelled, reason ≥ 3 chars)
- `order_status_events` — every admin status change: from, to, account,
  name, reason, time (RLS on, no policies)
- `create_order` v3 — serialised per `client_request_id`
  (`pg_advisory_xact_lock`: a concurrent retry returns the same order), the
  branch is written for delivery orders too (the server derives it from the
  address), `delivery_zone_id` required for delivery, amounts and the
  delivery date re-checked; still demo-only
- `list_orders(...)` — admin list: branch scope (`null` = Merkez),
  delivery-date range, newest first, ≤ 200 rows, `total` + `status_counts`
- `update_order_status(...)` — one step forward or cancel with a reason,
  only within the caller's branches; delivered orders are never cancelled,
  nothing is refunded
- all three functions: service role only; membership, Funda Puan and payment
  columns are left to their own phases
- re-running changes nothing

`migrations/0008_delivery_zone_fees.sql` — Aşama 3 (SUPABASE_PLAN.md D14, D15):

- `delivery_zone_fees` — one row per zone id; three states kept apart by a
  check: `unset` (fee null) / `paid` (fee > 0, kuruş) / `free` (fee 0, only by
  an explicit choice). A zone without a row is `unset` — never free. Last
  editor + time stored (`updated_at` via `set_updated_at`); no history table.
  **Nothing is seeded** — the old sample fees are not approved prices. RLS on,
  no policies; written only by the server for a Merkez session
  (`PATCH /api/admin/delivery-fees`).
- `create_order` v4 — a delivery order must carry the zone's current, set fee
  (`delivery_fee_not_set` / `delivery_fee_mismatch`) and reach 500 TL on
  products − discount (`below_minimum`); pickup has no fee and no minimum. A
  retried request still returns the order it created first; stored orders
  keep their fee and total.
- re-running changes nothing

The zone / neighbourhood list (`src/lib/delivery/zones.ts`) is test data, not an
approved service area. Until Merkez sets a zone's fee, delivery to that zone is
refused and pickup keeps working.

## Applying it

With the Supabase CLI (project linked):

```bash
supabase db push
```

Or paste a migration file into **SQL Editor** and run it, in order
(`0001` → `0002` → `0003` → `0004` → `0005` → `0006` → `0007` → `0008`), **in both
projects** (`funda1959-test`, `funda1959-production`) — a new migration goes
to the test project first (SUPABASE_PLAN.md §7.6, "Aşama 2 kurulum kontrolü").

Then, once per project, insert its marker in the SQL Editor:

```sql
-- funda1959-test
insert into public.app_environment (name) values ('test');
-- funda1959-production
insert into public.app_environment (name) values ('production');
```

Until the marker row exists, the app sends no request to any application
table — reads and writes alike.

Check with `GET /api/health` on the deployment (`"database": "ready"`); a
Merkez Yönetim session also sees which migrations are applied (`0001`–`0008`).
These checks run only once the marker matches and use `limit=0`, so no
customer or order row is ever read.

## Verify scripts

`scripts/verify-*.ts` write data. `scripts/test-environment-guard.ts` lets
them run only in memory (no Supabase keys) or against a project marked
`test`; `VERCEL_ENV=production`, a `production` marker or a missing marker
stops them before any request.

## Environment

Copy `.env.example` → `.env.local` and fill:

| var | used by | notes |
| --- | --- | --- |
| `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) | server | project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | `POST /api/orders`, confirmation page, campaign admin CRUD, homepage campaign reads, branch stock status. Never shipped to the browser. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — | reserved for future client use |

Both `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) and
`SUPABASE_SERVICE_ROLE_KEY` must be set for campaigns to use Supabase —
`isSupabaseConfigured()` in `src/lib/supabase-server.ts` checks both. Without
them, `src/lib/campaigns` falls back to the in-memory mock (local dev
convenience only — nothing persists across a restart).

## Flow

**Orders:** `checkout → POST /api/orders` → branch stock read strictly (503
if it can't be read) → `src/lib/order-server.ts` (prices from
`src/lib/data.ts`, delivery branch + zone + fee from the address, date and
slot re-checked against the availability engine in Europe/Istanbul; 400 / 409)
`→ rpc create_order` (atomic insert, `is_demo = true`) `→ order_number`
`→ /siparis-basarili?order=…` (server reads `get_order_public`). The payment
screen shows `POST /api/orders/quote` — the same validation and pricing, nothing
written — so its total (products + delivery fee) is the order's total. On Vercel
Production `POST /api/orders` answers 503 ("Online sipariş alımı henüz
açılmadı.") before reading the request, and the demo button is not shown.

**Delivery fees + minimum:** availability, the payment-screen quote and the
order all read the fee from `delivery_zone_fees` (`src/lib/delivery/fees.ts`,
`fees-server.ts`); an unreadable table means "Teslimat bilgisi şu an
alınamıyor" — no older value is used. The 500 TL delivery minimum
(`src/lib/order-rules.ts`) is checked in the cart, quick order and checkout,
again by the quote and the order, and once more inside `create_order`.

**Admin orders:** `/admin?section=orders` (`from`, `to`, `page`) and the
overview `→ SupabaseOrderRepository → rpc list_orders` with the branch scope of
the signed session; `PATCH /api/admin/orders` `→ rpc update_order_status`.

**Campaigns:** `/admin?section=campaigns` (SUPER_ADMIN) `→ POST/PATCH/DELETE
/api/admin/campaigns → SupabaseCampaignRepository` (plain REST CRUD, no RPC
needed) `→` homepage `CampaignsSection` reads the same table on every
request (`/` is `force-dynamic` specifically because of this — see
`src/app/page.tsx`).
