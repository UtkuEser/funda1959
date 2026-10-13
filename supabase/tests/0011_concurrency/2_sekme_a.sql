-- Funda Puan eşzamanlılık testi (0011) — 2/5 SEKME A. Çalıştır ve HEMEN (20 sn içinde) Sekme B'yi çalıştır.
-- Sipariş FPC-TEST-A için 80 puan ayırmayı dener (create_order ile aynı adımlar:
-- sipariş + hesap kilidi + ayırma tek işlemde). Ayıramazsa siparişi de yazılmaz.
do $$
declare
  v_harf  text := 'A';
  v_tut   int  := 20;  -- ayırdıktan sonra kilidi kaç saniye tutsun
  u uuid; c uuid; b uuid; o uuid;
  t0 timestamptz; t1 timestamptz; r text;
begin
  if (select name from app_environment) is distinct from 'test' then
    raise exception 'DUR: bu betik yalnızca funda1959-test içindir';
  end if;
  select id into u from auth.users where email = 'fpc-eszamanlilik@example.invalid';
  select id into c from customers where email = 'fpc-eszamanlilik@example.invalid';
  select id into b from branches where slug = 'gop';
  if u is null or c is null then
    raise exception 'DUR: önce 1_kurulum.sql';
  end if;
  t0 := clock_timestamp();
  begin
    insert into orders (order_number, customer_id, customer_user_id, delivery_type, branch_id,
                        delivery_date, delivery_time_slot, subtotal, delivery_fee, discount, total,
                        payment_status, is_demo, sales_channel, points_redeemed, points_status)
    values ('FPC-TEST-' || v_harf, c, u, 'pickup', b, current_date + 1, '16:00 – 17:00',
            500, 0, 0, 420, 'pending', false, 'web', 80, 'reserved')
    returning id into o;
    perform fp_lock_account(u);   -- diğer sekme puan ayırıyorsa burada bekler
    t1 := clock_timestamp();
    perform fp_reserve_for_order(o, u, 80, interval '30 minutes');
    r := 'ayirdi_80';
    perform pg_sleep(v_tut);
  exception when others then
    r := sqlerrm;                 -- sipariş ve ayırma geri alınır
  end;
  perform set_config('fpc.sonuc', r, false);
  perform set_config('fpc.bekleme', round(extract(epoch from coalesce(t1, clock_timestamp()) - t0)::numeric, 1)::text, false);
end $$;
-- beklenen: sonuc = ayirdi_80
select 'A' as sekme, current_setting('fpc.sonuc') as sonuc,
       current_setting('fpc.bekleme') as kilit_bekleme_sn,
       case when current_setting('fpc.sonuc') = 'ayirdi_80' then 'A tamam — Sekme B sonucuna bak'
            when current_setting('fpc.sonuc') = 'insufficient_points'
              then 'A puan ayıramadı: B önce çalışmış — 5, 1, 2, 3 sırasıyla yeniden'
            else 'BEKLENMEYEN: ' || current_setting('fpc.sonuc') end as karar;
