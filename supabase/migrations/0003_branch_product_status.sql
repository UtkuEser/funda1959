-- Funda 1959 — branch stock status (admin "Şube Stokları")
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.
-- Depends on 0001_init_orders.sql (public.branches, public.set_updated_at()).
--
-- One row per branch + product: is the product deliverable from today at this
-- branch (true) or only from tomorrow (false, "passive")? No quantities. This
-- is NOT the product's publish state — a passive product stays listed and
-- orderable. Rows are written only by the server (service role) through
-- /api/admin/inventory; RLS is on with no policies, like the other tables.
-- A product with no row keeps its catalog default.

create table if not exists public.branch_product_status (
  branch_slug  text        not null references public.branches (slug) on update cascade on delete cascade,
  product_id   text        not null,
  is_active    boolean     not null,
  updated_by   text,
  updated_at   timestamptz not null default now(),
  primary key (branch_slug, product_id),
  constraint branch_product_status_product_id_not_blank check (length(btrim(product_id)) > 0)
);

drop trigger if exists branch_product_status_set_updated_at on public.branch_product_status;
create trigger branch_product_status_set_updated_at
  before update on public.branch_product_status
  for each row execute function public.set_updated_at();

alter table public.branch_product_status enable row level security;
