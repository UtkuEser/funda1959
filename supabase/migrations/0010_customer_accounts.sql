-- Funda 1959 — Aşama 5: customer membership (profiles, saved addresses, member orders)
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.
-- Depends on 0001 (set_updated_at), 0009 (create_order v5) and Supabase Auth
-- (auth.users). Safe to re-run: create table if not exists / add column if not
-- exists / drop + create trigger / create or replace function.
--
-- SUPABASE_PLAN.md D22–D26, §8.2:
--   * customer_profiles — one row per member (auth user): name, phone and a
--     copy of the sign-in email. Terms consent columns stay NULL until the
--     KVKK / membership texts are published (D26): no row records a consent
--     nobody gave. There is no marketing-consent column (D26).
--   * customer_addresses — at most 10 per member, exactly one default while
--     any exist (D24). Written only through save_customer_address /
--     delete_customer_address, which lock per member.
--   * orders.customer_user_id — the member an order belongs to; NULL = guest.
--     Existing orders stay NULL: guest orders are never linked (D25).
--   * create_order (v6) — v5 + customer_user_id. The server sets it from the
--     verified session only; the database checks the member has a profile.
--   * list_customer_orders / get_customer_order — a member's own orders, with
--     the cancel reason but never the admin account that changed them.
-- RLS on, NO policies (like every other table): only the server, with the
-- service role, reads or writes, always filtered by the session's user id.
-- Every function is callable by the service role only. Funda Puan columns
-- are not here (Aşama 6).

-- ---------------------------------------------------------------------------
-- customer_profiles
-- ---------------------------------------------------------------------------
create table if not exists public.customer_profiles (
  auth_user_id      uuid        primary key references auth.users (id) on delete cascade,
  full_name         text        not null,
  phone             text        not null,
  email             text        not null,
  terms_version     text,
  terms_accepted_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint customer_profiles_full_name_not_blank check (length(btrim(full_name)) between 2 and 120),
  constraint customer_profiles_phone_not_blank check (length(btrim(phone)) between 10 and 20),
  constraint customer_profiles_email_not_blank check (length(btrim(email)) between 3 and 320),
  -- a consent is recorded with the text version it was given for, or not at all
  constraint customer_profiles_terms_pair check ((terms_version is null) = (terms_accepted_at is null))
);

drop trigger if exists customer_profiles_set_updated_at on public.customer_profiles;
create trigger customer_profiles_set_updated_at
  before update on public.customer_profiles
  for each row execute function public.set_updated_at();

alter table public.customer_profiles enable row level security;

-- ---------------------------------------------------------------------------
-- customer_addresses
-- ---------------------------------------------------------------------------
create table if not exists public.customer_addresses (
  id            uuid        primary key default gen_random_uuid(),
  auth_user_id  uuid        not null references auth.users (id) on delete cascade,
  label         text        not null,
  district      text        not null,
  neighborhood  text        not null,
  address_line  text        not null,
  building      text,
  floor         text,
  apartment     text,
  note          text,
  is_default    boolean     not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint customer_addresses_label_len check (length(btrim(label)) between 1 and 40),
  constraint customer_addresses_district_len check (length(btrim(district)) between 2 and 60),
  constraint customer_addresses_neighborhood_len check (length(btrim(neighborhood)) between 2 and 60),
  constraint customer_addresses_line_len check (length(btrim(address_line)) between 10 and 300)
);

create index if not exists customer_addresses_user_idx on public.customer_addresses (auth_user_id, created_at);
-- one default per member
create unique index if not exists customer_addresses_one_default
  on public.customer_addresses (auth_user_id) where is_default;

drop trigger if exists customer_addresses_set_updated_at on public.customer_addresses;
create trigger customer_addresses_set_updated_at
  before update on public.customer_addresses
  for each row execute function public.set_updated_at();

alter table public.customer_addresses enable row level security;

-- ---------------------------------------------------------------------------
-- orders.customer_user_id
-- ---------------------------------------------------------------------------
alter table public.orders add column if not exists customer_user_id uuid
  references auth.users (id) on delete set null;
create index if not exists orders_customer_user_idx
  on public.orders (customer_user_id, created_at desc) where customer_user_id is not null;

-- ---------------------------------------------------------------------------
-- save_customer_address — create (p_address_id null) or update one of the
-- member's addresses. At most 10; the first one, or one marked default,
-- becomes the only default; the default can't be switched off directly
-- (another address is made default instead).
-- ---------------------------------------------------------------------------
create or replace function public.save_customer_address(
  p_user_id    uuid,
  p_address_id uuid,
  p_address    jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_label        text := btrim(coalesce(p_address->>'label', ''));
  v_district     text := btrim(coalesce(p_address->>'district', ''));
  v_neighborhood text := btrim(coalesce(p_address->>'neighborhood', ''));
  v_line         text := btrim(coalesce(p_address->>'address_line', ''));
  v_default      boolean := coalesce((p_address->>'is_default')::boolean, false);
  v_count        int;
  v_row          customer_addresses%rowtype;
begin
  if p_user_id is null then
    raise exception 'missing_user';
  end if;
  if length(v_label) not between 1 and 40
     or length(v_district) not between 2 and 60
     or length(v_neighborhood) not between 2 and 60
     or length(v_line) not between 10 and 300 then
    raise exception 'invalid_address';
  end if;

  -- one writer per member at a time: the limit and the single default hold
  perform pg_advisory_xact_lock(hashtextextended('customer_addresses:' || p_user_id::text, 0));

  select count(*) into v_count from customer_addresses where auth_user_id = p_user_id;

  if p_address_id is null then
    if v_count >= 10 then
      raise exception 'address_limit';
    end if;
    -- the first address is the default
    if v_count = 0 then
      v_default := true;
    end if;
    if v_default then
      update customer_addresses set is_default = false where auth_user_id = p_user_id and is_default;
    end if;
    insert into customer_addresses (auth_user_id, label, district, neighborhood, address_line,
                                    building, floor, apartment, note, is_default)
    values (p_user_id, v_label, v_district, v_neighborhood, v_line,
            nullif(btrim(coalesce(p_address->>'building', '')), ''),
            nullif(btrim(coalesce(p_address->>'floor', '')), ''),
            nullif(btrim(coalesce(p_address->>'apartment', '')), ''),
            nullif(btrim(coalesce(p_address->>'note', '')), ''),
            v_default)
    returning * into v_row;
  else
    select * into v_row from customer_addresses
     where id = p_address_id and auth_user_id = p_user_id
     for update;
    if not found then
      raise exception 'address_not_found';
    end if;
    -- the default stays default until another address takes it over
    if v_row.is_default then
      v_default := true;
    end if;
    if v_default and not v_row.is_default then
      update customer_addresses set is_default = false where auth_user_id = p_user_id and is_default;
    end if;
    update customer_addresses
       set label        = v_label,
           district     = v_district,
           neighborhood = v_neighborhood,
           address_line = v_line,
           building     = nullif(btrim(coalesce(p_address->>'building', '')), ''),
           floor        = nullif(btrim(coalesce(p_address->>'floor', '')), ''),
           apartment    = nullif(btrim(coalesce(p_address->>'apartment', '')), ''),
           note         = nullif(btrim(coalesce(p_address->>'note', '')), ''),
           is_default   = v_default
     where id = v_row.id
    returning * into v_row;
  end if;

  return jsonb_build_object(
    'id', v_row.id, 'label', v_row.label, 'district', v_row.district,
    'neighborhood', v_row.neighborhood, 'address_line', v_row.address_line,
    'building', v_row.building, 'floor', v_row.floor, 'apartment', v_row.apartment,
    'note', v_row.note, 'is_default', v_row.is_default);
end;
$$;

-- ---------------------------------------------------------------------------
-- delete_customer_address — removes one of the member's addresses; if it was
-- the default, the oldest remaining address becomes the default.
-- ---------------------------------------------------------------------------
create or replace function public.delete_customer_address(
  p_user_id    uuid,
  p_address_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_was_default boolean;
begin
  perform pg_advisory_xact_lock(hashtextextended('customer_addresses:' || p_user_id::text, 0));

  delete from customer_addresses
   where id = p_address_id and auth_user_id = p_user_id
  returning is_default into v_was_default;
  if not found then
    return false;
  end if;

  if v_was_default then
    update customer_addresses set is_default = true
     where id = (select id from customer_addresses
                  where auth_user_id = p_user_id
                  order by created_at, id
                  limit 1);
  end if;
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Member orders. One row shape for the list and the detail: items, address,
-- amounts, status, the cancel reason (the member may see it) — never the
-- admin account or name that changed the status.
-- ---------------------------------------------------------------------------
create or replace function public.customer_order_json(p_order public.orders)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'order_number',       p_order.order_number,
    'status',             p_order.status,
    'is_demo',            p_order.is_demo,
    'delivery_type',      p_order.delivery_type,
    'branch_slug',        (select b.slug from branches b where b.id = p_order.branch_id),
    'delivery_date',      to_char(p_order.delivery_date, 'YYYY-MM-DD'),
    'delivery_time_slot', p_order.delivery_time_slot,
    'subtotal',           p_order.subtotal,
    'delivery_fee',       p_order.delivery_fee,
    'discount',           p_order.discount,
    'total',              p_order.total,
    'order_note',         p_order.order_note,
    'cancel_reason',      case when p_order.status = 'cancelled' then p_order.cancel_reason end,
    'cancelled_at',       case when p_order.status = 'cancelled' then p_order.cancelled_at end,
    'created_at',         p_order.created_at,
    'address', (
      select jsonb_build_object(
        'district', a.district, 'neighborhood', a.neighborhood, 'address_line', a.address_line,
        'building', a.building, 'floor', a.floor, 'apartment', a.apartment, 'note', a.note)
      from addresses a where a.id = p_order.address_id),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'product_name', i.product_name, 'variant_label', i.variant_label, 'quantity', i.quantity,
        'unit_price', i.unit_price, 'total_price', i.total_price, 'cake_message', i.cake_message,
        'extras', i.extras, 'note', i.note) order by i.created_at, i.id)
      from order_items i where i.order_id = p_order.id), '[]'::jsonb)
  );
$$;

create or replace function public.list_customer_orders(
  p_user_id uuid,
  p_limit   int default 50,
  p_offset  int default 0
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'total', (select count(*) from orders where customer_user_id = p_user_id),
    'rows', coalesce((
      select jsonb_agg(customer_order_json(o) order by o.created_at desc, o.order_number desc)
      from orders o
      where o.id in (
        select id from orders
         where customer_user_id = p_user_id
         order by created_at desc, order_number desc
         limit least(greatest(coalesce(p_limit, 50), 0), 100)
         offset greatest(coalesce(p_offset, 0), 0)
      )
    ), '[]'::jsonb)
  )
  where p_user_id is not null;
$$;

create or replace function public.get_customer_order(
  p_user_id      uuid,
  p_order_number text
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select customer_order_json(o)
    from orders o
   where o.customer_user_id = p_user_id
     and p_user_id is not null
     and o.order_number = p_order_number;
$$;

-- ---------------------------------------------------------------------------
-- create_order (v6) — v5 (0009) + customer_user_id
-- ---------------------------------------------------------------------------
create or replace function public.create_order(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_request_id text := nullif(p_payload->>'client_request_id', '');
  v_existing_number   text;
  v_customer_id       uuid;
  v_customer_user_id  uuid := nullif(p_payload->>'customer_user_id', '')::uuid;
  v_address_id        uuid;
  v_branch_id         uuid;
  v_branch_slug       text := nullif(p_payload#>>'{delivery,branch_slug}', '');
  v_zone_id           text := nullif(p_payload#>>'{delivery,zone_id}', '');
  v_delivery_type     text := p_payload#>>'{delivery,type}';
  v_delivery_date     date := (p_payload#>>'{delivery,date}')::date;
  v_sales_channel     text := coalesce(nullif(p_payload->>'sales_channel', ''), 'web');
  v_subtotal          numeric := round((p_payload->>'subtotal')::numeric, 2);
  v_delivery_fee      numeric := round(coalesce((p_payload->>'delivery_fee')::numeric, 0), 2);
  v_discount          numeric := round(coalesce((p_payload->>'discount')::numeric, 0), 2);
  v_total             numeric := round((p_payload->>'total')::numeric, 2);
  v_items_count       int;
  v_items_sum         numeric;
  v_items_ok          boolean;
  v_fee_state         text;
  v_zone_fee          numeric;
  v_order_id          uuid;
  v_order_number      text;
  v_item              jsonb;
  v_attempts          int := 0;
begin
  -- Only demo orders exist until a payment provider is connected (D8).
  if coalesce(p_payload->>'is_demo', 'true') <> 'true' then
    raise exception 'non_demo_order_not_supported';
  end if;

  -- One request id at a time: a concurrent retry waits here, then finds the
  -- order the first call committed and returns it (same order number).
  if v_client_request_id is not null then
    perform pg_advisory_xact_lock(hashtextextended('create_order:' || v_client_request_id, 0));
    select order_number into v_existing_number
    from orders where client_request_id = v_client_request_id;
    if v_existing_number is not null then
      return get_order_public(v_existing_number);
    end if;
  end if;

  -- D24: a member order belongs to an existing member profile (the server
  -- took the id from the verified session, never from the browser)
  if v_customer_user_id is not null
     and not exists (select 1 from customer_profiles where auth_user_id = v_customer_user_id) then
    raise exception 'invalid_customer_account';
  end if;

  -- The server computed every amount; the database re-checks they add up.
  select count(*),
         round(coalesce(sum((i->>'total_price')::numeric), 0), 2),
         coalesce(bool_and((i->>'quantity')::int >= 1
                   and round((i->>'total_price')::numeric, 2) = round((i->>'unit_price')::numeric * (i->>'quantity')::int, 2)), false)
    into v_items_count, v_items_sum, v_items_ok
  from jsonb_array_elements(coalesce(p_payload->'items', '[]'::jsonb)) as i;
  if v_items_count = 0 then
    raise exception 'empty_order';
  end if;
  if not v_items_ok or v_subtotal is null or v_total is null
     or v_subtotal < 0 or v_delivery_fee < 0 or v_discount < 0
     or v_items_sum <> v_subtotal
     or v_total <> v_subtotal - v_discount + v_delivery_fee then
    raise exception 'amount_mismatch';
  end if;

  -- D5 / D20: an item whose price (the product's single price, or the size
  -- it was ordered in) is stored by Merkez must carry exactly that price.
  if exists (
    select 1
    from jsonb_array_elements(p_payload->'items') as i
    join product_prices pp
      on pp.product_id = i->>'product_id'
     and pp.variant_key = coalesce(nullif(i->>'variant_id', ''), '')
    where round((i->>'unit_price')::numeric, 2) <> pp.price
  ) then
    raise exception 'price_mismatch';
  end if;

  if v_delivery_date is null
     or v_delivery_date < (now() at time zone 'Europe/Istanbul')::date then
    raise exception 'invalid_delivery_date';
  end if;

  -- Both pickup and delivery orders belong to a branch: pickup = the chosen
  -- store, delivery = the branch serving the address (resolved by the server).
  select id into v_branch_id
  from branches where slug = v_branch_slug and is_active = true;
  if v_branch_id is null then
    raise exception 'invalid_branch';
  end if;

  -- D15 fee + D14 minimum (unchanged from v4/v5). Keep 500 in step with
  -- MIN_DELIVERY_ORDER_TL in src/lib/order-rules.ts.
  if v_delivery_type = 'delivery' then
    if v_zone_id is null then
      raise exception 'missing_delivery_zone';
    end if;
    select state, fee into v_fee_state, v_zone_fee
    from delivery_zone_fees where zone_id = v_zone_id;
    if v_fee_state is null or v_fee_state = 'unset' or v_zone_fee is null then
      raise exception 'delivery_fee_not_set';
    end if;
    if v_delivery_fee <> v_zone_fee then
      raise exception 'delivery_fee_mismatch';
    end if;
    if v_subtotal - v_discount < 500 then
      raise exception 'below_minimum';
    end if;
  elsif v_delivery_type = 'pickup' then
    if v_delivery_fee <> 0 then
      raise exception 'amount_mismatch';
    end if;
  else
    raise exception 'invalid_delivery_type';
  end if;

  insert into customers (full_name, phone, email)
  values (
    p_payload#>>'{customer,full_name}',
    p_payload#>>'{customer,phone}',
    p_payload#>>'{customer,email}'
  )
  returning id into v_customer_id;

  if v_delivery_type = 'pickup' then
    v_zone_id := null;

  elsif v_delivery_type = 'delivery' then
    if jsonb_typeof(p_payload#>'{delivery,address}') <> 'object' then
      raise exception 'missing_address';
    end if;
    insert into addresses (customer_id, district, neighborhood, address_line, building, floor, apartment, note)
    values (
      v_customer_id,
      p_payload#>>'{delivery,address,district}',
      p_payload#>>'{delivery,address,neighborhood}',
      p_payload#>>'{delivery,address,address_line}',
      nullif(p_payload#>>'{delivery,address,building}', ''),
      nullif(p_payload#>>'{delivery,address,floor}', ''),
      nullif(p_payload#>>'{delivery,address,apartment}', ''),
      nullif(p_payload#>>'{delivery,address,note}', '')
    )
    returning id into v_address_id;

  else
    raise exception 'invalid_delivery_type';
  end if;

  loop
    v_attempts := v_attempts + 1;
    v_order_number := 'FND-'
      || to_char(now() at time zone 'Europe/Istanbul', 'YYYYMMDD')
      || '-'
      || upper(substr(md5(gen_random_uuid()::text), 1, 4));
    begin
      insert into orders (
        order_number, client_request_id, customer_id, customer_user_id, delivery_type,
        branch_id, address_id, delivery_zone_id, sales_channel,
        delivery_date, delivery_time_slot,
        subtotal, delivery_fee, discount, total, order_note,
        payment_status, is_demo
      ) values (
        v_order_number, v_client_request_id, v_customer_id, v_customer_user_id, v_delivery_type,
        v_branch_id, v_address_id, v_zone_id, v_sales_channel,
        v_delivery_date,
        p_payload#>>'{delivery,time_slot}',
        v_subtotal, v_delivery_fee, v_discount, v_total,
        nullif(p_payload->>'order_note', ''),
        'pending',
        true
      )
      returning id into v_order_id;
      exit;
    exception when unique_violation then
      if v_attempts >= 10 then
        raise exception 'order_number_generation_failed';
      end if;
    end;
  end loop;

  for v_item in select value from jsonb_array_elements(p_payload->'items')
  loop
    insert into order_items (
      order_id, product_id, product_slug, product_name, variant_id, variant_label,
      quantity, unit_price, total_price, cake_message, customization, extras, note
    ) values (
      v_order_id,
      v_item->>'product_id',
      v_item->>'product_slug',
      v_item->>'product_name',
      nullif(v_item->>'variant_id', ''),
      nullif(v_item->>'variant_label', ''),
      (v_item->>'quantity')::int,
      round((v_item->>'unit_price')::numeric, 2),
      round((v_item->>'total_price')::numeric, 2),
      nullif(v_item->>'cake_message', ''),
      case when jsonb_typeof(v_item->'customization') = 'object' then v_item->'customization' end,
      case when jsonb_typeof(v_item->'extras') = 'array' then v_item->'extras' end,
      nullif(v_item->>'note', '')
    );
  end loop;

  return get_order_public(v_order_number);
end;
$$;

-- ---------------------------------------------------------------------------
-- grants — service role only (Supabase grants new functions to anon /
-- authenticated by default, so revoke explicitly)
-- ---------------------------------------------------------------------------
revoke all on function public.create_order(jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb) to service_role;

revoke all on function public.save_customer_address(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.save_customer_address(uuid, uuid, jsonb) to service_role;

revoke all on function public.delete_customer_address(uuid, uuid) from public, anon, authenticated;
grant execute on function public.delete_customer_address(uuid, uuid) to service_role;

revoke all on function public.customer_order_json(public.orders) from public, anon, authenticated;
grant execute on function public.customer_order_json(public.orders) to service_role;

revoke all on function public.list_customer_orders(uuid, int, int) from public, anon, authenticated;
grant execute on function public.list_customer_orders(uuid, int, int) to service_role;

revoke all on function public.get_customer_order(uuid, text) from public, anon, authenticated;
grant execute on function public.get_customer_order(uuid, text) to service_role;
