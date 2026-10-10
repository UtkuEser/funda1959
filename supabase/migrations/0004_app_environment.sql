-- Funda 1959 — which Supabase project is this? (test / production)
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.
--
-- Both projects (funda1959-test, funda1959-production) run the SAME
-- migrations. This one-row table is the only thing that tells them apart.
-- The app (src/lib/persistence.ts) refuses every write when the connected
-- project's marker doesn't match the deployment:
--   local development + Vercel Preview -> must be 'test'
--   Vercel Production                  -> must be 'production'
--
-- The row is deliberately NOT inserted here (the migration is identical in
-- both projects). Insert it once per project, by hand, right after applying
-- this file — see SUPABASE_PLAN.md, "Kurulum listesi":
--   funda1959-test:        insert into public.app_environment (name) values ('test');
--   funda1959-production:  insert into public.app_environment (name) values ('production');
--
-- RLS on, no policies: only the server (service role) reads it.

create table if not exists public.app_environment (
  singleton   boolean     primary key default true check (singleton),
  name        text        not null check (name in ('test', 'production')),
  created_at  timestamptz not null default now()
);

alter table public.app_environment enable row level security;
