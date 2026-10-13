-- Funda Puan eşzamanlılık testi (0011) — 5/5 TEMİZLİK. Yalnızca bu testin kayıtlarını siler.
-- Sıra önemli: puan hesabı (lot, hareket, ayırma zincirleme) → siparişler → müşteri satırı → üye.
do $$
declare u uuid;
begin
  if (select name from app_environment) is distinct from 'test' then
    raise exception 'DUR: bu betik yalnızca funda1959-test içindir';
  end if;
  select id into u from auth.users where email = 'fpc-eszamanlilik@example.invalid';
  delete from funda_point_accounts where auth_user_id = u;
  delete from orders where order_number in ('FPC-TEST-A', 'FPC-TEST-B');
  delete from customers where email = 'fpc-eszamanlilik@example.invalid';
  delete from auth.users where id = u;  -- customer_profiles zincirleme silinir
end $$;
-- beklenen: hepsi 0, karar = TEMİZ
select (select count(*) from auth.users where email = 'fpc-eszamanlilik@example.invalid')        as uye,
       (select count(*) from customer_profiles where email = 'fpc-eszamanlilik@example.invalid') as profil,
       (select count(*) from customers where email = 'fpc-eszamanlilik@example.invalid')         as musteri,
       (select count(*) from orders where order_number in ('FPC-TEST-A', 'FPC-TEST-B'))          as siparis,
       case when not exists (select 1 from auth.users where email = 'fpc-eszamanlilik@example.invalid')
             and not exists (select 1 from customers where email = 'fpc-eszamanlilik@example.invalid')
             and not exists (select 1 from orders where order_number in ('FPC-TEST-A', 'FPC-TEST-B'))
            then 'TEMİZ' else 'KALDI' end as karar;
