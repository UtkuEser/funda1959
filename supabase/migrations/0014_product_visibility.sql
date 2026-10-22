-- Funda 1959 — "Yayında" for the 18 products in code (D48)
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor,
-- TEST project first. Depends on 0001 (order_items, set_updated_at). Independent
-- of 0013 (products added in the panel keep their own status there). Safe to
-- re-run: create ... if not exists / drop + add constraint / drop + create
-- trigger / create or replace function.
--
-- SUPABASE_PLAN.md D48:
--   * Merkez can take a code product (p1–p18) off the site and put it back.
--     One row per product that has been switched at least once; no row =
--     on the site, as before;
--   * this is the product's GENERAL publish state for every branch — branch
--     stock (branch_product_status, active / passive) is not touched;
--   * a product off the site is not ordered: the trigger below refuses an
--     order item for it, whatever the app sends. Orders placed before keep
--     their own copy of name, size and price (order_items) and do not change;
--   * written only from the server for Merkez (RPC below); RLS on, no
--     policies, nothing granted to anon / authenticated.

create table if not exists public.product_visibility (
  product_id   text        primary key,
  is_published boolean     not null,
  updated_by   text        not null,
  updated_at   timestamptz not null default now()
);

alter table public.product_visibility drop constraint if exists product_visibility_product_check;
alter table public.product_visibility add constraint product_visibility_product_check
  check (product_id ~ '^p[0-9]{1,3}$');
alter table public.product_visibility drop constraint if exists product_visibility_by_check;
alter table public.product_visibility add constraint product_visibility_by_check check (length(btrim(updated_by)) > 0);

drop trigger if exists product_visibility_set_updated_at on public.product_visibility;
create trigger product_visibility_set_updated_at
  before update on public.product_visibility
  for each row execute function public.set_updated_at();

alter table public.product_visibility enable row level security;
revoke all on table public.product_visibility from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- set_product_visibility — Merkez only. The app checks the id is one of the
-- code products; the database keeps the shape.
-- p_payload: { actor_account, actor, product_id, published }
-- ---------------------------------------------------------------------------
create or replace function public.set_product_visibility(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor text := nullif(btrim(coalesce(p_payload->>'actor', '')), '');
  v_id    text := coalesce(p_payload->>'product_id', '');
  v_pub   boolean;
  v_row   product_visibility%rowtype;
begin
  if p_payload->>'actor_account' is distinct from 'merkez' or v_actor is null then
    raise exception 'forbidden';
  end if;
  if v_id !~ '^p[0-9]{1,3}$' then raise exception 'invalid_product'; end if;
  if jsonb_typeof(p_payload->'published') is distinct from 'boolean' then raise exception 'invalid_status'; end if;
  v_pub := (p_payload->>'published')::boolean;

  insert into product_visibility (product_id, is_published, updated_by)
  values (v_id, v_pub, v_actor)
  on conflict (product_id) do update
    set is_published = excluded.is_published, updated_by = excluded.updated_by
    where product_visibility.is_published is distinct from excluded.is_published
  returning * into v_row;
  if not found then
    select * into v_row from product_visibility where product_id = v_id; -- already so: nothing changed
  end if;
  return jsonb_build_object('product_id', v_row.product_id, 'is_published', v_row.is_published,
                            'updated_by', v_row.updated_by, 'updated_at', v_row.updated_at);
end;
$$;

-- ---------------------------------------------------------------------------
-- order_items guard — a code product taken off the site is not ordered.
-- ---------------------------------------------------------------------------
create or replace function public.product_visibility_order_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from product_visibility v where v.product_id = new.product_id and not v.is_published) then
    raise exception 'product_unavailable';
  end if;
  return new;
end;
$$;

drop trigger if exists order_items_visibility_guard on public.order_items;
create trigger order_items_visibility_guard
  before insert on public.order_items
  for each row execute function public.product_visibility_order_guard();

revoke all on function public.set_product_visibility(jsonb) from public, anon, authenticated;
grant execute on function public.set_product_visibility(jsonb) to service_role;
revoke all on function public.product_visibility_order_guard() from public, anon, authenticated;
