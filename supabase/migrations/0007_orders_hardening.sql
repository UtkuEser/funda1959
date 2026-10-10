-- Funda 1959 — Aşama 2: orders read from the database, admin status changes
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.
-- Depends on 0001_init_orders.sql and 0006_orders_demo_flag.sql. Safe to
-- re-run: add column if not exists / drop + add constraint / create ... if not
-- exists / create or replace function.
--
-- Membership (customer_user_id), Funda Puan and payment columns are NOT here —
-- they arrive with their own phases (SUPABASE_PLAN.md, Aşama 5, 6, 9).
--
--   * orders: sales_channel, delivery_zone_id, cancellation record
--     (reason + account + time, required once an order is cancelled)
--   * order_status_events: every admin status change — from, to, account,
--     time, reason (A12)
--   * create_order (v3): serialised per client_request_id (a concurrent
--     retry returns the same order instead of failing), branch written for
--     delivery orders too (the server derives it from the address), amount
--     and date checks; still demo-only (is_demo = true, payment pending)
--   * list_orders: branch-scoped, delivery-date filtered, paged admin list
--   * update_order_status: advance one step or cancel with a reason, only
--     within the caller's branches; delivered orders are never cancelled here
--     and no refund happens (later phases)
-- Every function is callable by the service role only.

-- ---------------------------------------------------------------------------
-- orders: new columns
-- ---------------------------------------------------------------------------
alter table public.orders add column if not exists sales_channel text not null default 'web';
alter table public.orders drop constraint if exists orders_sales_channel_check;
alter table public.orders add constraint orders_sales_channel_check
  check (sales_channel in ('web', 'mobile', 'store'));

alter table public.orders add column if not exists delivery_zone_id text;

alter table public.orders add column if not exists cancel_reason text;
alter table public.orders add column if not exists cancelled_by  text;
alter table public.orders add column if not exists cancelled_at  timestamptz;
alter table public.orders drop constraint if exists orders_cancel_recorded;
alter table public.orders add constraint orders_cancel_recorded check (
  status <> 'cancelled'
  or (cancel_reason is not null and length(btrim(cancel_reason)) >= 3
      and cancelled_by is not null and cancelled_at is not null)
);

create index if not exists orders_branch_delivery_date_idx on public.orders (branch_id, delivery_date);
create index if not exists orders_delivery_date_idx        on public.orders (delivery_date);

-- ---------------------------------------------------------------------------
-- order_status_events — audit trail of admin status changes
-- ---------------------------------------------------------------------------
create table if not exists public.order_status_events (
  id             bigint generated always as identity primary key,
  order_id       uuid        not null references public.orders(id) on delete cascade,
  from_status    text        not null,
  to_status      text        not null,
  actor_account  text        not null,
  actor_name     text        not null,
  reason         text,
  created_at     timestamptz not null default now(),
  constraint order_status_events_cancel_reason
    check (to_status <> 'cancelled' or (reason is not null and length(btrim(reason)) >= 3))
);
create index if not exists order_status_events_order_idx on public.order_status_events (order_id, created_at);

alter table public.order_status_events enable row level security;

-- ---------------------------------------------------------------------------
-- create_order (v3)
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
    if v_zone_id is null then
      raise exception 'missing_delivery_zone';
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

-- ---------------------------------------------------------------------------
-- list_orders — admin list. p_branch_slugs null = every branch (Merkez);
-- delivery orders created before this migration have no branch and are seen
-- by Merkez only. Newest first; at most 200 rows per call.
-- ---------------------------------------------------------------------------
create or replace function public.list_orders(
  p_branch_slugs text[] default null,
  p_from         date   default null,
  p_to           date   default null,
  p_limit        int    default 25,
  p_offset       int    default 0,
  p_order_number text   default null
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with scoped as (
    select o.*, b.slug as branch_slug
    from orders o
    left join branches b on b.id = o.branch_id
    where (p_branch_slugs is null or b.slug = any (p_branch_slugs))
      and (p_from is null or o.delivery_date >= p_from)
      and (p_to is null or o.delivery_date <= p_to)
      and (p_order_number is null or o.order_number = p_order_number)
  ),
  page as (
    select * from scoped
    order by created_at desc, order_number desc
    limit least(greatest(coalesce(p_limit, 25), 0), 200)
    offset greatest(coalesce(p_offset, 0), 0)
  )
  select jsonb_build_object(
    'total', (select count(*) from scoped),
    'status_counts', coalesce(
      (select jsonb_object_agg(status, n) from (select status, count(*) as n from scoped group by status) c),
      '{}'::jsonb),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'order_number',       p.order_number,
        'status',             p.status,
        'payment_status',     p.payment_status,
        'is_demo',            p.is_demo,
        'sales_channel',      p.sales_channel,
        'delivery_type',      p.delivery_type,
        'branch_slug',        p.branch_slug,
        'delivery_zone_id',   p.delivery_zone_id,
        'delivery_date',      to_char(p.delivery_date, 'YYYY-MM-DD'),
        'delivery_time_slot', p.delivery_time_slot,
        'subtotal',           p.subtotal,
        'delivery_fee',       p.delivery_fee,
        'discount',           p.discount,
        'total',              p.total,
        'order_note',         p.order_note,
        'cancel_reason',      p.cancel_reason,
        'cancelled_by',       p.cancelled_by,
        'cancelled_at',       p.cancelled_at,
        'created_at',         p.created_at,
        'updated_at',         p.updated_at,
        'customer', (
          select jsonb_build_object('full_name', c.full_name, 'phone', c.phone, 'email', c.email)
          from customers c where c.id = p.customer_id),
        'address', (
          select jsonb_build_object(
            'district', a.district, 'neighborhood', a.neighborhood, 'address_line', a.address_line,
            'building', a.building, 'floor', a.floor, 'apartment', a.apartment, 'note', a.note)
          from addresses a where a.id = p.address_id),
        'items', coalesce((
          select jsonb_agg(jsonb_build_object(
            'product_id', i.product_id, 'product_slug', i.product_slug, 'product_name', i.product_name,
            'variant_id', i.variant_id, 'variant_label', i.variant_label, 'quantity', i.quantity,
            'unit_price', i.unit_price, 'total_price', i.total_price, 'cake_message', i.cake_message,
            'extras', i.extras, 'note', i.note) order by i.created_at, i.id)
          from order_items i where i.order_id = p.id), '[]'::jsonb),
        'events', coalesce((
          select jsonb_agg(jsonb_build_object(
            'from_status', e.from_status, 'to_status', e.to_status,
            'actor_account', e.actor_account, 'actor_name', e.actor_name,
            'reason', e.reason, 'created_at', e.created_at) order by e.created_at, e.id)
          from order_status_events e where e.order_id = p.id), '[]'::jsonb)
      ) order by p.created_at desc, p.order_number desc)
      from page p
    ), '[]'::jsonb)
  );
$$;

-- ---------------------------------------------------------------------------
-- update_order_status — one step forward on the order's timeline, or cancel
-- with a reason. p_branch_slugs is the caller's scope from the signed admin
-- session (null = Merkez). Row-locked, so two admins can't race each other.
-- ---------------------------------------------------------------------------
create or replace function public.update_order_status(
  p_order_number  text,
  p_to_status     text,
  p_branch_slugs  text[],
  p_actor_account text,
  p_actor_name    text,
  p_reason        text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order       orders%rowtype;
  v_branch_slug text;
  v_next        text;
  v_reason      text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if nullif(btrim(coalesce(p_actor_account, '')), '') is null
     or nullif(btrim(coalesce(p_actor_name, '')), '') is null then
    raise exception 'missing_actor';
  end if;

  select * into v_order from orders where order_number = p_order_number for update;
  if not found then
    raise exception 'order_not_found';
  end if;

  select slug into v_branch_slug from branches where id = v_order.branch_id;
  if p_branch_slugs is not null and (v_branch_slug is null or not (v_branch_slug = any (p_branch_slugs))) then
    raise exception 'forbidden_branch';
  end if;

  if v_order.status in ('delivered', 'cancelled') then
    raise exception 'order_closed';
  end if;

  if p_to_status = 'cancelled' then
    if v_reason is null or length(v_reason) < 3 then
      raise exception 'cancel_reason_required';
    end if;
    if length(v_reason) > 500 then
      raise exception 'cancel_reason_too_long';
    end if;
  else
    v_next := case v_order.status
      when 'new'              then 'confirmed'
      when 'confirmed'        then 'preparing'
      when 'preparing'        then 'ready'
      when 'ready'            then case v_order.delivery_type when 'delivery' then 'out_for_delivery' else 'delivered' end
      when 'out_for_delivery' then 'delivered'
    end;
    if p_to_status is distinct from v_next then
      raise exception 'invalid_transition';
    end if;
    v_reason := null;
  end if;

  update orders
     set status        = p_to_status,
         cancel_reason = case when p_to_status = 'cancelled' then v_reason   else cancel_reason end,
         cancelled_by  = case when p_to_status = 'cancelled' then p_actor_name else cancelled_by end,
         cancelled_at  = case when p_to_status = 'cancelled' then now()      else cancelled_at end
   where id = v_order.id;

  insert into order_status_events (order_id, from_status, to_status, actor_account, actor_name, reason)
  values (v_order.id, v_order.status, p_to_status, p_actor_account, p_actor_name, v_reason);

  return public.list_orders(null, null, null, 1, 0, p_order_number)->'rows'->0;
end;
$$;

-- ---------------------------------------------------------------------------
-- grants — service role only (Supabase grants new functions to anon /
-- authenticated by default, so revoke explicitly)
-- ---------------------------------------------------------------------------
revoke all on function public.create_order(jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb) to service_role;

revoke all on function public.list_orders(text[], date, date, int, int, text) from public, anon, authenticated;
grant execute on function public.list_orders(text[], date, date, int, int, text) to service_role;

revoke all on function public.update_order_status(text, text, text[], text, text, text) from public, anon, authenticated;
grant execute on function public.update_order_status(text, text, text[], text, text, text) to service_role;
