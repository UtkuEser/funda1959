-- Funda 1959 — İletişim talepleri (0012) rule tests.
-- Runs inside ONE transaction and ROLLS BACK at the end: nothing it creates is
-- kept. Paste into the SQL Editor of the TEST project only (funda1959-test),
-- after 0012 is applied. Every check raises "FAIL: …" and stops on the first
-- failure; "ok …" lines are notices (the SQL Editor may not show them — no
-- error at the end means every check passed).
-- Single session: two submits at the same moment are checked separately
-- (SUPABASE_PLAN.md §8.5).

begin;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'app_environment')
     and (select name from public.app_environment limit 1) is distinct from 'test' then
    raise exception 'DUR: bu test yalnızca funda1959-test içindir';
  end if;
end $$;

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
    if sqlerrm = p_expected or (p_expected = 'check_violation' and sqlstate = '23514') then
      raise notice 'ok  % (%)', p_label, p_expected;
      return;
    end if;
    raise exception 'FAIL: % — expected %, got %', p_label, p_expected, sqlerrm;
  end;
  raise exception 'FAIL: % — expected %, got no error', p_label, p_expected;
end $$;

-- a valid payload; fields overridden per check
create function pg_temp.p(p_req text, p_key text, p_extra jsonb default '{}'::jsonb) returns jsonb language sql as $$
  select jsonb_build_object(
    'client_request_id', p_req, 'client_key', p_key,
    'full_name', 'Test Kişi', 'phone', '0555 123 45 67', 'email', null,
    'subject', 'genel', 'message', 'Merhaba, bilgi almak istiyorum.') || p_extra
$$;

create temp table t (k text primary key, v jsonb) on commit drop;

-- 1. a valid request is stored once ------------------------------------------
insert into t values ('a', public.submit_contact_request(pg_temp.p('sqltest-req-a-0001', repeat('a', 64))));
select pg_temp.ok((select (v->>'duplicate')::boolean = false and v->>'id' is not null from t where k = 'a'), 'valid request stored');
select pg_temp.ok((select status = 'new' and phone = '0555 123 45 67' and email is null and internal_note is null
                     from contact_requests where id = (select (v->>'id')::uuid from t where k = 'a')), 'stored as new, phone only, no note');

insert into t values ('a2', public.submit_contact_request(pg_temp.p('sqltest-req-a-0001', repeat('a', 64),
                                                                     '{"full_name": "Başka", "message": "farklı bir mesaj metni"}')));
select pg_temp.ok((select (v->>'duplicate')::boolean from t where k = 'a2')
                  and (select v->>'id' from t where k = 'a2') = (select v->>'id' from t where k = 'a'),
                  'same request id again -> same row, duplicate');
select pg_temp.ok((select count(*) = 1 and min(full_name) = 'Test Kişi' from contact_requests where client_request_id = 'sqltest-req-a-0001'),
                  'still one row, first content kept');

insert into t values ('e', public.submit_contact_request(pg_temp.p('sqltest-req-e-0001', repeat('b', 64),
                                                                    '{"phone": null, "email": "  Ornek@Example.COM "}')));
select pg_temp.ok((select email = 'ornek@example.com' and phone is null from contact_requests
                    where id = (select (v->>'id')::uuid from t where k = 'e')), 'e-mail only, trimmed + lower-cased');

-- 2. required fields and formats ---------------------------------------------
select pg_temp.raises($q$select public.submit_contact_request(pg_temp.p('sqltest-req-x-0001', repeat('c', 64), '{"phone": null, "email": null}'))$q$, 'contact_required', 'no phone and no e-mail');
select pg_temp.raises($q$select public.submit_contact_request(pg_temp.p('sqltest-req-x-0002', repeat('c', 64), '{"phone": "  ", "email": ""}'))$q$, 'contact_required', 'blank phone and e-mail');
select pg_temp.raises($q$select public.submit_contact_request(pg_temp.p('sqltest-req-x-0003', repeat('c', 64), '{"full_name": "A"}'))$q$, 'invalid_name', 'name too short');
select pg_temp.raises($q$select public.submit_contact_request(pg_temp.p('sqltest-req-x-0004', repeat('c', 64), '{"subject": "siparis"}'))$q$, 'invalid_subject', 'unknown subject');
select pg_temp.raises($q$select public.submit_contact_request(pg_temp.p('sqltest-req-x-0005', repeat('c', 64), '{"subject": ""}'))$q$, 'invalid_subject', 'no subject');
select pg_temp.raises($q$select public.submit_contact_request(pg_temp.p('sqltest-req-x-0006', repeat('c', 64), '{"message": "kısa mesj"}'))$q$, 'invalid_message', 'message under 10 characters');
select pg_temp.raises(format($q$select public.submit_contact_request(pg_temp.p('sqltest-req-x-0007', repeat('c', 64), %L))$q$, jsonb_build_object('message', repeat('x', 3001))), 'invalid_message', 'message over 3000 characters');
select pg_temp.raises($q$select public.submit_contact_request(pg_temp.p('sqltest-req-x-0008', repeat('c', 64), '{"email": "not-an-email"}'))$q$, 'invalid_email', 'bad e-mail');
select pg_temp.raises($q$select public.submit_contact_request(pg_temp.p('sqltest-req-x-0009', repeat('c', 64), '{"phone": "0555-ABC-1234"}'))$q$, 'invalid_phone', 'phone with letters');
select pg_temp.raises($q$select public.submit_contact_request(pg_temp.p('sqltest-req-x-0010', repeat('c', 64), '{"phone": "12345"}'))$q$, 'invalid_phone', 'phone too short');
select pg_temp.raises($q$select public.submit_contact_request(pg_temp.p('short', repeat('c', 64)))$q$, 'invalid_request_id', 'request id too short');
select pg_temp.raises($q$select public.submit_contact_request(pg_temp.p('sqltest-req-x-0011', '1.2.3.4'))$q$, 'invalid_client_key', 'a raw address is not a key');
select pg_temp.ok((select count(*) = 0 from contact_requests where client_request_id like 'sqltest-req-x-%'), 'refused requests stored nothing');
select pg_temp.raises($q$insert into contact_requests (full_name, subject, message, client_request_id, client_key)
                         values ('Doğrudan', 'genel', 'iletişim yolu olmayan satır', 'sqltest-direct-01', repeat('d', 64))$q$,
                      'check_violation', 'table itself refuses a row without phone or e-mail');

-- 3. rate limit (per sender; stored rows, so every instance sees it) --------
select public.submit_contact_request(pg_temp.p('sqltest-rate-b-' || g, repeat('e', 64))) from generate_series(1, 3) g;
select pg_temp.raises($q$select public.submit_contact_request(pg_temp.p('sqltest-rate-b-4', repeat('e', 64)))$q$, 'rate_limited', '4th request in 10 minutes from one sender');
select pg_temp.ok((public.submit_contact_request(pg_temp.p('sqltest-rate-b-2', repeat('e', 64)))->>'duplicate')::boolean,
                  'a retry of a stored request is not rate limited');
select pg_temp.ok((public.submit_contact_request(pg_temp.p('sqltest-rate-other', repeat('f', 64)))->>'duplicate')::boolean = false,
                  'another sender is not affected');

insert into contact_requests (full_name, phone, subject, message, client_request_id, client_key, created_at)
select 'Eski Talep', '0555 000 00 00', 'genel', 'gün içindeki önceki talep', 'sqltest-day-' || g, repeat('7', 64), now() - interval '2 hours'
  from generate_series(1, 10) g;
select pg_temp.raises($q$select public.submit_contact_request(pg_temp.p('sqltest-day-new', repeat('7', 64)))$q$, 'rate_limited', '11th request of the day from one sender');

-- 4. Merkez update: status, note, actor ---------------------------------------
create function pg_temp.aid() returns uuid language sql as $$ select (v->>'id')::uuid from t where k = 'a' $$;
select pg_temp.raises(format($q$select public.update_contact_request(%L, 'closed', false, null, 'gop', 'GOP')$q$, pg_temp.aid()), 'forbidden', 'branch account refused');
select pg_temp.raises(format($q$select public.update_contact_request(%L, 'closed', false, null, 'merkez', '  ')$q$, pg_temp.aid()), 'forbidden', 'no admin name refused');
select pg_temp.raises(format($q$select public.update_contact_request(%L, 'done', false, null, 'merkez', 'Merkez')$q$, pg_temp.aid()), 'invalid_status', 'unknown status');
select pg_temp.raises($q$select public.update_contact_request(gen_random_uuid(), 'closed', false, null, 'merkez', 'Merkez')$q$, 'not_found', 'unknown request');
select pg_temp.ok((select status = 'new' and handled_at is null from contact_requests where id = pg_temp.aid()), 'refused changes changed nothing');

insert into t values ('u1', public.update_contact_request(pg_temp.aid(), 'in_progress', false, null, 'merkez', 'Merkez Yönetim'));
select pg_temp.ok((select v->>'status' = 'in_progress' and v->>'handled_by' = 'Merkez Yönetim' and v->>'handled_at' is not null
                     and v->>'internal_note' is null from t where k = 'u1'), 'status -> İşlemde, handled by the admin');
select pg_temp.ok(not (select v ? 'client_key' from t where k = 'u1'), 'update result has no client key');

insert into t values ('u2', public.update_contact_request(pg_temp.aid(), null, true, '  Arandı, teklif gönderilecek.  ', 'merkez', 'Merkez Yönetim'));
select pg_temp.ok((select v->>'internal_note' = 'Arandı, teklif gönderilecek.' and v->>'status' = 'in_progress'
                     and v->>'note_updated_by' = 'Merkez Yönetim' from t where k = 'u2'), 'note saved (trimmed), status kept');
select pg_temp.raises(format($q$select public.update_contact_request(%L, null, true, %L, 'merkez', 'Merkez')$q$, pg_temp.aid(), repeat('n', 2001)), 'note_too_long', 'note over 2000 characters');

insert into t values ('u3', public.update_contact_request(pg_temp.aid(), 'closed', false, 'ignored', 'merkez', 'Merkez Yönetim'));
select pg_temp.ok((select v->>'status' = 'closed' and v->>'internal_note' = 'Arandı, teklif gönderilecek.' from t where k = 'u3'),
                  'status change without set_note keeps the note');
insert into t values ('u4', public.update_contact_request(pg_temp.aid(), null, true, '', 'merkez', 'Merkez Yönetim'));
select pg_temp.ok((select v->>'internal_note' is null from t where k = 'u4'), 'empty note clears it');

-- 5. Merkez list -------------------------------------------------------------
insert into t values ('l', public.list_contact_requests(null, 500, 0));
select pg_temp.ok((select (v->>'total')::int = (select count(*) from contact_requests) from t where k = 'l'), 'list total = all rows');
select pg_temp.ok((select jsonb_array_length(v->'rows') <= 200 from t where k = 'l'), 'page size capped at 200');
select pg_temp.ok((select (v->'counts'->>'closed')::int >= 1 from t where k = 'l'), 'counts per status');
select pg_temp.ok(not exists (select 1 from t, jsonb_array_elements(t.v->'rows') r
                               where t.k = 'l' and (r ? 'client_key' or r ? 'client_request_id')), 'list never returns client key or request id');
insert into t values ('lc', public.list_contact_requests('closed', 50, 0));
select pg_temp.ok((select not exists (select 1 from jsonb_array_elements(v->'rows') r where r->>'status' <> 'closed') from t where k = 'lc'),
                  'status filter');
select pg_temp.ok((select (v->'rows'->0->>'created_at')::timestamptz >= (v->'rows'->-1->>'created_at')::timestamptz from t where k = 'l'),
                  'newest first');

-- 6. overall hourly cap -------------------------------------------------------
insert into contact_requests (full_name, email, subject, message, client_request_id, client_key)
select 'Yoğunluk', 'y' || g || '@example.invalid', 'diger', 'saatlik toplam sınır testi', 'sqltest-flood-' || g, md5('flood' || g)
  from generate_series(1, 200) g;
select pg_temp.raises($q$select public.submit_contact_request(pg_temp.p('sqltest-flood-new', repeat('9', 64)))$q$, 'rate_limited', 'over 200 requests in an hour overall');

-- 7. nothing reachable through the public API ---------------------------------
select pg_temp.ok(not has_table_privilege('anon', 'public.contact_requests', 'select')
                  and not has_table_privilege('authenticated', 'public.contact_requests', 'insert'), 'anon / authenticated: no table access');
select pg_temp.ok(not has_function_privilege('anon', 'public.submit_contact_request(jsonb)', 'execute')
                  and not has_function_privilege('authenticated', 'public.list_contact_requests(text, int, int)', 'execute')
                  and not has_function_privilege('anon', 'public.update_contact_request(uuid, text, boolean, text, text, text)', 'execute'),
                  'anon / authenticated: no function access');
select pg_temp.ok(has_function_privilege('service_role', 'public.submit_contact_request(jsonb)', 'execute'), 'service role may submit');
select pg_temp.ok((select relrowsecurity from pg_class where oid = 'public.contact_requests'::regclass), 'row level security on');

do $$ begin raise notice 'ALL CONTACT REQUEST CHECKS PASSED'; end $$;

rollback;
