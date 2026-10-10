-- Funda 1959 — demo orders are explicitly marked (not inferred from payment status)
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.
-- Depends on 0001_init_orders.sql. Safe to re-run: every statement is
-- idempotent (add column if not exists / drop + add constraint /
-- create index if not exists / create or replace function).
--
-- No payment provider is connected yet (SUPABASE_PLAN.md, D8). Every order
-- created today is a demo/test order, and `payment_status = 'pending'` alone
-- must not be what tells demo and real orders apart. So:
--   * `orders.is_demo` defaults to TRUE. Rows that already exist become demo
--     orders too — none of them was paid through a provider.
--   * a demo order can never be 'paid' (check `orders_demo_never_paid`). If
--     adding it fails, an order is marked paid although no provider exists:
--     investigate that row, don't drop the check.
--   * `create_order` writes `is_demo = true` and `payment_status = 'pending'`
--     explicitly and refuses a payload that asks for a non-demo order. Real
--     (non-demo) orders arrive with the payment provider (Aşama 9) in a later
--     migration — never through this function.
--   * `get_order_public` also returns `is_demo` (no personal data).
-- Production order intake is closed in the app as well
-- (src/lib/orders/engine.ts), so demo orders only exist in funda1959-test.

alter table public.orders add column if not exists is_demo boolean not null default true;

alter table public.orders drop constraint if exists orders_demo_never_paid;
alter table public.orders add constraint orders_demo_never_paid
  check (not (is_demo and payment_status = 'paid'));

create index if not exists orders_is_demo_created_at_idx on public.orders (is_demo, created_at desc);

-- ---------------------------------------------------------------------------
-- get_order_public — same as 0001, plus `is_demo`
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
    'branch_name',        b.name,
    'is_demo',            o.is_demo
  )
  from public.orders o
  left join public.branches b on b.id = o.branch_id
  where o.order_number = p_order_number;
$$;

-- ---------------------------------------------------------------------------
-- create_order — same as 0001 (atomic, idempotent on client_request_id),
-- except that it only ever creates demo orders: `is_demo = true`,
-- `payment_status = 'pending'`. A payload with `is_demo` other than true is
-- refused. (The concurrent-retry fix is Aşama 2, migration 0007.)
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
  -- Only demo orders exist until a payment provider is connected (D8).
  if coalesce(p_payload->>'is_demo', 'true') <> 'true' then
    raise exception 'non_demo_order_not_supported';
  end if;

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
        subtotal, delivery_fee, discount, total, order_note,
        payment_status, is_demo
      ) values (
        v_order_number, v_client_request_id, v_customer_id, v_delivery_type,
        v_branch_id, v_address_id,
        (p_payload#>>'{delivery,date}')::date,
        p_payload#>>'{delivery,time_slot}',
        (p_payload->>'subtotal')::numeric,
        coalesce((p_payload->>'delivery_fee')::numeric, 0),
        coalesce((p_payload->>'discount')::numeric, 0),
        (p_payload->>'total')::numeric,
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
