# Supabase — order persistence

## What lives here

`migrations/0001_init_orders.sql` — the full schema:

- `branches` (seeded: GOP, Panora, İncek TONA), `customers`, `addresses`,
  `orders`, `order_items`
- RLS enabled on every table; no anon/authenticated table access
- `create_order(jsonb)` — atomic, security-definer, idempotent on
  `client_request_id`. Generates the real `order_number` server-side
  (`FND-YYYYMMDD-XXXX`, guaranteed unique via constraint + retry loop)
- `get_order_public(text)` — PII-free summary for the confirmation page

## Applying it

With the Supabase CLI (project linked):

```bash
supabase db push
```

Or paste `migrations/0001_init_orders.sql` into **SQL Editor** and run it.

## Environment

Copy `.env.example` → `.env.local` and fill:

| var | used by | notes |
| --- | --- | --- |
| `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) | server | project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | `POST /api/orders`, confirmation page. Never shipped to the browser. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — | reserved for future client use |

## Flow

`checkout → POST /api/orders` (validates + re-prices against `src/lib/data.ts`)
`→ rpc create_order` (atomic insert) `→ order_number` `→ /siparis-basarili?order=…`
(server reads `get_order_public`).
