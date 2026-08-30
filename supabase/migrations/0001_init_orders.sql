-- Funda 1959 — order persistence
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.
-- No payment / auth here; guest checkout only.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- branches
-- ---------------------------------------------------------------------------
create table if not exists public.branches (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  address     text,
  phone       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

insert into public.branches (slug, name, address, phone) values
  ('gop',    'Funda 1959 GOP',    'Kızkulesi Sokak No:12/A, Gaziosmanpaşa, Ankara', '+90 312 447 00 00'),
  ('panora', 'Funda 1959 Panora', 'Panora AVM, Kızılay, Ankara',                    '+90 312 448 00 00'),
  ('incek',  'Funda 1959 İncek',  'TONA Residence, İncek, Ankara',                  '+90 312 449 00 00')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- customers  (a customer is NOT required to be an auth user)
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  phone       text not null,
  email       text not null,
  created_at  timestamptz not null default now()
);
create index if not exists customers_email_idx on public.customers (email);
create index if not exists customers_phone_idx on public.customers (phone);

-- ---------------------------------------------------------------------------
-- addresses  (only for delivery orders)
-- ---------------------------------------------------------------------------
create table if not exists public.addresses (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.customers(id) on delete cascade,
  district      text not null,
  neighborhood  text not null,
  address_line  text not null,
  building      text,
  floor         text,
  apartment     text,
  note          text,
  created_at    timestamptz not null default now()
);
create index if not exists addresses_customer_id_idx on public.addresses (customer_id);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        text not null unique,
  client_request_id   text,
  customer_id         uuid not null references public.customers(id),
  status              text not null default 'new'
                        check (status in ('new','confirmed','preparing','ready','out_for_delivery','delivered','cancelled')),
  delivery_type       text not null check (delivery_type in ('delivery','pickup')),
  branch_id           uuid references public.branches(id),
  address_id          uuid references public.addresses(id),
  delivery_date       date not null,
  delivery_time_slot  text not null,
  subtotal            numeric(10,2) not null,
  delivery_fee        numeric(10,2) not null default 0,
  discount            numeric(10,2) not null default 0,
  total               numeric(10,2) not null,
  order_note          text,
  payment_status      text not null default 'pending'
                        check (payment_status in ('pending','paid','failed','refunded')),
  payment_method      text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create unique index if not exists orders_client_request_id_key
  on public.orders (client_request_id) where client_request_id is not null;
create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_status_idx     on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- ---------------------------------------------------------------------------
-- order_items  (price / name snapshotted so historic orders never break)
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    text not null,
  product_slug  text not null,
  product_name  text not null,
  variant_id    text,
  variant_label text,
  quantity      integer not null check (quantity >= 1),
  unit_price    numeric(10,2) not null,
  total_price   numeric(10,2) not null,
  cake_message  text,
  customization jsonb,
  extras        jsonb,
  note          text,
  created_at    timestamptz not null default now()
);
create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — lock everything down. All writes go through the
-- security-definer function below (called by the server with the service
-- role key). anon/authenticated get no direct table access.
-- ---------------------------------------------------------------------------
alter table public.branches    enable row level security;
alter table public.customers   enable row level security;
alter table public.addresses   enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "branches public read" on public.branches;
create policy "branches public read" on public.branches
  for select using (is_active = true);

-- ---------------------------------------------------------------------------
-- get_order_public — PII-free order summary for the confirmation page
-- ---------------------------------------------------------------------------
create or replace function public.get_order_public(p_order_number text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'order_number',       o.order_number,
    'status',             o.status,
    'delivery_type',      o.delivery_type,
    'delivery_date',      to_char(o.delivery_date, 'YYYY-MM-DD'),
    'delivery_time_slot', o.delivery_time_slot,
    'total',              o.total,
    'branch_name',        b.name
  )
  from public.orders o
  left join public.branches b on b.id = o.branch_id
  where o.order_number = p_order_number;
$$;

-- ---------------------------------------------------------------------------
-- create_order — atomic: customer -> address? -> order -> order_items.
-- Idempotent on client_request_id. Server has already re-priced everything.
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
  v_address_id        uuid;
  v_branch_id         uuid;
  v_branch_slug       text := nullif(p_payload#>>'{delivery,branch_slug}', '');
  v_delivery_type     text := p_payload#>>'{delivery,type}';
  v_order_id          uuid;
  v_order_number      text;
  v_item              jsonb;
  v_attempts          int := 0;
begin
  -- Idempotency: same submit retried -> return the order already created.
  if v_client_request_id is not null then
    select order_number into v_existing_number
    from orders where client_request_id = v_client_request_id;
    if v_existing_number is not null then
      return get_order_public(v_existing_number);
    end if;
  end if;

  insert into customers (full_name, phone, email)
  values (
    p_payload#>>'{customer,full_name}',
    p_payload#>>'{customer,phone}',
    p_payload#>>'{customer,email}'
  )
  returning id into v_customer_id;

  if v_delivery_type = 'pickup' then
    select id into v_branch_id
    from branches where slug = v_branch_slug and is_active = true;
    if v_branch_id is null then
      raise exception 'invalid_branch';
    end if;

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
        order_number, client_request_id, customer_id, delivery_type,
        branch_id, address_id, delivery_date, delivery_time_slot,
        subtotal, delivery_fee, discount, total, order_note
      ) values (
        v_order_number, v_client_request_id, v_customer_id, v_delivery_type,
        v_branch_id, v_address_id,
        (p_payload#>>'{delivery,date}')::date,
        p_payload#>>'{delivery,time_slot}',
        (p_payload->>'subtotal')::numeric,
        coalesce((p_payload->>'delivery_fee')::numeric, 0),
        coalesce((p_payload->>'discount')::numeric, 0),
        (p_payload->>'total')::numeric,
        nullif(p_payload->>'order_note', '')
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
      (v_item->>'unit_price')::numeric,
      (v_item->>'total_price')::numeric,
      nullif(v_item->>'cake_message', ''),
      case when jsonb_typeof(v_item->'customization') = 'object' then v_item->'customization' end,
      case when jsonb_typeof(v_item->'extras') = 'array' then v_item->'extras' end,
      nullif(v_item->>'note', '')
    );
  end loop;

  return get_order_public(v_order_number);
end;
$$;

revoke all on function public.create_order(jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb) to service_role;
grant execute on function public.get_order_public(text) to anon, authenticated, service_role;
