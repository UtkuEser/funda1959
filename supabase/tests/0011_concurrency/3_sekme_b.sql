-- Funda Puan eşzamanlılık testi (0011) — 3/5 SEKME B. Sekme A çalışırken (ilk 20 sn içinde) çalıştır.
-- Sipariş FPC-TEST-B için 80 puan ayırmayı dener (create_order ile aynı adımlar:
-- sipariş + hesap kilidi + ayırma tek işlemde). Ayıramazsa siparişi de yazılmaz.
do $$
declare
  v_harf  text := 'B';
  v_tut   int  := 0;  -- ayırdıktan sonra kilidi kaç saniye tutsun
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
-- beklenen: sonuc = insufficient_points, kilit_bekleme_sn >= 1, karar = GEÇTİ
select 'B' as sekme, current_setting('fpc.sonuc') as sonuc,
       current_setting('fpc.bekleme') as kilit_bekleme_sn,
       case when current_setting('fpc.sonuc') = 'insufficient_points'
                 and current_setting('fpc.bekleme')::numeric >= 1
              then 'GEÇTİ: A bitene kadar bekledi, aynı puanı harcayamadı'
            when current_setting('fpc.sonuc') = 'insufficient_points'
              then 'TEKRARLA: B beklemedi (A çoktan bitmişti) — 5, 1, 2, 3 sırasıyla yeniden'
            when current_setting('fpc.sonuc') = 'ayirdi_80'
              then 'B puan ayırdı: ya A''dan önce çalıştı ya da çift harcama — 4_dogrulama.sql sonucuna bak'
            else 'BEKLENMEYEN: ' || current_setting('fpc.sonuc') end as karar;
