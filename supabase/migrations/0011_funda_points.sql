-- Funda 1959 — Aşama 6: Funda Puan ledger (lots, movements, reservations)
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.
-- Depends on 0001 (set_updated_at), 0007 (update_order_status), 0010
-- (customer_profiles, orders.customer_user_id, create_order v6). Safe to
-- re-run: create ... if not exists / add column if not exists / drop + add
-- constraint / drop + create trigger / create or replace function.
--
-- SUPABASE_PLAN.md D31–D41, §8.3. The rules live HERE, in one place:
--   * only signed-in members earn, only on online orders (web/mobile), only
--     when the payment is confirmed (complete_order_payment) and never for a
--     demo order;
--   * earn = floor(10% × (subtotal − discount − points_redeemed)); the
--     delivery fee never counts; 1 point = 1 TL;
--   * every earning is its own lot, valid one year from the moment it was
--     earned; spending consumes the lot that expires first (FEFO);
--   * points pay products only (never the delivery fee), up to the whole
--     product amount after discount (whole TL — points are integers);
--   * points are taken from the lots the moment an order is created
--     (reservation, status 'reserved'): two orders can never spend the same
--     balance (the member's account row is locked for every point
--     operation). Payment confirmed -> 'captured'; payment failed / hold
--     expired / cancelled before payment -> 'released' back to the SAME lots;
--     cancelled after payment -> 'refunded' to the same lots. A lot that has
--     expired in between gets nothing back (expired points never become
--     spendable again — counted in `expired_points`);
--   * cancelling a paid order takes its earned points back: from that lot
--     first, then FEFO from the others; what is already spent becomes debt
--     (the balance may go below zero). Any later credit settles the debt
--     first. The spendable balance is never below zero;
--   * Merkez corrections need a reason and record the admin account + name;
--     branch accounts are refused here too;
--   * every operation is idempotent through a unique business key.
-- Today create_order still accepts demo orders only (0006–0010), and a demo
-- order can never carry points: the redemption path below is prepared for
-- real (paid) orders and unreachable until the payment integration
-- (Aşama 9). The app keeps earning and spending switched off as well
-- (`isFundaPointsActive()` in src/lib/funda-points/config.ts).
-- RLS on, no policies; every function is service role only.

-- ---------------------------------------------------------------------------
-- orders: point and payment fields
-- ---------------------------------------------------------------------------
alter table public.orders add column if not exists points_redeemed   integer not null default 0;
alter table public.orders add column if not exists points_earned     integer not null default 0;
alter table public.orders add column if not exists points_status     text    not null default 'none';
alter table public.orders add column if not exists payment_reference text;
alter table public.orders add column if not exists paid_at           timestamptz;

alter table public.orders drop constraint if exists orders_points_values;
alter table public.orders add constraint orders_points_values check (points_redeemed >= 0 and points_earned >= 0);
alter table public.orders drop constraint if exists orders_points_status_check;
alter table public.orders add constraint orders_points_status_check
  check (points_status in ('none', 'reserved', 'captured', 'released', 'refunded'));
alter table public.orders drop constraint if exists orders_points_status_consistent;
alter table public.orders add constraint orders_points_status_consistent
  check ((points_redeemed = 0) = (points_status = 'none'));
-- points belong to a member, pay products only, and never touch a demo order
alter table public.orders drop constraint if exists orders_points_member_only;
alter table public.orders add constraint orders_points_member_only
  check ((points_redeemed = 0 and points_earned = 0) or customer_user_id is not null);
alter table public.orders drop constraint if exists orders_points_never_demo;
alter table public.orders add constraint orders_points_never_demo
  check (not is_demo or (points_redeemed = 0 and points_earned = 0));
alter table public.orders drop constraint if exists orders_points_within_products;
alter table public.orders add constraint orders_points_within_products
  check (points_redeemed <= floor(subtotal - discount));

-- ---------------------------------------------------------------------------
-- tables
-- ---------------------------------------------------------------------------
create table if not exists public.funda_point_accounts (
  auth_user_id uuid        primary key references auth.users (id) on delete cascade,
  -- points owed after a cancelled order's earned points had already been spent
  debt         integer     not null default 0 check (debt >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.funda_point_lots (
  id              uuid        primary key default gen_random_uuid(),
  auth_user_id    uuid        not null references public.funda_point_accounts (auth_user_id) on delete cascade,
  source          text        not null check (source in ('earn', 'admin')),
  source_order_id uuid        references public.orders (id),
  points          integer     not null check (points > 0),
  remaining       integer     not null,
  earned_at       timestamptz not null default now(),
  expires_at      timestamptz not null,
  created_at      timestamptz not null default now(),
  constraint funda_point_lots_remaining_range check (remaining >= 0 and remaining <= points),
  constraint funda_point_lots_expiry check (expires_at > earned_at),
  constraint funda_point_lots_earn_order check ((source = 'earn') = (source_order_id is not null))
);
-- one earning per order
create unique index if not exists funda_point_lots_one_per_order
  on public.funda_point_lots (source_order_id) where source_order_id is not null;
create index if not exists funda_point_lots_spendable
  on public.funda_point_lots (auth_user_id, expires_at, earned_at, id) where remaining > 0;

create table if not exists public.funda_point_transactions (
  id              bigint      generated always as identity primary key,
  auth_user_id    uuid        not null references public.funda_point_accounts (auth_user_id) on delete cascade,
  type            text        not null check (type in (
                    'EARN', 'REDEEM', 'REDEEM_RELEASE', 'REFUND', 'REVERSAL',
                    'EXPIRE', 'ADMIN_ADD', 'ADMIN_SUBTRACT')),
  -- signed: positive credits, negative debits. Invariant: the sum of a
  -- member's points = the remaining points of all their lots − their debt.
  -- A credit that pays off debt carries those lot movements itself (the
  -- debt offset doesn't change the net balance, so it is no separate row).
  points          integer     not null,
  -- REDEEM_RELEASE / REFUND: points that could not come back because their lot had expired
  expired_points  integer     not null default 0 check (expired_points >= 0),
  order_id        uuid        references public.orders (id),
  lot_id          uuid        references public.funda_point_lots (id),
  business_key    text        not null unique,
  available_after integer     not null check (available_after >= 0),
  debt_after      integer     not null check (debt_after >= 0),
  reason          text,
  actor_account   text,
  actor_name      text,
  created_at      timestamptz not null default now(),
  constraint funda_point_transactions_sign check (
       (type in ('EARN', 'ADMIN_ADD') and points > 0)
    or (type in ('REDEEM_RELEASE', 'REFUND') and points >= 0 and (points > 0 or expired_points > 0))
    or (type in ('REDEEM', 'REVERSAL', 'EXPIRE', 'ADMIN_SUBTRACT') and points < 0)),
  constraint funda_point_transactions_admin_recorded check (
       type not in ('ADMIN_ADD', 'ADMIN_SUBTRACT')
    or (reason is not null and length(btrim(reason)) between 3 and 300
        and actor_account is not null and actor_name is not null))
);
create index if not exists funda_point_transactions_user
  on public.funda_point_transactions (auth_user_id, created_at desc, id desc);
create index if not exists funda_point_transactions_order
  on public.funda_point_transactions (order_id) where order_id is not null;

create table if not exists public.funda_point_lot_movements (
  id             bigint      generated always as identity primary key,
  transaction_id bigint      not null references public.funda_point_transactions (id) on delete cascade,
  lot_id         uuid        not null references public.funda_point_lots (id) on delete cascade,
  -- what this transaction did to the lot: negative = taken, positive = put (back)
  points         integer     not null check (points <> 0),
  created_at     timestamptz not null default now()
);
create index if not exists funda_point_lot_movements_tx  on public.funda_point_lot_movements (transaction_id);
create index if not exists funda_point_lot_movements_lot on public.funda_point_lot_movements (lot_id);

create table if not exists public.funda_point_reservations (
  order_id              uuid        primary key references public.orders (id),
  auth_user_id          uuid        not null references public.funda_point_accounts (auth_user_id) on delete cascade,
  points                integer     not null check (points > 0),
  status                text        not null check (status in ('reserved', 'captured', 'released', 'refunded')),
  redeem_transaction_id bigint      not null references public.funda_point_transactions (id),
  hold_until            timestamptz not null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists funda_point_reservations_open
  on public.funda_point_reservations (hold_until) where status = 'reserved';

drop trigger if exists funda_point_accounts_set_updated_at on public.funda_point_accounts;
create trigger funda_point_accounts_set_updated_at
  before update on public.funda_point_accounts
  for each row execute function public.set_updated_at();
drop trigger if exists funda_point_reservations_set_updated_at on public.funda_point_reservations;
create trigger funda_point_reservations_set_updated_at
  before update on public.funda_point_reservations
  for each row execute function public.set_updated_at();

-- the ledger is append-only (deleting an auth user still cascades)
create or replace function public.funda_points_append_only()
returns trigger language plpgsql as $$
begin
  raise exception 'funda_points_append_only';
end;
$$;
drop trigger if exists funda_point_transactions_append_only on public.funda_point_transactions;
create trigger funda_point_transactions_append_only
  before update on public.funda_point_transactions
  for each row execute function public.funda_points_append_only();
drop trigger if exists funda_point_lot_movements_append_only on public.funda_point_lot_movements;
create trigger funda_point_lot_movements_append_only
  before update on public.funda_point_lot_movements
  for each row execute function public.funda_points_append_only();

alter table public.funda_point_accounts      enable row level security;
alter table public.funda_point_lots          enable row level security;
alter table public.funda_point_transactions  enable row level security;
alter table public.funda_point_lot_movements enable row level security;
alter table public.funda_point_reservations  enable row level security;

-- ---------------------------------------------------------------------------
-- internal helpers (not callable through the API)
-- ---------------------------------------------------------------------------

-- Creates the account if needed and locks it: every point operation of a
-- member runs one at a time, so a balance can't be spent twice.
create or replace function public.fp_lock_account(p_user uuid)
returns public.funda_point_accounts
language plpgsql
set search_path = public
as $$
declare
  v_acc funda_point_accounts%rowtype;
begin
  insert into funda_point_accounts (auth_user_id) values (p_user) on conflict (auth_user_id) do nothing;
  select * into v_acc from funda_point_accounts where auth_user_id = p_user for update;
  return v_acc;
end;
$$;

-- Spendable points: unexpired lots only.
create or replace function public.fp_available(p_user uuid)
returns integer
language sql
stable
set search_path = public
as $$
  select coalesce(sum(remaining), 0)::int
    from funda_point_lots
   where auth_user_id = p_user and remaining > 0 and expires_at > now();
$$;

-- Takes up to p_points from one lot (if unexpired) for transaction p_tx.
create or replace function public.fp_take_from_lot(p_lot uuid, p_points integer, p_tx bigint)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_lot  funda_point_lots%rowtype;
  v_take integer;
begin
  if p_points <= 0 then
    return 0;
  end if;
  select * into v_lot from funda_point_lots where id = p_lot for update;
  if not found or v_lot.remaining <= 0 or v_lot.expires_at <= now() then
    return 0;
  end if;
  v_take := least(v_lot.remaining, p_points);
  update funda_point_lots set remaining = remaining - v_take where id = p_lot;
  insert into funda_point_lot_movements (transaction_id, lot_id, points) values (p_tx, p_lot, -v_take);
  return v_take;
end;
$$;

-- Takes up to p_points from the member's lots, the one expiring first first.
create or replace function public.fp_take_fefo(p_user uuid, p_points integer, p_tx bigint)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_lot   record;
  v_taken integer := 0;
begin
  if p_points <= 0 then
    return 0;
  end if;
  for v_lot in
    select id from funda_point_lots
     where auth_user_id = p_user and remaining > 0 and expires_at > now()
     order by expires_at, earned_at, id
     for update
  loop
    exit when v_taken >= p_points;
    v_taken := v_taken + fp_take_from_lot(v_lot.id, p_points - v_taken, p_tx);
  end loop;
  return v_taken;
end;
$$;

-- After a credit: what the member owes is paid from their lots (FEFO). The
-- lot movements belong to the crediting transaction p_tx; p_settle was
-- computed by the caller (least(debt, spendable after the credit)).
create or replace function public.fp_settle_debt(p_user uuid, p_tx bigint, p_settle integer)
returns void
language plpgsql
set search_path = public
as $$
begin
  if p_settle <= 0 then
    return;
  end if;
  if fp_take_fefo(p_user, p_settle, p_tx) <> p_settle then
    raise exception 'funda_points_internal_settle';
  end if;
  update funda_point_accounts set debt = debt - p_settle where auth_user_id = p_user;
end;
$$;

-- A new lot (earning or Merkez addition), valid one year; pays debt first.
create or replace function public.fp_credit_new_lot(
  p_user uuid, p_points integer, p_source text, p_order uuid, p_type text, p_key text,
  p_reason text, p_actor_account text, p_actor_name text
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_lot    uuid;
  v_tx     bigint;
  v_debt   integer;
  v_avail  integer;
  v_settle integer;
begin
  select debt into v_debt from funda_point_accounts where auth_user_id = p_user;
  v_avail := fp_available(p_user);
  v_settle := least(v_debt, v_avail + p_points);
  insert into funda_point_lots (auth_user_id, source, source_order_id, points, remaining, earned_at, expires_at)
  values (p_user, p_source, p_order, p_points, p_points, now(), now() + interval '1 year')
  returning id into v_lot;
  insert into funda_point_transactions (auth_user_id, type, points, order_id, lot_id, business_key,
                                        available_after, debt_after, reason, actor_account, actor_name)
  values (p_user, p_type, p_points, p_order, v_lot, p_key, v_avail + p_points - v_settle, v_debt - v_settle,
          p_reason, p_actor_account, p_actor_name)
  returning id into v_tx;
  insert into funda_point_lot_movements (transaction_id, lot_id, points) values (v_tx, v_lot, p_points);
  perform fp_settle_debt(p_user, v_tx, v_settle);
  return v_lot;
end;
$$;

-- Reserves (takes) points for an order at creation. Fails if the member
-- doesn't have them — the whole order is then not created.
create or replace function public.fp_reserve_for_order(p_order uuid, p_user uuid, p_points integer, p_hold interval)
returns bigint
language plpgsql
set search_path = public
as $$
declare
  v_acc   funda_point_accounts%rowtype;
  v_avail integer;
  v_tx    bigint;
begin
  if p_points <= 0 then
    raise exception 'invalid_points';
  end if;
  v_acc := fp_lock_account(p_user);
  v_avail := fp_available(p_user);
  if p_points > v_avail then
    raise exception 'insufficient_points';
  end if;
  insert into funda_point_transactions (auth_user_id, type, points, order_id, business_key, available_after, debt_after)
  values (p_user, 'REDEEM', -p_points, p_order, 'order:' || p_order || ':REDEEM', v_avail - p_points, v_acc.debt)
  returning id into v_tx;
  if fp_take_fefo(p_user, p_points, v_tx) <> p_points then
    raise exception 'funda_points_internal_reserve';
  end if;
  insert into funda_point_reservations (order_id, auth_user_id, points, status, redeem_transaction_id, hold_until)
  values (p_order, p_user, p_points, 'reserved', v_tx, now() + p_hold);
  update orders set points_status = 'reserved' where id = p_order;
  return v_tx;
end;
$$;

-- Puts an order's reserved points back into the lots they came from
-- (original expiry). Expired lots get nothing back. p_type: REDEEM_RELEASE
-- (payment failed / hold expired / cancelled before payment) or REFUND
-- (cancelled after payment).
create or replace function public.fp_return_reserved(p_order uuid, p_type text)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_res     funda_point_reservations%rowtype;
  v_acc     funda_point_accounts%rowtype;
  v_back    integer;
  v_expired integer;
  v_avail   integer;
  v_settle  integer;
  v_tx      bigint;
  v_m       record;
  v_key     text := 'order:' || p_order || ':' || p_type;
begin
  select * into v_res from funda_point_reservations where order_id = p_order for update;
  if not found then
    return 0;
  end if;
  if (p_type = 'REDEEM_RELEASE' and v_res.status <> 'reserved')
     or (p_type = 'REFUND' and v_res.status <> 'captured') then
    return 0; -- already released / refunded (idempotent) or not in that state
  end if;
  v_acc := fp_lock_account(v_res.auth_user_id);

  select coalesce(sum(-m.points) filter (where l.expires_at > now()), 0)::int,
         coalesce(sum(-m.points) filter (where l.expires_at <= now()), 0)::int
    into v_back, v_expired
    from funda_point_lot_movements m
    join funda_point_lots l on l.id = m.lot_id
   where m.transaction_id = v_res.redeem_transaction_id;

  v_avail := fp_available(v_res.auth_user_id);
  v_settle := least(v_acc.debt, v_avail + v_back);
  insert into funda_point_transactions (auth_user_id, type, points, expired_points, order_id, business_key,
                                        available_after, debt_after)
  values (v_res.auth_user_id, p_type, v_back, v_expired, p_order, v_key,
          v_avail + v_back - v_settle, v_acc.debt - v_settle)
  returning id into v_tx;

  for v_m in
    select m.lot_id, -m.points as pts
      from funda_point_lot_movements m
      join funda_point_lots l on l.id = m.lot_id
     where m.transaction_id = v_res.redeem_transaction_id and l.expires_at > now()
     order by l.expires_at, l.id
  loop
    update funda_point_lots set remaining = remaining + v_m.pts where id = v_m.lot_id;
    insert into funda_point_lot_movements (transaction_id, lot_id, points) values (v_tx, v_m.lot_id, v_m.pts);
  end loop;

  update funda_point_reservations
     set status = case p_type when 'REFUND' then 'refunded' else 'released' end
   where order_id = p_order;
  update orders
     set points_status = case p_type when 'REFUND' then 'refunded' else 'released' end
   where id = p_order;
  perform fp_settle_debt(v_res.auth_user_id, v_tx, v_settle);
  return v_back;
end;
$$;

-- Earns points for a paid order (members, online, non-demo). Idempotent.
create or replace function public.fp_earn_for_order(p_order uuid)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_o      orders%rowtype;
  v_points integer;
  v_key    text := 'order:' || p_order || ':EARN';
begin
  select * into v_o from orders where id = p_order;
  if not found or v_o.customer_user_id is null or v_o.is_demo
     or v_o.payment_status <> 'paid' or v_o.sales_channel not in ('web', 'mobile') then
    return 0;
  end if;
  if exists (select 1 from funda_point_transactions where business_key = v_key) then
    return v_o.points_earned;
  end if;
  -- exact decimal arithmetic: floor(10% of the product amount left after discount and points)
  v_points := floor(greatest(v_o.subtotal - v_o.discount - v_o.points_redeemed, 0) * 0.10)::int;
  if v_points <= 0 then
    return 0;
  end if;
  perform fp_lock_account(v_o.customer_user_id);
  perform fp_credit_new_lot(v_o.customer_user_id, v_points, 'earn', v_o.id, 'EARN', v_key, null, null, null);
  update orders set points_earned = v_points where id = v_o.id;
  return v_points;
end;
$$;

-- Takes back a cancelled order's earned points: from its own lot first, then
-- FEFO; whatever is already spent becomes debt. Idempotent.
create or replace function public.fp_reverse_earn(p_order uuid)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_o        orders%rowtype;
  v_acc      funda_point_accounts%rowtype;
  v_avail    integer;
  v_take     integer;
  v_short    integer;
  v_tx       bigint;
  v_lot      uuid;
  v_got      integer;
  v_key      text := 'order:' || p_order || ':REVERSAL';
begin
  select * into v_o from orders where id = p_order;
  if not found or v_o.points_earned <= 0 or v_o.customer_user_id is null then
    return 0;
  end if;
  if exists (select 1 from funda_point_transactions where business_key = v_key) then
    return 0;
  end if;
  v_acc := fp_lock_account(v_o.customer_user_id);
  v_avail := fp_available(v_o.customer_user_id);
  v_take := least(v_o.points_earned, v_avail);
  v_short := v_o.points_earned - v_take;

  insert into funda_point_transactions (auth_user_id, type, points, order_id, business_key, available_after, debt_after)
  values (v_o.customer_user_id, 'REVERSAL', -v_o.points_earned, p_order, v_key, v_avail - v_take, v_acc.debt + v_short)
  returning id into v_tx;

  select id into v_lot from funda_point_lots where source_order_id = p_order;
  v_got := 0;
  if v_lot is not null then
    v_got := fp_take_from_lot(v_lot, v_take, v_tx);
  end if;
  v_got := v_got + fp_take_fefo(v_o.customer_user_id, v_take - v_got, v_tx);
  if v_got <> v_take then
    raise exception 'funda_points_internal_reversal';
  end if;
  if v_short > 0 then
    update funda_point_accounts set debt = debt + v_short where auth_user_id = v_o.customer_user_id;
  end if;
  return v_o.points_earned;
end;
$$;

-- A cancelled order's points: release (unpaid) or refund (paid), then take
-- back what it earned. Called by update_order_status inside its transaction.
create or replace function public.fp_on_order_cancelled(p_order uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_status text;
begin
  select points_status into v_status from orders where id = p_order;
  if v_status = 'reserved' then
    perform fp_return_reserved(p_order, 'REDEEM_RELEASE');
  elsif v_status = 'captured' then
    perform fp_return_reserved(p_order, 'REFUND');
  end if;
  perform fp_reverse_earn(p_order);
end;
$$;

-- ---------------------------------------------------------------------------
-- payment: confirm (earn + capture) / fail (release). For the payment
-- integration (Aşama 9); 'funda_points' completes an order whose whole
-- amount was paid with points (total 0) — server-side only.
-- ---------------------------------------------------------------------------
create or replace function public.complete_order_payment(
  p_order_number text,
  p_method       text,
  p_reference    text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_o   orders%rowtype;
  v_res funda_point_reservations%rowtype;
begin
  if nullif(btrim(coalesce(p_method, '')), '') is null then
    raise exception 'missing_payment_method';
  end if;
  select * into v_o from orders where order_number = p_order_number for update;
  if not found then
    raise exception 'order_not_found';
  end if;
  if v_o.is_demo then
    raise exception 'demo_order_cannot_be_paid';
  end if;
  if v_o.payment_status = 'paid' then
    return jsonb_build_object('order_number', v_o.order_number, 'payment_status', 'paid',
                              'points_redeemed', v_o.points_redeemed, 'points_earned', v_o.points_earned);
  end if;
  if v_o.payment_status <> 'pending' then
    raise exception 'payment_not_pending';
  end if;
  if v_o.status = 'cancelled' then
    raise exception 'order_cancelled';
  end if;
  if p_method = 'funda_points' and (v_o.total <> 0 or v_o.points_redeemed = 0) then
    raise exception 'points_only_requires_zero_total';
  end if;
  if p_method <> 'funda_points' and v_o.total <= 0 then
    raise exception 'nothing_to_pay';
  end if;

  if v_o.points_redeemed > 0 then
    select * into v_res from funda_point_reservations where order_id = v_o.id for update;
    if not found or v_res.status <> 'reserved' then
      raise exception 'points_reservation_not_active';
    end if;
    update funda_point_reservations set status = 'captured' where order_id = v_o.id;
    update orders set points_status = 'captured' where id = v_o.id;
  end if;

  update orders
     set payment_status = 'paid', payment_method = p_method, payment_reference = p_reference, paid_at = now()
   where id = v_o.id;
  perform fp_earn_for_order(v_o.id);

  select * into v_o from orders where id = v_o.id;
  return jsonb_build_object('order_number', v_o.order_number, 'payment_status', v_o.payment_status,
                            'points_redeemed', v_o.points_redeemed, 'points_earned', v_o.points_earned);
end;
$$;

create or replace function public.fail_order_payment(p_order_number text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_o orders%rowtype;
begin
  select * into v_o from orders where order_number = p_order_number for update;
  if not found then
    raise exception 'order_not_found';
  end if;
  if v_o.is_demo then
    raise exception 'demo_order_payment';
  end if;
  if v_o.payment_status = 'pending' then
    update orders set payment_status = 'failed' where id = v_o.id;
    if v_o.points_status = 'reserved' then
      perform fp_return_reserved(v_o.id, 'REDEEM_RELEASE');
    end if;
  end if;
  select * into v_o from orders where id = v_o.id;
  return jsonb_build_object('order_number', v_o.order_number, 'payment_status', v_o.payment_status,
                            'points_status', v_o.points_status);
end;
$$;

-- Job: unpaid orders whose hold ran out — payment failed, points released.
create or replace function public.release_expired_point_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_r     record;
  v_count integer := 0;
begin
  for v_r in
    select o.order_number
      from funda_point_reservations r
      join orders o on o.id = r.order_id
     where r.status = 'reserved' and r.hold_until < now() and o.payment_status = 'pending'
  loop
    perform fail_order_payment(v_r.order_number);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- Job: writes off expired remainders (the balance is right without it —
-- expired lots never count). Each lot expires once.
create or replace function public.expire_funda_points()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_l     record;
  v_lot   funda_point_lots%rowtype;
  v_acc   funda_point_accounts%rowtype;
  v_tx    bigint;
  v_count integer := 0;
begin
  for v_l in
    select id, auth_user_id from funda_point_lots
     where remaining > 0 and expires_at <= now()
     order by auth_user_id, expires_at
  loop
    v_acc := fp_lock_account(v_l.auth_user_id);
    select * into v_lot from funda_point_lots where id = v_l.id for update;
    continue when v_lot.remaining <= 0 or v_lot.expires_at > now();
    insert into funda_point_transactions (auth_user_id, type, points, lot_id, business_key, available_after, debt_after)
    values (v_lot.auth_user_id, 'EXPIRE', -v_lot.remaining, v_lot.id, 'lot:' || v_lot.id || ':EXPIRE',
            fp_available(v_lot.auth_user_id), v_acc.debt)
    returning id into v_tx;
    insert into funda_point_lot_movements (transaction_id, lot_id, points) values (v_tx, v_lot.id, -v_lot.remaining);
    update funda_point_lots set remaining = 0 where id = v_lot.id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Merkez correction: + creates a lot (1 year, settles debt first), − takes
-- FEFO and never more than the spendable balance. Idempotent per request.
-- ---------------------------------------------------------------------------
create or replace function public.adjust_funda_points(
  p_user_id       uuid,
  p_direction     text,
  p_points        integer,
  p_reason        text,
  p_actor_account text,
  p_actor_name    text,
  p_request_id    text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key    text := 'admin:' || coalesce(p_request_id, '');
  v_reason text := btrim(coalesce(p_reason, ''));
  v_acc    funda_point_accounts%rowtype;
  v_avail  integer;
  v_tx     bigint;
begin
  if p_actor_account is distinct from 'merkez' or nullif(btrim(coalesce(p_actor_name, '')), '') is null then
    raise exception 'forbidden';
  end if;
  if nullif(btrim(coalesce(p_request_id, '')), '') is null or length(p_request_id) > 80 then
    raise exception 'missing_request_id';
  end if;
  if p_direction not in ('add', 'subtract') or p_points is null or p_points <= 0 or p_points > 1000000 then
    raise exception 'invalid_points';
  end if;
  if length(v_reason) < 3 or length(v_reason) > 300 then
    raise exception 'reason_required';
  end if;
  if not exists (select 1 from customer_profiles where auth_user_id = p_user_id) then
    raise exception 'member_not_found';
  end if;

  v_acc := fp_lock_account(p_user_id);
  if exists (select 1 from funda_point_transactions where business_key = v_key) then
    return get_funda_points_admin_detail(p_user_id, 100);
  end if;

  if p_direction = 'add' then
    perform fp_credit_new_lot(p_user_id, p_points, 'admin', null, 'ADMIN_ADD', v_key, v_reason, p_actor_account, p_actor_name);
  else
    v_avail := fp_available(p_user_id);
    if p_points > v_avail then
      raise exception 'insufficient_points';
    end if;
    insert into funda_point_transactions (auth_user_id, type, points, business_key, available_after, debt_after,
                                          reason, actor_account, actor_name)
    values (p_user_id, 'ADMIN_SUBTRACT', -p_points, v_key, v_avail - p_points, v_acc.debt,
            v_reason, p_actor_account, p_actor_name)
    returning id into v_tx;
    if fp_take_fefo(p_user_id, p_points, v_tx) <> p_points then
      raise exception 'funda_points_internal_subtract';
    end if;
  end if;
  return get_funda_points_admin_detail(p_user_id, 100);
end;
$$;

-- ---------------------------------------------------------------------------
-- reads
-- ---------------------------------------------------------------------------

-- The member's own view: spendable balance, debt, lots with expiry, history.
-- Never the admin's name or reason text.
create or replace function public.get_funda_points_summary(p_user_id uuid, p_limit int default 50)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'available', fp_available(p_user_id),
    'debt', coalesce((select debt from funda_point_accounts where auth_user_id = p_user_id), 0),
    'lots', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.id, 'source', l.source, 'points', l.points, 'remaining', l.remaining,
        'earned_at', l.earned_at, 'expires_at', l.expires_at,
        'order_number', (select o.order_number from orders o where o.id = l.source_order_id))
        order by l.expires_at, l.earned_at, l.id)
      from funda_point_lots l
      where l.auth_user_id = p_user_id and l.remaining > 0 and l.expires_at > now()), '[]'::jsonb),
    'transactions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'type', t.type, 'points', t.points, 'expired_points', t.expired_points,
        'order_number', (select o.order_number from orders o where o.id = t.order_id),
        'available_after', t.available_after, 'debt_after', t.debt_after, 'created_at', t.created_at)
        order by t.created_at desc, t.id desc)
      from (select * from funda_point_transactions
             where auth_user_id = p_user_id
             order by created_at desc, id desc
             limit least(greatest(coalesce(p_limit, 50), 1), 200)) t), '[]'::jsonb)
  )
  where p_user_id is not null;
$$;

create or replace function public.get_funda_points_admin_detail(p_user_id uuid, p_limit int default 100)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'user_id', p_user_id,
    'full_name', p.full_name, 'email', p.email, 'phone', p.phone,
    'available', fp_available(p_user_id),
    'debt', coalesce((select debt from funda_point_accounts where auth_user_id = p_user_id), 0),
    'lots', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.id, 'source', l.source, 'points', l.points, 'remaining', l.remaining,
        'earned_at', l.earned_at, 'expires_at', l.expires_at,
        'order_number', (select o.order_number from orders o where o.id = l.source_order_id))
        order by l.expires_at, l.earned_at, l.id)
      from funda_point_lots l
      where l.auth_user_id = p_user_id and l.remaining > 0 and l.expires_at > now()), '[]'::jsonb),
    'transactions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'type', t.type, 'points', t.points, 'expired_points', t.expired_points,
        'order_number', (select o.order_number from orders o where o.id = t.order_id),
        'available_after', t.available_after, 'debt_after', t.debt_after,
        'reason', t.reason, 'actor_account', t.actor_account, 'actor_name', t.actor_name,
        'created_at', t.created_at)
        order by t.created_at desc, t.id desc)
      from (select * from funda_point_transactions
             where auth_user_id = p_user_id
             order by created_at desc, id desc
             limit least(greatest(coalesce(p_limit, 100), 1), 500)) t), '[]'::jsonb)
  )
  from customer_profiles p
  where p.auth_user_id = p_user_id;
$$;

-- Merkez list: members with any point activity (or matching the search).
create or replace function public.list_funda_point_accounts(
  p_search text default null,
  p_limit  int  default 50,
  p_offset int  default 0
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with acc as (
    select a.auth_user_id, a.debt, a.updated_at, p.full_name, p.email, p.phone,
           fp_available(a.auth_user_id) as available,
           coalesce((select sum(points) from funda_point_transactions t
                      where t.auth_user_id = a.auth_user_id and t.type in ('EARN', 'ADMIN_ADD')), 0)::int as earned,
           coalesce((select -sum(points) from funda_point_transactions t
                      where t.auth_user_id = a.auth_user_id and t.type = 'REDEEM'), 0)::int
         - coalesce((select sum(points) from funda_point_transactions t
                      where t.auth_user_id = a.auth_user_id and t.type in ('REDEEM_RELEASE', 'REFUND')), 0)::int as spent,
           (select max(created_at) from funda_point_transactions t where t.auth_user_id = a.auth_user_id) as last_activity
      from funda_point_accounts a
      join customer_profiles p on p.auth_user_id = a.auth_user_id
     where nullif(btrim(coalesce(p_search, '')), '') is null
        or p.full_name ilike '%' || p_search || '%'
        or p.email ilike '%' || p_search || '%'
        or p.phone ilike '%' || p_search || '%'
  )
  select jsonb_build_object(
    'total', (select count(*) from acc),
    'overview', jsonb_build_object(
      'available', (select coalesce(sum(available), 0) from acc),
      'debt', (select coalesce(sum(debt), 0) from acc),
      'earned', (select coalesce(sum(earned), 0) from acc),
      'spent', (select coalesce(sum(spent), 0) from acc),
      'members_with_points', (select count(*) from acc where available > 0)),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', auth_user_id, 'full_name', full_name, 'email', email, 'phone', phone,
        'available', available, 'debt', debt, 'earned', earned, 'spent', spent,
        'last_activity', coalesce(last_activity, updated_at))
        order by coalesce(last_activity, updated_at) desc, auth_user_id)
      from (select * from acc
             order by coalesce(last_activity, updated_at) desc, auth_user_id
             limit least(greatest(coalesce(p_limit, 50), 1), 200)
             offset greatest(coalesce(p_offset, 0), 0)) page), '[]'::jsonb)
  );
$$;

-- ---------------------------------------------------------------------------
-- create_order (v7) — v6 (0010) + points: the server's points_redeemed is
-- reserved in the same transaction (or the order isn't created). Demo orders
-- can't carry points; create_order still writes demo orders only (D8).
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
  v_points            integer := coalesce((p_payload->>'points_redeemed')::integer, 0);
  v_is_demo           boolean := coalesce(p_payload->>'is_demo', 'true') = 'true';
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
  if not v_is_demo then
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

  -- D24: a member order belongs to an existing member profile
  if v_customer_user_id is not null
     and not exists (select 1 from customer_profiles where auth_user_id = v_customer_user_id) then
    raise exception 'invalid_customer_account';
  end if;

  -- Funda Puan (D33, D36): members only, never on a demo order, products only
  if v_points < 0 then
    raise exception 'invalid_points';
  end if;
  if v_points > 0 then
    if v_is_demo then
      raise exception 'points_not_allowed_for_demo';
    end if;
    if v_customer_user_id is null then
      raise exception 'points_require_member';
    end if;
    if v_points > floor(v_subtotal - v_discount) then
      raise exception 'points_exceed_products';
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
     or v_total <> v_subtotal - v_discount - v_points + v_delivery_fee then
    raise exception 'amount_mismatch';
  end if;

  -- D5 / D20: stored prices must match exactly
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

  select id into v_branch_id
  from branches where slug = v_branch_slug and is_active = true;
  if v_branch_id is null then
    raise exception 'invalid_branch';
  end if;

  -- D15 fee + D14 minimum: 500 TL on products − discount, BEFORE points (D35).
  -- Keep 500 in step with MIN_DELIVERY_ORDER_TL in src/lib/order-rules.ts.
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
        payment_status, is_demo, points_redeemed, points_status
      ) values (
        v_order_number, v_client_request_id, v_customer_id, v_customer_user_id, v_delivery_type,
        v_branch_id, v_address_id, v_zone_id, v_sales_channel,
        v_delivery_date,
        p_payload#>>'{delivery,time_slot}',
        v_subtotal, v_delivery_fee, v_discount, v_total,
        nullif(p_payload->>'order_note', ''),
        'pending',
        v_is_demo,
        v_points,
        case when v_points > 0 then 'reserved' else 'none' end
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

  -- reserve the points with the order (insufficient -> nothing is written)
  if v_points > 0 then
    perform fp_reserve_for_order(v_order_id, v_customer_user_id, v_points, interval '30 minutes');
  end if;

  return get_order_public(v_order_number);
end;
$$;

-- ---------------------------------------------------------------------------
-- update_order_status (v2) — v1 (0007) + Funda Puan on cancel
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

  -- D38, D39: a cancelled order gives its spent points back and takes its earned points back
  if p_to_status = 'cancelled' then
    perform fp_on_order_cancelled(v_order.id);
  end if;

  return public.list_orders(null, null, null, 1, 0, p_order_number)->'rows'->0;
end;
$$;

-- ---------------------------------------------------------------------------
-- grants — internal helpers: nobody through the API; RPCs: service role only
-- ---------------------------------------------------------------------------
revoke all on function public.funda_points_append_only() from public, anon, authenticated;
revoke all on function public.fp_lock_account(uuid) from public, anon, authenticated;
revoke all on function public.fp_available(uuid) from public, anon, authenticated;
revoke all on function public.fp_take_from_lot(uuid, integer, bigint) from public, anon, authenticated;
revoke all on function public.fp_take_fefo(uuid, integer, bigint) from public, anon, authenticated;
revoke all on function public.fp_settle_debt(uuid, bigint, integer) from public, anon, authenticated;
revoke all on function public.fp_credit_new_lot(uuid, integer, text, uuid, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.fp_reserve_for_order(uuid, uuid, integer, interval) from public, anon, authenticated;
revoke all on function public.fp_return_reserved(uuid, text) from public, anon, authenticated;
revoke all on function public.fp_earn_for_order(uuid) from public, anon, authenticated;
revoke all on function public.fp_reverse_earn(uuid) from public, anon, authenticated;
revoke all on function public.fp_on_order_cancelled(uuid) from public, anon, authenticated;

revoke all on function public.create_order(jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb) to service_role;
revoke all on function public.update_order_status(text, text, text[], text, text, text) from public, anon, authenticated;
grant execute on function public.update_order_status(text, text, text[], text, text, text) to service_role;
revoke all on function public.complete_order_payment(text, text, text) from public, anon, authenticated;
grant execute on function public.complete_order_payment(text, text, text) to service_role;
revoke all on function public.fail_order_payment(text) from public, anon, authenticated;
grant execute on function public.fail_order_payment(text) to service_role;
revoke all on function public.release_expired_point_reservations() from public, anon, authenticated;
grant execute on function public.release_expired_point_reservations() to service_role;
revoke all on function public.expire_funda_points() from public, anon, authenticated;
grant execute on function public.expire_funda_points() to service_role;
revoke all on function public.adjust_funda_points(uuid, text, integer, text, text, text, text) from public, anon, authenticated;
grant execute on function public.adjust_funda_points(uuid, text, integer, text, text, text, text) to service_role;
revoke all on function public.get_funda_points_summary(uuid, int) from public, anon, authenticated;
grant execute on function public.get_funda_points_summary(uuid, int) to service_role;
revoke all on function public.get_funda_points_admin_detail(uuid, int) from public, anon, authenticated;
grant execute on function public.get_funda_points_admin_detail(uuid, int) to service_role;
revoke all on function public.list_funda_point_accounts(text, int, int) from public, anon, authenticated;
grant execute on function public.list_funda_point_accounts(text, int, int) to service_role;
