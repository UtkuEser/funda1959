-- Funda 1959 — campaign persistence
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.
-- Depends on 0001_init_orders.sql having enabled the `pgcrypto` extension
-- (for gen_random_uuid()).
--
-- No real auth yet — admin writes go through the server-side service role
-- (see src/lib/campaigns/supabase-repository.ts), never the browser
-- directly. RLS below is intentionally fully locked down (no anon/
-- authenticated policies at all, matching customers/orders/order_items in
-- 0001); add real read/write policies once Supabase Auth + roles exist.

-- ---------------------------------------------------------------------------
-- campaigns
-- ---------------------------------------------------------------------------
create table if not exists public.campaigns (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  image         text,
  start_at      timestamptz not null,
  end_at        timestamptz not null,
  cta_label     text,
  cta_href      text,
  active        boolean not null default true,
  branch_ids    text[] not null default ARRAY['all']::text[],
  priority      integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint campaigns_end_after_start check (end_at > start_at),
  constraint campaigns_branch_ids_not_empty check (cardinality(branch_ids) > 0)
);

create index if not exists campaigns_active_window_idx
  on public.campaigns (active, start_at, end_at);
create index if not exists campaigns_priority_idx
  on public.campaigns (priority, created_at);

-- ---------------------------------------------------------------------------
-- updated_at — reuses the trigger function 0001 already created
-- ---------------------------------------------------------------------------
drop trigger if exists campaigns_set_updated_at on public.campaigns;
create trigger campaigns_set_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — locked down. Admin CRUD goes through the service
-- role (bypasses RLS) via the server-only Supabase REST client; anon/
-- authenticated get no direct table access in this round.
-- ---------------------------------------------------------------------------
alter table public.campaigns enable row level security;

-- ---------------------------------------------------------------------------
-- Idempotent demo seed — only runs once, when the table is still empty.
-- Mirrors the previous in-memory mock (src/lib/campaigns/mock.ts) so nothing
-- is lost when a project first connects Supabase. Re-running this migration
-- (or the whole file) never duplicates rows once at least one exists —
-- including rows created later through the admin UI.
-- ---------------------------------------------------------------------------
insert into public.campaigns
  (title, description, image, start_at, end_at, cta_label, cta_href, active, branch_ids, priority)
select * from (
  values
    (
      'Haftanın Seçkisi',
      'Haftanın öne çıkan lezzetlerini keşfedin.',
      '/home/campaigns/kampanya-01.webp',
      '2025-01-01T00:00:00+03:00'::timestamptz,
      '2026-12-31T23:59:59+03:00'::timestamptz,
      'İncele', '/lezzetlerimiz', true, ARRAY['all']::text[], 1
    ),
    (
      'Kahve Yanına Funda',
      'Kahve sohbetlerinize eşlik edecek kuru pastalarımızla tanışın.',
      '/home/campaigns/kampanya-02.webp',
      '2025-01-01T00:00:00+03:00'::timestamptz,
      '2026-12-31T23:59:59+03:00'::timestamptz,
      'İncele', '/lezzetlerimiz/kuru-pastalar', true, ARRAY['all']::text[], 2
    ),
    (
      'Kutlamalara Özel',
      'Doğum günleri ve kutlamalarınız için özel tasarım pastalar.',
      '/home/campaigns/kampanya-03.webp',
      '2025-01-01T00:00:00+03:00'::timestamptz,
      '2026-12-31T23:59:59+03:00'::timestamptz,
      'Sipariş İçin İletişime Geç', '/ozel-gun', true, ARRAY['gop', 'panora']::text[], 3
    ),
    (
      'Çikolata Seçkisi',
      'El yapımı çikolatalarımızla tatlı bir mola verin.',
      '/home/campaigns/kampanya-04.webp',
      '2025-01-01T00:00:00+03:00'::timestamptz,
      '2026-12-31T23:59:59+03:00'::timestamptz,
      'İncele', '/lezzetlerimiz/cikolatalar', true, ARRAY['all']::text[], 4
    )
) as seed (title, description, image, start_at, end_at, cta_label, cta_href, active, branch_ids, priority)
where not exists (select 1 from public.campaigns);
