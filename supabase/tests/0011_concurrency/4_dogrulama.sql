-- Funda Puan eşzamanlılık testi (0011) — 4/5 DOĞRULAMA. A ve B bittikten sonra.
-- Salt okunur. Beklenen: karar = GEÇTİ (tek sipariş, tek ayırma, 20 puan kaldı).
-- Çift harcama olmadığını gösterir; iki işlemin gerçekten çakıştığını ise
-- Sekme B'nin kilit_bekleme_sn >= 1 sonucu gösterir.
with u as (select id from auth.users where email = 'fpc-eszamanlilik@example.invalid'),
s as (
  select
    (select count(*) from orders where order_number in ('FPC-TEST-A', 'FPC-TEST-B'))              as siparis,
    (select count(*) from funda_point_reservations r join u on r.auth_user_id = u.id
      where r.status = 'reserved' and r.points = 80)                                              as ayirma,
    (select count(*) from funda_point_transactions t join u on t.auth_user_id = u.id
      where t.type = 'REDEEM')                                                                    as kullanim_hareketi,
    (select fp_available(id) from u)                                                              as kullanilabilir,
    (select coalesce(sum(remaining), 0) from funda_point_lots l join u on l.auth_user_id = u.id)  as lot_kalan,
    (select coalesce(sum(points), 0) from funda_point_transactions t join u on t.auth_user_id = u.id) as hareket_toplami,
    (select min(available_after) from funda_point_transactions t join u on t.auth_user_id = u.id) as en_dusuk_bakiye,
    (select debt from funda_point_accounts a join u on a.auth_user_id = u.id)                     as borc
)
select s.*,
       case when siparis = 1 and ayirma = 1 and kullanim_hareketi = 1 and kullanilabilir = 20
                 and lot_kalan = 20 and hareket_toplami = 20 and en_dusuk_bakiye >= 0 and borc = 0
            then 'GEÇTİ' else 'KALDI' end as karar
  from s;
