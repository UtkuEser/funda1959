-- Funda 1959 — delivery areas: branch, open / closed and fee per district + neighbourhood (D49, D50)
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor,
-- TEST project first. Depends on 0001 (branches, orders, addresses,
-- set_updated_at), 0007 (orders.delivery_zone_id) and 0008 (delivery_zone_fees).
-- create_order is NOT changed. Safe to re-run: the table is created and filled
-- only once (a re-run never brings back or overwrites anything Merkez changed);
-- constraints, triggers and functions are replaced.
--
-- SUPABASE_PLAN.md D49 / D50:
--   * one row per district + neighbourhood (an "area"). The primary key and the
--     folded key (`area_key`, e.g. 'cankaya|asagi ayranci', made by the app)
--     keep one row per place: the same name in two districts is two areas;
--   * every area belongs to ONE branch; moving it to another branch is an
--     update of that row (the panel asks first);
--   * delivery to an area is open or closed. Closing never deletes it: no new
--     delivery order is taken there (pickup works);
--   * every area has its OWN fee: a row in delivery_zone_fees whose zone_id is
--     the area's `zone_id` ('area-…'). create_order already checks an order's
--     fee against that row (0008 / 0011) — unset -> refused, different ->
--     refused — so the fee rule stays in the database without a new
--     create_order. The trigger below adds: the area exists, is open, belongs
--     to the order's branch and is the order's address;
--   * orders keep the branch, zone and fee they were placed with — nothing
--     here touches them;
--   * written only from the server for Merkez (RPC below), all or nothing;
--     RLS on, no policies, nothing granted to anon / authenticated.
--
-- First fill = the zone list the site used until now (TEST DATA, D15 / A4),
-- all open, each area starting with ITS ZONE's fee (state and amount copied
-- from delivery_zone_fees; a zone without a fee row -> the area has none
-- either = "Belirlenmedi"). No fee is invented. For customers nothing changes.

do $$
declare
  v_new boolean := to_regclass('public.delivery_areas') is null;
begin
  create table if not exists public.delivery_areas (
    district         text        not null,
    neighborhood     text        not null,
    area_key         text        not null,
    zone_id          text        generated always as ('area-' || substr(md5(area_key), 1, 20)) stored,
    branch_slug      text        not null references public.branches (slug) on update cascade,
    delivery_enabled boolean     not null default true,
    updated_by       text        not null,
    updated_at       timestamptz not null default now(),
    primary key (district, neighborhood),
    constraint delivery_areas_key_unique unique (area_key),
    constraint delivery_areas_zone_unique unique (zone_id)
  );

  if v_new then
    create temporary table seed_areas (district text, neighborhood text, area_key text, branch_slug text, old_zone text) on commit drop;
    insert into seed_areas values
      ('Çankaya', 'Gaziosmanpaşa', 'cankaya|gaziosmanpasa', 'gop', 'zone-gop-cankaya'),
      ('Çankaya', 'Kavaklıdere', 'cankaya|kavaklidere', 'gop', 'zone-gop-cankaya'),
      ('Çankaya', 'Aşağı Ayrancı', 'cankaya|asagi ayranci', 'gop', 'zone-gop-cankaya'),
      ('Çankaya', 'Yukarı Ayrancı', 'cankaya|yukari ayranci', 'gop', 'zone-gop-cankaya'),
      ('Çankaya', 'Çankaya', 'cankaya|cankaya', 'gop', 'zone-gop-cankaya'),
      ('Çankaya', 'Kızılay', 'cankaya|kizilay', 'gop', 'zone-gop-cankaya'),
      ('Çankaya', 'Bahçelievler', 'cankaya|bahcelievler', 'gop', 'zone-gop-cankaya'),
      ('Çankaya', 'Oran', 'cankaya|oran', 'panora', 'zone-panora-kizilay'),
      ('Çankaya', 'Balgat', 'cankaya|balgat', 'panora', 'zone-panora-kizilay'),
      ('Çankaya', 'Öveçler', 'cankaya|ovecler', 'panora', 'zone-panora-kizilay'),
      ('Çankaya', 'Dikmen', 'cankaya|dikmen', 'panora', 'zone-panora-kizilay'),
      ('Çankaya', 'Yıldız', 'cankaya|yildiz', 'panora', 'zone-panora-kizilay'),
      ('Çankaya', 'Söğütözü', 'cankaya|sogutozu', 'panora', 'zone-panora-kizilay'),
      ('Gölbaşı', 'İncek', 'golbasi|incek', 'incek', 'zone-incek-golbasi'),
      ('Gölbaşı', 'Taşpınar', 'golbasi|taspinar', 'incek', 'zone-incek-golbasi'),
      ('Gölbaşı', 'Karşıyaka', 'golbasi|karsiyaka', 'incek', 'zone-incek-golbasi'),
      ('Gölbaşı', 'Gölbaşı', 'golbasi|golbasi', 'incek', 'zone-incek-golbasi'),
      ('Gölbaşı', 'Bahçelievler', 'golbasi|bahcelievler', 'incek', 'zone-incek-golbasi'),
      ('Çankaya', 'Çayyolu', 'cankaya|cayyolu', 'incek', 'zone-incek-cankaya-south'),
      ('Çankaya', 'Ümitköy', 'cankaya|umitkoy', 'incek', 'zone-incek-cankaya-south'),
      ('Çankaya', 'Koru', 'cankaya|koru', 'incek', 'zone-incek-cankaya-south'),
      ('Çankaya', 'Alacaatlı', 'cankaya|alacaatli', 'incek', 'zone-incek-cankaya-south');

    insert into public.delivery_areas (district, neighborhood, area_key, branch_slug, delivery_enabled, updated_by)
    select s.district, s.neighborhood, s.area_key, s.branch_slug, true, 'ilk kurulum (0015)'
    from seed_areas s
    where exists (select 1 from public.branches b where b.slug = s.branch_slug)
    on conflict do nothing;

    -- each area starts with its old zone's fee (never a made-up one)
    insert into public.delivery_zone_fees (zone_id, state, fee, updated_by)
    select a.zone_id, f.state, f.fee, 'ilk kurulum (0015) — ' || f.zone_id
    from public.delivery_areas a
    join seed_areas s on s.area_key = a.area_key
    join public.delivery_zone_fees f on f.zone_id = s.old_zone
    on conflict (zone_id) do nothing;
  end if;
end;
$$;

alter table public.delivery_areas drop constraint if exists delivery_areas_names_check;
alter table public.delivery_areas add constraint delivery_areas_names_check
  check (length(district) between 2 and 60 and length(neighborhood) between 2 and 60
         and district = btrim(district) and neighborhood = btrim(neighborhood) and length(btrim(area_key)) > 0);
alter table public.delivery_areas drop constraint if exists delivery_areas_by_check;
alter table public.delivery_areas add constraint delivery_areas_by_check check (length(btrim(updated_by)) > 0);

drop trigger if exists delivery_areas_set_updated_at on public.delivery_areas;
create trigger delivery_areas_set_updated_at
  before update on public.delivery_areas
  for each row execute function public.set_updated_at();

alter table public.delivery_areas enable row level security;
revoke all on table public.delivery_areas from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- save_delivery_areas — one save of the Merkez panel, all or nothing.
-- p_payload: { actor_account, actor,
--   items: [{ area_key, district, neighborhood, branch_slug, delivery_enabled,
--             fee_state ('unset' | 'paid' | 'free'), fee,
--             expected: null                       -- a new area
--                     | { branch_slug, delivery_enabled, fee_state, fee } }] }
-- Every area must still be as the panel saw it (`expected`), else 'conflict'
-- and nothing is saved. An open area needs a fee (paid > 0 or free = 0).
-- Nothing is deleted. Returns every area with its fee after the save.
-- ---------------------------------------------------------------------------
create or replace function public.save_delivery_areas(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor     text  := nullif(btrim(coalesce(p_payload->>'actor', '')), '');
  v_items     jsonb := coalesce(p_payload->'items', '[]'::jsonb);
  v_item      jsonb;
  v_exp       jsonb;
  v_key       text;
  v_d         text;
  v_n         text;
  v_branch    text;
  v_enabled   boolean;
  v_state     text;
  v_fee       numeric;
  v_area      delivery_areas%rowtype;
  v_cur_state text;
  v_cur_fee   numeric;
begin
  if p_payload->>'actor_account' is distinct from 'merkez' or v_actor is null then
    raise exception 'forbidden';
  end if;
  if jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) = 0 or jsonb_array_length(v_items) > 2000 then
    raise exception 'invalid_payload';
  end if;

  -- one save at a time: each one checks what the previous one left
  perform pg_advisory_xact_lock(hashtextextended('delivery_areas', 0));

  for v_item in select * from jsonb_array_elements(v_items) loop
    v_key     := btrim(coalesce(v_item->>'area_key', ''));
    v_d       := btrim(coalesce(v_item->>'district', ''));
    v_n       := btrim(coalesce(v_item->>'neighborhood', ''));
    v_branch  := btrim(coalesce(v_item->>'branch_slug', ''));
    v_state   := v_item->>'fee_state';
    v_exp     := v_item->'expected';
    if v_key = '' or v_d = '' or v_n = '' then raise exception 'invalid_area'; end if;
    if not exists (select 1 from branches where slug = v_branch) then raise exception 'invalid_branch'; end if;
    if jsonb_typeof(v_item->'delivery_enabled') is distinct from 'boolean' then raise exception 'invalid_area'; end if;
    v_enabled := (v_item->>'delivery_enabled')::boolean;

    if v_state = 'paid' then
      v_fee := round((v_item->>'fee')::numeric, 2);
      if v_fee is null or v_fee <= 0 or v_fee > 10000 then raise exception 'invalid_fee'; end if;
    elsif v_state = 'free' then
      v_fee := 0;
    elsif v_state = 'unset' then
      v_fee := null;
      if v_enabled then raise exception 'invalid_fee'; end if; -- an open area needs a fee
    else
      raise exception 'invalid_fee';
    end if;

    select * into v_area from delivery_areas where area_key = v_key;
    if v_exp is null or jsonb_typeof(v_exp) = 'null' then
      if found then raise exception 'conflict'; end if;             -- someone added it meanwhile
      insert into delivery_areas (district, neighborhood, area_key, branch_slug, delivery_enabled, updated_by)
      values (v_d, v_n, v_key, v_branch, v_enabled, v_actor)
      returning * into v_area;
    else
      if not found then raise exception 'conflict'; end if;
      if v_area.district <> v_d or v_area.neighborhood <> v_n then raise exception 'invalid_area'; end if;
      select state, fee into v_cur_state, v_cur_fee from delivery_zone_fees where zone_id = v_area.zone_id;
      if not found then
        v_cur_state := 'unset';
        v_cur_fee := null;
      end if;
      if v_area.branch_slug is distinct from v_exp->>'branch_slug'
         or v_area.delivery_enabled is distinct from (v_exp->>'delivery_enabled')::boolean
         or v_cur_state is distinct from v_exp->>'fee_state'
         or v_cur_fee is distinct from (v_exp->>'fee')::numeric then
        raise exception 'conflict';
      end if;
      update delivery_areas set branch_slug = v_branch, delivery_enabled = v_enabled, updated_by = v_actor
      where area_key = v_key and (branch_slug, delivery_enabled) is distinct from (v_branch, v_enabled);
    end if;

    -- the area's own fee row (create_order checks an order's fee against it)
    insert into delivery_zone_fees (zone_id, state, fee, updated_by)
    values (v_area.zone_id, v_state, v_fee, v_actor)
    on conflict (zone_id) do update
      set state = excluded.state, fee = excluded.fee, updated_by = excluded.updated_by
      where (delivery_zone_fees.state, delivery_zone_fees.fee) is distinct from (excluded.state, excluded.fee);
  end loop;

  return coalesce(
    (select jsonb_agg(jsonb_build_object(
              'district', a.district, 'neighborhood', a.neighborhood, 'area_key', a.area_key, 'zone_id', a.zone_id,
              'branch_slug', a.branch_slug, 'delivery_enabled', a.delivery_enabled,
              'updated_by', a.updated_by, 'updated_at', a.updated_at,
              'fee_state', coalesce(f.state, 'unset'), 'fee', f.fee,
              'fee_updated_by', f.updated_by, 'fee_updated_at', f.updated_at)
            order by a.district, a.neighborhood)
       from delivery_areas a
       left join delivery_zone_fees f on f.zone_id = a.zone_id),
    '[]'::jsonb);
end;
$$;

-- ---------------------------------------------------------------------------
-- orders guard — a delivery order placed under an area ('area-…' zone) must
-- name an open area of its own branch and be that area's address. (The fee is
-- checked by create_order against the area's fee row.) Orders under an old
-- zone id and pickup orders are not touched.
-- ---------------------------------------------------------------------------
create or replace function public.delivery_area_order_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_area delivery_areas%rowtype;
  v_slug text;
  v_district text;
  v_neighborhood text;
begin
  if new.delivery_type is distinct from 'delivery' or new.delivery_zone_id is null or new.delivery_zone_id not like 'area-%' then
    return new;
  end if;
  select * into v_area from delivery_areas where zone_id = new.delivery_zone_id;
  if not found or not v_area.delivery_enabled then raise exception 'delivery_area_closed'; end if;
  select slug into v_slug from branches where id = new.branch_id;
  select district, neighborhood into v_district, v_neighborhood from addresses where id = new.address_id;
  if v_slug is distinct from v_area.branch_slug
     or v_district is distinct from v_area.district
     or v_neighborhood is distinct from v_area.neighborhood then
    raise exception 'delivery_area_changed';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_delivery_area_guard on public.orders;
create trigger orders_delivery_area_guard
  before insert on public.orders
  for each row execute function public.delivery_area_order_guard();

revoke all on function public.save_delivery_areas(jsonb) from public, anon, authenticated;
grant execute on function public.save_delivery_areas(jsonb) to service_role;
revoke all on function public.delivery_area_order_guard() from public, anon, authenticated;

-- the API sees the new table and functions right away
notify pgrst, 'reload schema';
