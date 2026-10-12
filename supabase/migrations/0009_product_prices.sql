-- Funda 1959 — Aşama 4: product prices (Merkez)
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.
-- Depends on 0001 (set_updated_at) and 0008 (create_order v4). Safe to re-run:
-- create table if not exists / drop + create trigger / create or replace function.
--
-- SUPABASE_PLAN.md D5, D20, D21:
--   * product_prices — the prices Merkez set for EXISTING products. The
--     catalog itself (products, sizes, content, images) stays in code. One
--     row per price: (product_id, variant_key), variant_key '' for a
--     product's single price, else the size id ('4-6', '500g', '12' …).
--     Every size is priced on its own row — no multiplier, a change to one
--     size changes no other (D20). A price without a row sells at its catalog
--     price in code; those catalog prices (sizes included) are the starting
--     values, so NOTHING IS SEEDED. Struck-through old prices are not stored
--     here: they stay in code with the product or size they belong to and
--     show only while above the current price (D18, D21). Product and size
--     ids are checked against the code catalog by the server (the database
--     does not know the catalog). Kuruş allowed; price > 0 and ≤ 100.000 TL.
--     Last editor + time are stored; no history table. Written only by the
--     server (service role) for a Merkez session.
--   * create_order (v5) — same as v4 plus: an item whose product has a stored
--     price must carry exactly that price (else price_mismatch). A retried
--     request still returns the order it created first, whatever the prices
--     are now; stored orders and their item prices are never changed.
-- RLS on, no policies.

-- ---------------------------------------------------------------------------
-- product_prices
-- ---------------------------------------------------------------------------
create table if not exists public.product_prices (
  product_id  text          not null,
  variant_key text          not null default '',
  price       numeric(10,2) not null,
  updated_by  text          not null,
  updated_at  timestamptz   not null default now(),
  primary key (product_id, variant_key),
  constraint product_prices_product_id_not_blank check (length(btrim(product_id)) > 0),
  -- '' or a size id as the code catalog writes them ('4-6', '1.5kg', '12')
  constraint product_prices_variant_key_format check (variant_key ~ '^[0-9a-z.-]{0,20}$'),
  constraint product_prices_price_range check (price > 0 and price <= 100000)
);

drop trigger if exists product_prices_set_updated_at on public.product_prices;
create trigger product_prices_set_updated_at
  before update on public.product_prices
  for each row execute function public.set_updated_at();

alter table public.product_prices enable row level security;

-- ---------------------------------------------------------------------------
-- create_order (v5) — v4 (0008) + stored product price check
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
  -- The server priced it from the same table; a change in between refuses
  -- the order (price_mismatch) instead of writing an outdated price. Items
  -- without a stored price sell at the catalog price, which lives in code
  -- and is checked there.
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

  -- D15: a delivery order carries the zone's current fee — set (paid or
  -- explicitly free) and equal to what the server computed; a missing row or
  -- 'unset' is never free. D14: delivery minimum 500 TL on products − discount
  -- (fee excluded); pickup is exempt. Keep 500 in step with
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
        order_number, client_request_id, customer_id, delivery_type,
        branch_id, address_id, delivery_zone_id, sales_channel,
        delivery_date, delivery_time_slot,
        subtotal, delivery_fee, discount, total, order_note,
        payment_status, is_demo
      ) values (
        v_order_number, v_client_request_id, v_customer_id, v_delivery_type,
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

revoke all on function public.create_order(jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb) to service_role;
