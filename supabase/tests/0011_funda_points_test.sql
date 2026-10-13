-- Funda 1959 — Funda Puan (0011) rule tests.
-- Runs inside ONE transaction and ROLLS BACK at the end: nothing it creates
-- (test users, orders, points) is kept. Paste into the SQL Editor of the
-- TEST project only (funda1959-test), after 0011 is applied. Every check
-- raises "FAIL: …" and stops on the first failure; "ok …" lines are notices.
-- Single session: true concurrency (two sessions at once) is checked
-- separately (SUPABASE_PLAN.md §7.6, Aşama 6).

begin;

-- ---------------------------------------------------------------- helpers
create temp table t_ids (name text primary key, id uuid not null) on commit drop;

create function pg_temp.ok(p_cond boolean, p_label text) returns void language plpgsql as $$
begin
  if p_cond is distinct from true then
    raise exception 'FAIL: %', p_label;
  end if;
  raise notice 'ok  %', p_label;
end $$;

create function pg_temp.raises(p_sql text, p_expected text, p_label text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if sqlerrm = p_expected then
      raise notice 'ok  % (%)', p_label, p_expected;
      return;
    end if;
    raise exception 'FAIL: % — expected %, got %', p_label, p_expected, sqlerrm;
  end;
  raise exception 'FAIL: % — expected %, got no error', p_label, p_expected;
end $$;

create function pg_temp.id(p_name text) returns uuid language sql as $$
  select id from t_ids where name = p_name
$$;

create function pg_temp.member(p_name text) returns uuid language plpgsql as $$
declare v uuid := gen_random_uuid();
begin
  insert into auth.users (id, email) values (v, 'fp-test-' || p_name || '-' || substr(v::text, 1, 8) || '@example.invalid');
  insert into customer_profiles (auth_user_id, full_name, phone, email)
  values (v, 'Puan Test ' || p_name, '0555 000 00 00', 'fp-test-' || p_name || '@example.invalid');
  insert into t_ids values (p_name, v);
  return v;
end $$;

-- a NON-demo order inserted directly (create_order writes demo orders only
-- until the payment integration); points are reserved like create_order does
create function pg_temp.order_(p_name text, p_user uuid, p_subtotal numeric, p_discount numeric, p_points int,
                               p_fee numeric default 0, p_channel text default 'web') returns uuid language plpgsql as $$
declare v_c uuid; v_o uuid; v_b uuid;
begin
  select id into v_b from branches where slug = 'gop';
  insert into customers (full_name, phone, email) values ('Puan Test', '05550000000', 'fp@example.invalid') returning id into v_c;
  insert into orders (order_number, customer_id, customer_user_id, delivery_type, branch_id, delivery_zone_id,
                      delivery_date, delivery_time_slot, subtotal, delivery_fee, discount, total,
                      payment_status, is_demo, sales_channel, points_redeemed, points_status)
  values ('FPT-' || p_name || '-' || substr(md5(gen_random_uuid()::text), 1, 6), v_c, p_user,
          case when p_fee > 0 then 'delivery' else 'pickup' end, v_b,
          case when p_fee > 0 then 'zone-gop-cankaya' end,
          current_date + 1, '16:00 – 17:00', p_subtotal, p_fee, p_discount, p_subtotal - p_discount - p_points + p_fee,
          'pending', false, p_channel, p_points, case when p_points > 0 then 'reserved' else 'none' end)
  returning id into v_o;
  if p_points > 0 then
    perform fp_reserve_for_order(v_o, p_user, p_points, interval '30 minutes');
  end if;
  insert into t_ids values (p_name, v_o);
  return v_o;
end $$;

create function pg_temp.no(p_order uuid) returns text language sql as $$
  select order_number from orders where id = p_order
$$;
create function pg_temp.pay(p_order uuid) returns jsonb language sql as $$
  select complete_order_payment(pg_temp.no(p_order), 'card', 'test-ref')
$$;
create function pg_temp.cancel(p_order uuid) returns jsonb language sql as $$
  select update_order_status(pg_temp.no(p_order), 'cancelled', null, 'merkez', 'Merkez Yönetim', 'Puan testi iptali')
$$;
create function pg_temp.add(p_user uuid, p_points int) returns jsonb language sql as $$
  select adjust_funda_points(p_user, 'add', p_points, 'Test yüklemesi', 'merkez', 'Merkez Yönetim', gen_random_uuid()::text)
$$;
create function pg_temp.avail(p_user uuid) returns int language sql as $$ select fp_available(p_user) $$;
create function pg_temp.debt(p_user uuid) returns int language sql as $$
  select coalesce((select debt from funda_point_accounts where auth_user_id = p_user), 0)
$$;

-- ---------------------------------------------------------------- 1. earning
do $$
declare u uuid := pg_temp.member('earn'); o uuid; r jsonb;
begin
  perform pg_temp.add(u, 200);
  o := pg_temp.order_('earn1', u, 1000, 0, 200);
  perform pg_temp.ok(pg_temp.avail(u) = 0, 'earn: 200 points reserved at order creation');
  r := pg_temp.pay(o);
  perform pg_temp.ok((r->>'points_earned')::int = 80, 'earn: 1.000 TL products, 200 points used -> 80 earned (10% of 800)');
  perform pg_temp.ok(pg_temp.avail(u) = 80, 'earn: earned points spendable right after payment');

  o := pg_temp.order_('earn2', u, 785, 0, 0);
  perform pg_temp.ok((pg_temp.pay(o)->>'points_earned')::int = 78, 'earn: 785 TL -> 78 (floor)');
  o := pg_temp.order_('earn3', u, 1000, 200, 0);
  perform pg_temp.ok((pg_temp.pay(o)->>'points_earned')::int = 80, 'earn: 1.000 TL − 200 TL discount -> 80');
  o := pg_temp.order_('earn4', u, 598.80, 0, 0);
  perform pg_temp.ok((pg_temp.pay(o)->>'points_earned')::int = 59, 'earn: 598,80 TL -> 59 (exact decimal, floor)');
  o := pg_temp.order_('earn5', u, 1000, 0, 0, 70);
  perform pg_temp.ok((pg_temp.pay(o)->>'points_earned')::int = 100, 'earn: delivery fee 70 TL does not count');
  o := pg_temp.order_('earn6', u, 1000, 0, 0, 0, 'store');
  perform pg_temp.ok((pg_temp.pay(o)->>'points_earned')::int = 0, 'earn: store channel earns nothing');
  o := pg_temp.order_('earn7', null, 1000, 0, 0);
  perform pg_temp.ok((pg_temp.pay(o)->>'points_earned')::int = 0, 'earn: guest order earns nothing');

  perform pg_temp.ok(
    (select bool_and(expires_at = earned_at + interval '1 year') from funda_point_lots where auth_user_id = u),
    'expiry: every lot is valid exactly 1 year from when it was earned');
  perform pg_temp.ok((select count(*) from funda_point_lots where auth_user_id = u and source = 'earn') = 5,
    'earn: each paid order is its own lot');
end $$;

-- ---------------------------------------------------------------- 2. FEFO + release
do $$
declare u uuid := pg_temp.member('fefo'); a uuid; b uuid; o uuid;
begin
  perform pg_temp.add(u, 100);
  perform pg_temp.add(u, 50);
  select id into a from funda_point_lots where auth_user_id = u and points = 100;
  select id into b from funda_point_lots where auth_user_id = u and points = 50;
  -- the newer lot expires first
  update funda_point_lots set earned_at = now() - interval '360 days', expires_at = now() + interval '5 days' where id = b;
  update funda_point_lots set earned_at = now() - interval '10 days', expires_at = now() + interval '355 days' where id = a;
  o := pg_temp.order_('fefo1', u, 500, 0, 120);
  perform pg_temp.ok((select remaining from funda_point_lots where id = b) = 0
                 and (select remaining from funda_point_lots where id = a) = 30,
    'FEFO: 120 points take the lot expiring first (50) then the next (70)');
  perform pg_temp.cancel(o);
  perform pg_temp.ok((select remaining from funda_point_lots where id = b) = 50
                 and (select remaining from funda_point_lots where id = a) = 100,
    'cancel before payment: points released back into the same lots');
  perform pg_temp.ok((select expires_at from funda_point_lots where id = b) < now() + interval '6 days',
    'cancel before payment: returned points keep their original expiry');
  perform pg_temp.ok((select status from funda_point_reservations where order_id = o) = 'released'
                 and (select points_status from orders where id = o) = 'released',
    'cancel before payment: reservation and order marked released');
end $$;

-- ---------------------------------------------------------------- 3. double spend
do $$
declare u uuid := pg_temp.member('double'); o uuid;
begin
  perform pg_temp.add(u, 100);
  o := pg_temp.order_('dbl1', u, 500, 0, 80);
  perform pg_temp.raises(
    format('select pg_temp.order_(%L, %L::uuid, 500, 0, 80)', 'dbl2', u),
    'insufficient_points', 'double spend: a second order cannot spend the same 80 points');
  perform pg_temp.ok(pg_temp.avail(u) = 20, 'double spend: 20 points left, nothing written for the refused order');
  perform pg_temp.ok((select count(*) from funda_point_reservations where auth_user_id = u) = 1,
    'double spend: only one reservation exists');
end $$;

-- ---------------------------------------------------------------- 4. refund after payment, expired lot
do $$
declare u uuid := pg_temp.member('expired'); x uuid; o uuid; t record;
begin
  perform pg_temp.add(u, 100);
  select id into x from funda_point_lots where auth_user_id = u;
  o := pg_temp.order_('exp1', u, 100, 0, 60);                -- pays 40 TL, earns 4
  perform pg_temp.pay(o);
  perform pg_temp.ok((select points_status from orders where id = o) = 'captured', 'payment: reserved points captured');
  -- the lot expires before the cancellation
  update funda_point_lots set earned_at = now() - interval '2 years', expires_at = now() - interval '1 minute' where id = x;
  perform pg_temp.cancel(o);
  select * into t from funda_point_transactions where order_id = o and type = 'REFUND';
  perform pg_temp.ok(t.points = 0 and t.expired_points = 60, 'refund: points of an expired lot do not come back (recorded as expired)');
  perform pg_temp.ok(pg_temp.avail(u) = 0, 'refund: expired points are not spendable again (the 4 earned are taken back)');
  perform pg_temp.ok((select remaining from funda_point_lots where id = x) = 40, 'refund: the expired lot is not refilled');
end $$;

-- ---------------------------------------------------------------- 5. reversal, debt, settlement
do $$
declare u uuid := pg_temp.member('debt'); o1 uuid; o2 uuid; o3 uuid; t record;
begin
  o1 := pg_temp.order_('debt1', u, 1000, 0, 0);
  perform pg_temp.pay(o1);                                   -- earns 100
  o2 := pg_temp.order_('debt2', u, 300, 0, 100);             -- spends those 100
  perform pg_temp.pay(o2);                                   -- earns 20 (10% of 200)
  perform pg_temp.ok(pg_temp.avail(u) = 20, 'debt setup: 20 points left');
  perform pg_temp.cancel(o1);                                -- takes back 100: 20 available, 80 owed
  select * into t from funda_point_transactions where order_id = o1 and type = 'REVERSAL';
  perform pg_temp.ok(t.points = -100 and t.available_after = 0 and t.debt_after = 80,
    'reversal: earned points taken back; what was spent becomes debt (balance −80)');
  perform pg_temp.ok(pg_temp.avail(u) = 0 and pg_temp.debt(u) = 80, 'reversal: spendable balance never below zero');
  perform pg_temp.raises(format('select pg_temp.order_(%L, %L::uuid, 300, 0, 1)', 'debt-x', u),
    'insufficient_points', 'debt: nothing can be spent while in debt');
  perform pg_temp.add(u, 50);
  perform pg_temp.ok(pg_temp.avail(u) = 0 and pg_temp.debt(u) = 30, 'debt: a Merkez addition pays the debt first (80 − 50)');
  select * into t from funda_point_transactions where auth_user_id = u and type = 'ADMIN_ADD';
  perform pg_temp.ok(t.points = 50 and t.available_after = 0 and t.debt_after = 30,
    'debt: the addition shows +50 with the debt it paid (net balance −30)');
  o3 := pg_temp.order_('debt3', u, 1000, 0, 0);
  perform pg_temp.pay(o3);                                   -- earns 100: 30 settle the debt
  perform pg_temp.ok(pg_temp.avail(u) = 70 and pg_temp.debt(u) = 0, 'debt: a later earning closes the debt (100 − 30 = 70 spendable)');
end $$;

-- ---------------------------------------------------------------- 6. refund after payment + reversal of own earning
do $$
declare u uuid := pg_temp.member('refund'); o uuid;
begin
  perform pg_temp.add(u, 200);
  o := pg_temp.order_('ref1', u, 1000, 0, 200);
  perform pg_temp.pay(o);                                    -- earns 80
  perform pg_temp.ok(pg_temp.avail(u) = 80, 'refund setup: 0 left + 80 earned');
  perform pg_temp.cancel(o);
  perform pg_temp.ok(pg_temp.avail(u) = 200 and pg_temp.debt(u) = 0,
    'cancel after payment: 200 spent points back, 80 earned points taken back');
  perform pg_temp.ok((select points_status from orders where id = o) = 'refunded', 'cancel after payment: order points refunded');
end $$;

-- ---------------------------------------------------------------- 7. idempotency
do $$
declare u uuid := pg_temp.member('idem'); o uuid; rid text := gen_random_uuid()::text; n int;
begin
  o := pg_temp.order_('idem1', u, 500, 0, 0);
  perform pg_temp.pay(o);
  perform pg_temp.pay(o);
  perform pg_temp.ok((select count(*) from funda_point_transactions where order_id = o and type = 'EARN') = 1,
    'idempotent: paying twice earns once');
  perform pg_temp.ok(fp_earn_for_order(o) = 50 and (select count(*) from funda_point_lots where source_order_id = o) = 1,
    'idempotent: earning again for the same order writes nothing');
  perform adjust_funda_points(u, 'add', 10, 'Tekrar testi', 'merkez', 'Merkez Yönetim', rid);
  perform adjust_funda_points(u, 'add', 10, 'Tekrar testi', 'merkez', 'Merkez Yönetim', rid);
  perform pg_temp.ok((select count(*) from funda_point_transactions where auth_user_id = u and type = 'ADMIN_ADD') = 1,
    'idempotent: a repeated Merkez correction (same request id) is applied once');
  perform pg_temp.cancel(o);
  perform fp_reverse_earn(o);
  perform fp_on_order_cancelled(o);
  perform pg_temp.ok((select count(*) from funda_point_transactions where order_id = o and type = 'REVERSAL') = 1,
    'idempotent: reversing twice takes back once');
  select count(*) into n from funda_point_lots where auth_user_id = u and remaining > 0;
  update funda_point_lots set earned_at = now() - interval '2 years', expires_at = now() - interval '1 day'
   where auth_user_id = u and remaining > 0;
  perform expire_funda_points();
  perform expire_funda_points();
  perform pg_temp.ok(n = 1 and (select count(*) from funda_point_transactions where auth_user_id = u and type = 'EXPIRE') = n,
    'idempotent: the expiry job writes each expired lot off once');
  perform pg_temp.ok((select remaining from funda_point_lots where auth_user_id = u and source = 'admin') = 0,
    'expiry: the expired lot''s remainder is written off');
  perform pg_temp.ok(pg_temp.avail(u) = 0, 'expiry: nothing spendable after expiry');
end $$;

-- ---------------------------------------------------------------- 8. payment failure, hold expiry, points-only
do $$
declare u uuid := pg_temp.member('pay'); o uuid; r jsonb; n int;
begin
  perform pg_temp.add(u, 300);
  o := pg_temp.order_('fail1', u, 500, 0, 100);
  r := fail_order_payment(pg_temp.no(o));
  perform pg_temp.ok(r->>'payment_status' = 'failed' and r->>'points_status' = 'released' and pg_temp.avail(u) = 300,
    'payment failed: points released');
  perform pg_temp.raises(format('select complete_order_payment(%L, %L)', pg_temp.no(o), 'card'),
    'payment_not_pending', 'payment failed: the order can no longer be paid');

  o := pg_temp.order_('hold1', u, 500, 0, 100);
  update funda_point_reservations set hold_until = now() - interval '1 minute' where order_id = o;
  n := release_expired_point_reservations();                -- separate step: evaluation order inside one expression is not guaranteed
  perform pg_temp.ok(n = 1 and pg_temp.avail(u) = 300
                 and (select payment_status || '/' || points_status from orders where id = o) = 'failed/released',
    'hold expired: the job releases the points and fails the payment');

  o := pg_temp.order_('only1', u, 120, 0, 120);
  perform pg_temp.raises(format('select complete_order_payment(%L, %L)', pg_temp.no(o), 'card'),
    'nothing_to_pay', 'points-only: a card payment of 0 TL is refused');
  r := complete_order_payment(pg_temp.no(o), 'funda_points');
  perform pg_temp.ok(r->>'payment_status' = 'paid' and (r->>'points_earned')::int = 0,
    'points-only: whole product amount paid with points completes on the server, earns nothing');
  o := pg_temp.order_('only2', u, 100, 0, 50);
  perform pg_temp.raises(format('select complete_order_payment(%L, %L)', pg_temp.no(o), 'funda_points'),
    'points_only_requires_zero_total', 'points-only: refused while something is left to pay');
end $$;

-- ---------------------------------------------------------------- 9. demo orders, limits, admin rights
do $$
declare u uuid := pg_temp.member('guards'); o uuid; v_demo uuid; payload jsonb;
  -- the price the project sells p5 at right now (Merkez may have stored one)
  v_price numeric := coalesce((select price from product_prices where product_id = 'p5' and variant_key = ''), 45);
begin
  perform pg_temp.add(u, 500);
  payload := jsonb_build_object(
    'client_request_id', 'fp-test-' || gen_random_uuid(), 'is_demo', true, 'customer_user_id', u,
    'customer', jsonb_build_object('full_name', 'Puan Test', 'phone', '05550000000', 'email', 'fp@example.invalid'),
    'delivery', jsonb_build_object('type', 'pickup', 'branch_slug', 'gop', 'date', to_char(current_date + 1, 'YYYY-MM-DD'), 'time_slot', '16:00 – 17:00'),
    'items', jsonb_build_array(jsonb_build_object('product_id', 'p5', 'product_slug', 'cikolatali-macaron', 'product_name', 'Macaron',
                                                  'quantity', 2, 'unit_price', v_price, 'total_price', 2 * v_price)),
    'subtotal', 2 * v_price, 'delivery_fee', 0, 'discount', 0, 'total', 2 * v_price - 50, 'points_redeemed', 50);
  perform pg_temp.raises(format('select create_order(%L::jsonb)', payload),
    'points_not_allowed_for_demo', 'demo: a demo order cannot spend points');
  perform pg_temp.ok(pg_temp.avail(u) = 500, 'demo: the refused order took nothing');
  payload := payload || jsonb_build_object('total', 2 * v_price, 'points_redeemed', 0);
  perform create_order(payload);
  select id into v_demo from orders where client_request_id = payload->>'client_request_id';
  perform pg_temp.raises(format('select complete_order_payment(%L, %L)', pg_temp.no(v_demo), 'card'),
    'demo_order_cannot_be_paid', 'demo: a demo order can never be paid');
  perform pg_temp.ok(fp_earn_for_order(v_demo) = 0, 'demo: a demo order earns nothing');
  perform pg_temp.raises(format('update orders set points_earned = 1 where id = %L', v_demo),
    'new row for relation "orders" violates check constraint "orders_points_never_demo"', 'demo: the table refuses points on a demo order');

  perform pg_temp.raises(format('select pg_temp.order_(%L, %L::uuid, 100, 0, 101)', 'over', u),
    'new row for relation "orders" violates check constraint "orders_points_within_products"', 'limits: points cannot exceed the product amount');
  perform pg_temp.raises(format('select pg_temp.order_(%L, null, 100, 0, 10)', 'guestpts'),
    'new row for relation "orders" violates check constraint "orders_points_member_only"', 'limits: a guest order cannot carry points');
  perform pg_temp.raises(format('select adjust_funda_points(%L::uuid, %L, 10, %L, %L, %L, %L)', u, 'add', 'Şube denemesi', 'sube:gop', 'GOP', gen_random_uuid()),
    'forbidden', 'admin: a branch account cannot correct points');
  perform pg_temp.raises(format('select adjust_funda_points(%L::uuid, %L, 10, %L, %L, %L, %L)', u, 'add', 'x', 'merkez', 'Merkez Yönetim', gen_random_uuid()),
    'reason_required', 'admin: a correction needs a reason');
  perform pg_temp.raises(format('select adjust_funda_points(%L::uuid, %L, 501, %L, %L, %L, %L)', u, 'subtract', 'Fazla düşüş', 'merkez', 'Merkez Yönetim', gen_random_uuid()),
    'insufficient_points', 'admin: cannot subtract more than the spendable balance');
  perform adjust_funda_points(u, 'subtract', 120, 'Hatalı yükleme düzeltmesi', 'merkez', 'Merkez Yönetim', gen_random_uuid()::text);
  perform pg_temp.ok(pg_temp.avail(u) = 380
                 and (select actor_name from funda_point_transactions where auth_user_id = u and type = 'ADMIN_SUBTRACT') = 'Merkez Yönetim',
    'admin: subtraction recorded with reason and admin');
  perform pg_temp.raises(format('update funda_point_transactions set points = 1 where auth_user_id = %L', u),
    'funda_points_append_only', 'ledger: transactions cannot be edited');
end $$;

-- ---------------------------------------------------------------- 10. reads + ledger invariants
do $$
declare u uuid := pg_temp.id('fefo'); s jsonb; l jsonb;
begin
  s := get_funda_points_summary(u, 50);
  perform pg_temp.ok((s->>'available')::int = 150 and jsonb_array_length(s->'lots') = 2, 'summary: balance and spendable lots');
  perform pg_temp.ok((s->'lots'->0->>'expires_at')::timestamptz <= (s->'lots'->1->>'expires_at')::timestamptz,
    'summary: lots listed by expiry (soonest first)');
  perform pg_temp.ok(not (s::text like '%Merkez Yönetim%') and not (s::text like '%Test yüklemesi%'),
    'summary: the member never sees the admin name or reason');
  l := list_funda_point_accounts(null, 50, 0);
  perform pg_temp.ok((l->>'total')::int >= 8, 'admin list: members with point activity listed');
  perform pg_temp.ok(get_funda_points_admin_detail(u, 100)->'transactions'->0 ? 'actor_name', 'admin detail: shows who made a correction');

  perform pg_temp.ok(not exists (
    select 1 from funda_point_lots l
     where l.remaining <> coalesce((select sum(points) from funda_point_lot_movements m where m.lot_id = l.id), 0)),
    'invariant: every lot''s remaining equals the sum of its movements');
  perform pg_temp.ok(not exists (
    select 1 from funda_point_accounts a
     where coalesce((select sum(points) from funda_point_transactions t where t.auth_user_id = a.auth_user_id), 0)
        <> coalesce((select sum(remaining) from funda_point_lots l where l.auth_user_id = a.auth_user_id), 0) - a.debt),
    'invariant: ledger sum = lots remaining − debt, for every member');
  perform pg_temp.ok(not exists (select 1 from funda_point_transactions where available_after < 0)
                 and not exists (select 1 from funda_point_lots where remaining < 0),
    'invariant: no negative spendable balance anywhere');
  raise notice 'ALL FUNDA PUAN CHECKS PASSED';
end $$;

rollback;
