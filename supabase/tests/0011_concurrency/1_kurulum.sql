-- Funda Puan eşzamanlılık testi (0011) — 1/5 KURULUM. Yalnızca funda1959-test.
-- Bu teste ait bir üye, bir müşteri satırı ve 100 puan oluşturur. Bir kez çalıştır.
do $$
declare u uuid := gen_random_uuid();
begin
  if (select name from app_environment) is distinct from 'test' then
    raise exception 'DUR: bu betik yalnızca funda1959-test içindir';
  end if;
  if exists (select 1 from auth.users where email = 'fpc-eszamanlilik@example.invalid') then
    raise exception 'DUR: önceki test kaydı duruyor — önce 5_temizlik.sql';
  end if;
  insert into auth.users (id, email) values (u, 'fpc-eszamanlilik@example.invalid');
  insert into customer_profiles (auth_user_id, full_name, phone, email)
  values (u, 'FPC Eşzamanlılık Testi', '0555 000 00 00', 'fpc-eszamanlilik@example.invalid');
  insert into customers (full_name, phone, email)
  values ('FPC Eşzamanlılık Testi', '05550000000', 'fpc-eszamanlilik@example.invalid');
  perform adjust_funda_points(u, 'add', 100, 'Eşzamanlılık testi kurulumu', 'merkez', 'Merkez Yönetim', 'fpc-kurulum-' || u);
end $$;
-- beklenen: kullanilabilir_puan = 100
select u.email, fp_available(u.id) as kullanilabilir_puan
  from auth.users u where u.email = 'fpc-eszamanlilik@example.invalid';
