-- Funda 1959 — Ürün ekleme (0013) rule tests.
-- Runs inside ONE transaction and ROLLS BACK at the end: nothing it creates is
-- kept (no product, photo row, stock row or order). Paste into the SQL Editor
-- of the TEST project only (funda1959-test), after 0013 is applied. Every
-- check raises "FAIL: …" and stops on the first failure; "ok …" lines are
-- notices (the SQL Editor may not show them — no error at the end means every
-- check passed). Storage objects are not touched (only the registry rows).

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
    if sqlerrm = p_expected
       or (p_expected = 'check_violation' and sqlstate = '23514')
       or (p_expected = 'foreign_key_violation' and sqlstate = '23503') then
      raise notice 'ok  % (%)', p_label, p_expected;
      return;
    end if;
    raise exception 'FAIL: % — expected %, got %', p_label, p_expected, sqlerrm;
  end;
  raise exception 'FAIL: % — expected %, got no error', p_label, p_expected;
end $$;

create temp table t (k text primary key, v jsonb) on commit drop;

create function pg_temp.img(p_upload text, p_sha text, p_extra jsonb default '{}'::jsonb) returns jsonb language sql as $$
  select public.catalog_register_image(jsonb_build_object(
    'actor_account', 'merkez', 'actor', 'Merkez Yönetim', 'client_upload_id', p_upload,
    'object_path', 'img/' || p_upload || '.webp', 'sha256', p_sha, 'mime', 'image/webp',
    'width', 1200, 'height', 1200, 'bytes', 250000) || p_extra)
$$;

-- a complete product's fields; overridden per check
create function pg_temp.f(p_image text, p_extra jsonb default '{}'::jsonb) returns jsonb language sql as $$
  select jsonb_build_object(
    'name', 'Sqltest Fıstıklı Pasta', 'category_slug', 'yas-pastalar',
    'short_description', 'Antep fıstığı kremalı test pastası', 'image_id', p_image,
    'sizes', '[{"key":"4-6","price":900},{"key":"8-10","price":1200.5}]'::jsonb,
    'branch_stock', '{"gop":true,"panora":false,"incek":true}'::jsonb,
    'allergens', 'Fıstık, süt, yumurta, gluten', 'cake_message', true,
    'is_new', true, 'is_best_seller', false, 'is_gift', false) || p_extra
$$;

create function pg_temp.save(p_req text, p_slug text, p_fields jsonb, p_id text default null, p_version int default null,
                             p_account text default 'merkez') returns jsonb language sql as $$
  select public.catalog_save_product(jsonb_build_object(
    'actor_account', p_account, 'actor', 'Merkez Yönetim', 'client_request_id', p_req, 'slug', p_slug,
    'fields', p_fields, 'id', p_id, 'expected_version', p_version))
$$;

create function pg_temp.status(p_id text, p_version int, p_status text) returns jsonb language sql as $$
  select public.catalog_set_product_status(jsonb_build_object(
    'actor_account', 'merkez', 'actor', 'Merkez Yönetim', 'id', p_id, 'expected_version', p_version, 'status', p_status))
$$;

-- 1. photo registry ------------------------------------------------------------
insert into t values ('imgA', pg_temp.img('aaaaaaaa-0000-4000-8000-000000000001', repeat('a', 64)));
select pg_temp.ok((select v->>'id' is not null and v->>'object_path' = 'img/aaaaaaaa-0000-4000-8000-000000000001.webp' from t where k = 'imgA'), 'photo registered');
select pg_temp.ok(pg_temp.img('aaaaaaaa-0000-4000-8000-000000000001', repeat('a', 64))->>'id' = (select v->>'id' from t where k = 'imgA'),
                  'same upload id + same file -> the same row (retry)');
select pg_temp.raises($q$select pg_temp.img('aaaaaaaa-0000-4000-8000-000000000001', repeat('b', 64))$q$, 'upload_id_reused', 'same upload id, other file');
select pg_temp.raises($q$select pg_temp.img('aaaaaaaa-0000-4000-8000-000000000002', repeat('c', 64), '{"width": 1200, "height": 900}')$q$, 'check_violation', 'not square');
select pg_temp.raises($q$select pg_temp.img('aaaaaaaa-0000-4000-8000-000000000003', repeat('c', 64), '{"width": 700, "height": 700}')$q$, 'check_violation', 'under 800 px');
select pg_temp.raises($q$select pg_temp.img('aaaaaaaa-0000-4000-8000-000000000004', repeat('c', 64), '{"width": 1700, "height": 1700}')$q$, 'check_violation', 'over 1600 px');
select pg_temp.raises($q$select pg_temp.img('aaaaaaaa-0000-4000-8000-000000000005', repeat('c', 64), '{"bytes": 4194305}')$q$, 'check_violation', 'over 4 MB');
select pg_temp.raises($q$select pg_temp.img('aaaaaaaa-0000-4000-8000-000000000006', repeat('c', 64), '{"mime": "image/gif"}')$q$, 'check_violation', 'GIF refused');
select pg_temp.raises($q$select public.catalog_register_image('{"actor_account":"gop","actor":"GOP","client_upload_id":"aaaaaaaa-0000-4000-8000-000000000007"}')$q$,
                      'forbidden', 'branch account cannot register a photo');
select pg_temp.ok((select count(*) = 1 from catalog_product_images where client_upload_id like 'aaaaaaaa-0000-4000-8000-%'), 'refused uploads left no row');

-- 2. drafts --------------------------------------------------------------------
insert into t values ('d1', pg_temp.save('sqltest-product-0001', 'sqltest-fistikli-pasta',
  '{"name": "Sqltest Fıstıklı Pasta", "category_slug": "yas-pastalar"}'::jsonb));
select pg_temp.ok((select v->'product'->>'id' ~ '^n[0-9a-f]{12}$' and v->'product'->>'status' = 'draft'
                          and (v->'product'->>'version')::int = 1 and (v->>'duplicate')::boolean = false from t where k = 'd1'),
                  'draft created: database id, status draft, version 1');
select pg_temp.ok(pg_temp.save('sqltest-product-0001', 'baska-ad', '{"name": "Başka Ad"}'::jsonb)->'product'->>'id'
                    = (select v->'product'->>'id' from t where k = 'd1'),
                  'same request id again (double click) -> the same draft, nothing new');
select pg_temp.ok((select count(*) = 1 from catalog_products where client_request_id = 'sqltest-product-0001'), 'one row for the request');
select pg_temp.raises($q$select pg_temp.save('sqltest-product-0002', 'sqltest-fistikli-pasta', '{"name": "Sqltest Fıstıklı Pasta"}')$q$,
                      'slug_taken', 'another product with the same address');
select pg_temp.raises($q$select pg_temp.save('sqltest-product-0003', 'sqltest-x', '{"name": "Sqltest X"}', null, null, 'gop')$q$,
                      'forbidden', 'branch account cannot create');
select pg_temp.raises($q$select pg_temp.save(null, 'sqltest-fistikli-pasta', '{"name": "Sqltest Fıstıklı Pasta"}', (select v->'product'->>'id' from t where k = 'd1'), 7)$q$,
                      'version_conflict', 'stale version');
select pg_temp.raises($q$select pg_temp.save(null, 'sqltest-fistikli-pasta', pg_temp.f('99999999-9999-4999-8999-999999999999'), (select v->'product'->>'id' from t where k = 'd1'), 1)$q$,
                      'image_not_found', 'unknown photo');
select pg_temp.raises($q$select pg_temp.save(null, 'sqltest-fistikli-pasta', pg_temp.f(null, '{"sizes": [{"key": "4-6", "price": 0}]}'), (select v->'product'->>'id' from t where k = 'd1'), 1)$q$,
                      'check_violation', 'price 0');
select pg_temp.raises($q$select pg_temp.save(null, 'sqltest-fistikli-pasta', pg_temp.f(null, '{"sizes": [{"key": "4-6", "price": 10.005}]}'), (select v->'product'->>'id' from t where k = 'd1'), 1)$q$,
                      'check_violation', 'three decimals');
select pg_temp.raises($q$select pg_temp.save(null, 'sqltest-fistikli-pasta', pg_temp.f(null, '{"sizes": [{"key": "4-6", "price": 100000.01}]}'), (select v->'product'->>'id' from t where k = 'd1'), 1)$q$,
                      'check_violation', 'over 100.000 TL');
select pg_temp.raises($q$select pg_temp.save(null, 'sqltest-fistikli-pasta', pg_temp.f(null, '{"sizes": [{"key": "4-6", "price": "9"}]}'), (select v->'product'->>'id' from t where k = 'd1'), 1)$q$,
                      'check_violation', 'price as text');
select pg_temp.raises($q$select pg_temp.save(null, 'sqltest-fistikli-pasta', pg_temp.f(null, '{"sizes": [{"key": "4-6", "price": 9}, {"key": "4-6", "price": 10}]}'), (select v->'product'->>'id' from t where k = 'd1'), 1)$q$,
                      'check_violation', 'the same size twice');
select pg_temp.raises($q$select pg_temp.save(null, 'sqltest-fistikli-pasta', pg_temp.f(null, '{"sizes": [{"key": "", "price": 9}, {"key": "4-6", "price": 10}]}'), (select v->'product'->>'id' from t where k = 'd1'), 1)$q$,
                      'check_violation', 'a single price plus a size');
select pg_temp.raises($q$select pg_temp.save(null, 'sqltest-fistikli-pasta', pg_temp.f(null, '{"branch_stock": {"kizilay": true}}'), (select v->'product'->>'id' from t where k = 'd1'), 1)$q$,
                      'check_violation', 'unknown branch');
select pg_temp.raises($q$select pg_temp.save(null, 'sqltest-fistikli-pasta', pg_temp.f(null, '{"branch_stock": {"gop": 3}}'), (select v->'product'->>'id' from t where k = 'd1'), 1)$q$,
                      'check_violation', 'stock as a quantity');
select pg_temp.raises($q$insert into catalog_products (id, slug, name, client_request_id, created_by, updated_by)
                         values ('p19', 'sqltest-p19', 'Sqltest p19', 'sqltest-product-p19', 'x', 'x')$q$,
                      'check_violation', 'a code-style id (p19) cannot be stored');
select pg_temp.ok((select (v->'product'->>'version')::int = 1 from t where k = 'd1')
                  and (select version = 1 from catalog_products where id = (select v->'product'->>'id' from t where k = 'd1')),
                  'refused saves changed nothing');

-- 3. publish -------------------------------------------------------------------
select pg_temp.raises($q$select pg_temp.status((select v->'product'->>'id' from t where k = 'd1'), 1, 'published')$q$,
                      'incomplete', 'publishing an incomplete draft');
insert into t values ('d1v2', pg_temp.save(null, 'sqltest-fistikli-pasta', pg_temp.f((select v->>'id' from t where k = 'imgA')),
                                           (select v->'product'->>'id' from t where k = 'd1'), 1));
select pg_temp.ok((select (v->'product'->>'version')::int = 2 and v->'product'->>'status' = 'draft' from t where k = 'd1v2'), 'draft completed (version 2)');
select pg_temp.ok(not exists (select 1 from catalog_storefront_products where slug = 'sqltest-fistikli-pasta'), 'a draft is not on the storefront');
select pg_temp.ok(not exists (select 1 from branch_product_status where product_id = (select v->'product'->>'id' from t where k = 'd1')), 'a draft has no stock rows');
insert into t values ('pub', pg_temp.status((select v->'product'->>'id' from t where k = 'd1'), 2, 'published'));
select pg_temp.ok((select v->>'status' = 'published' and (v->>'version')::int = 3 and v->>'published_at' is not null
                          and (v->>'slug_locked')::boolean from t where k = 'pub'), 'published (version 3, address locked)');
select pg_temp.ok((select count(*) = 3 from branch_product_status where product_id = (select v->>'id' from t where k = 'pub'))
                  and (select is_active from branch_product_status where product_id = (select v->>'id' from t where k = 'pub') and branch_slug = 'panora') = false
                  and (select is_active from branch_product_status where product_id = (select v->>'id' from t where k = 'pub') and branch_slug = 'gop'),
                  'stock rows written from the panel choice (GOP active, Panora passive)');
select pg_temp.ok((select image_path = 'img/aaaaaaaa-0000-4000-8000-000000000001.webp' and sizes->1->>'price' = '1200.5'
                     from catalog_storefront_products where slug = 'sqltest-fistikli-pasta'), 'on the storefront with its photo and prices');
select pg_temp.ok((pg_temp.status((select v->>'id' from t where k = 'pub'), 3, 'published')->>'version')::int = 3, 'publishing again changes nothing');

-- 4. edit after publish ----------------------------------------------------------
insert into t values ('ed', pg_temp.save(null, 'yeni-adres', pg_temp.f((select v->>'id' from t where k = 'imgA'),
  '{"name": "Sqltest Fıstıklı Pasta Yeni", "branch_stock": {"gop": false, "panora": true, "incek": true}}'),
  (select v->>'id' from t where k = 'pub'), 3));
select pg_temp.ok((select v->'product'->>'slug' = 'sqltest-fistikli-pasta' and v->'product'->>'name' = 'Sqltest Fıstıklı Pasta Yeni' from t where k = 'ed'),
                  'published product edited: name changes, address stays');
select pg_temp.ok((select is_active from branch_product_status where product_id = (select v->>'id' from t where k = 'pub') and branch_slug = 'gop') = false
                  and (select is_active from branch_product_status where product_id = (select v->>'id' from t where k = 'pub') and branch_slug = 'panora'),
                  'stock change after publish written to the branch rows');
select pg_temp.raises($q$select pg_temp.save(null, 'x', pg_temp.f(null), (select v->>'id' from t where k = 'pub'), 4)$q$,
                      'check_violation', 'a published product cannot lose its photo');
select pg_temp.raises($q$select pg_temp.save(null, 'x', pg_temp.f((select v->>'id' from t where k = 'imgA'), '{"sizes": [{"key": "4-6", "price": null}]}'), (select v->>'id' from t where k = 'pub'), 4)$q$,
                      'check_violation', 'a published product cannot lose a price');

-- 5. orders: only published, its sizes, its current price -----------------------
insert into customers (full_name, phone, email) values ('Sqltest Kişi', '05551234567', 'sqltest@example.com');
insert into orders (order_number, customer_id, delivery_type, delivery_date, delivery_time_slot, subtotal, total)
values ('SQLTEST-0013', (select id from customers where email = 'sqltest@example.com' order by created_at desc limit 1),
        'pickup', current_date + 1, '10:00 – 11:00', 900, 900);
create function pg_temp.item(p_product text, p_variant text, p_price numeric) returns void language sql as $$
  insert into order_items (order_id, product_id, product_slug, product_name, variant_id, quantity, unit_price, total_price)
  values ((select id from orders where order_number = 'SQLTEST-0013'), p_product, 'x', 'x', p_variant, 1, p_price, p_price)
$$;
select pg_temp.item((select v->>'id' from t where k = 'pub'), '4-6', 900);
select pg_temp.ok(true, 'published product, its size, catalog price -> order item accepted');
select pg_temp.raises($q$select pg_temp.item((select v->>'id' from t where k = 'pub'), '15-20', 900)$q$, 'product_unavailable', 'a size it does not have');
select pg_temp.raises($q$select pg_temp.item((select v->>'id' from t where k = 'pub'), '4-6', 1)$q$, 'price_mismatch', 'a price the browser made up');
insert into product_prices (product_id, variant_key, price, updated_by) values ((select v->>'id' from t where k = 'pub'), '4-6', 950, 'Merkez Yönetim');
select pg_temp.raises($q$select pg_temp.item((select v->>'id' from t where k = 'pub'), '4-6', 900)$q$, 'price_mismatch', 'catalog price after a "Fiyatlar" price');
select pg_temp.item((select v->>'id' from t where k = 'pub'), '4-6', 950);
select pg_temp.ok(true, '"Fiyatlar" price -> accepted');
select pg_temp.item('p1', '8-10', 1);
select pg_temp.ok(true, 'code product (p1): this guard does not apply');

-- 6. unpublish / republish ---------------------------------------------------------
insert into t values ('un', pg_temp.status((select v->>'id' from t where k = 'pub'), 4, 'unpublished'));
select pg_temp.ok((select v->>'status' = 'unpublished' and v->>'unpublished_at' is not null from t where k = 'un'), 'unpublished');
select pg_temp.ok(not exists (select 1 from catalog_storefront_products where slug = 'sqltest-fistikli-pasta'), 'unpublished: off the storefront');
select pg_temp.raises($q$select pg_temp.item((select v->>'id' from t where k = 'pub'), '4-6', 950)$q$, 'product_unavailable', 'unpublished: no new order');
select pg_temp.ok((select count(*) = 3 from order_items where order_id = (select id from orders where order_number = 'SQLTEST-0013')),
                  'items ordered before keep their name, size and price');
insert into t values ('re', pg_temp.status((select v->>'id' from t where k = 'pub'), 5, 'published'));
select pg_temp.ok((select v->>'status' = 'published' and v->>'published_at' = (select v->>'published_at' from t where k = 'pub') from t where k = 're'),
                  'republished (first publish time kept)');
select pg_temp.raises($q$select pg_temp.status((select v->'product'->>'id' from t where k = 'd2'), 1, 'unpublished')$q$, 'not_found', 'unknown product');
insert into t values ('d2', pg_temp.save('sqltest-product-0004', 'sqltest-ikinci', '{"name": "Sqltest İkinci"}'::jsonb));
select pg_temp.raises($q$select pg_temp.status((select v->'product'->>'id' from t where k = 'd2'), 1, 'unpublished')$q$, 'not_published', 'a draft cannot be unpublished');
select pg_temp.ok(not exists (select 1 from pg_proc where proname like 'catalog%delete%'), 'there is no delete function');

-- 7. photo cleanup never touches a photo in use ------------------------------------
insert into t values ('imgB', pg_temp.img('bbbbbbbb-0000-4000-8000-000000000001', repeat('b', 64)));  -- shared by two products
insert into t values ('imgC', pg_temp.img('cccccccc-0000-4000-8000-000000000001', repeat('c', 64)));  -- nobody, old
insert into t values ('imgD', pg_temp.img('dddddddd-0000-4000-8000-000000000001', repeat('d', 64)));  -- nobody, fresh
update catalog_product_images set created_at = now() - interval '2 days'
 where client_upload_id in ('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000001');
select pg_temp.save(null, 'sqltest-ikinci', pg_temp.f((select v->>'id' from t where k = 'imgB'), '{"name": "Sqltest İkinci"}'), (select v->'product'->>'id' from t where k = 'd2'), 1);
insert into t values ('d3', pg_temp.save('sqltest-product-0005', 'sqltest-ucuncu', pg_temp.f((select v->>'id' from t where k = 'imgB'), '{"name": "Sqltest Üçüncü"}')));
select pg_temp.raises($q$delete from catalog_product_images where id = (select (v->>'id')::uuid from t where k = 'imgB')$q$,
                      'foreign_key_violation', 'a photo in use cannot be deleted');
-- the third product moves to photo A: B is still used by the second product
select pg_temp.save(null, 'sqltest-ucuncu', pg_temp.f((select v->>'id' from t where k = 'imgA'), '{"name": "Sqltest Üçüncü"}'), (select v->'product'->>'id' from t where k = 'd3'), 1);
insert into t values ('claim', to_jsonb(public.catalog_claim_orphan_images('merkez', 60)));
select pg_temp.ok((select v = '["img/cccccccc-0000-4000-8000-000000000001.webp"]'::jsonb from t where k = 'claim'),
                  'cleanup claims only the old unused photo (not the shared one, not the fresh one)');
select pg_temp.ok((select count(*) = 3 from catalog_product_images
                    where client_upload_id in ('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000001')),
                  'photos in use and the fresh upload are kept');
select pg_temp.ok(public.catalog_registered_image_paths(array['img/aaaaaaaa-0000-4000-8000-000000000001.webp', 'img/cccccccc-0000-4000-8000-000000000001.webp', 'img/zzz.webp'])
                    = array['img/aaaaaaaa-0000-4000-8000-000000000001.webp'], 'registered paths: only rows that exist');
select pg_temp.raises($q$select public.catalog_claim_orphan_images('gop', 0)$q$, 'forbidden', 'branch account cannot clean up');

-- 8. nothing reachable through the public API ----------------------------------------
select pg_temp.ok(not has_table_privilege('anon', 'public.catalog_products', 'select')
                  and not has_table_privilege('authenticated', 'public.catalog_products', 'insert')
                  and not has_table_privilege('anon', 'public.catalog_product_images', 'select')
                  and not has_table_privilege('anon', 'public.catalog_storefront_products', 'select')
                  and not has_table_privilege('authenticated', 'public.catalog_storefront_products', 'select'),
                  'anon / authenticated: no table or view access');
select pg_temp.ok(not has_function_privilege('anon', 'public.catalog_save_product(jsonb)', 'execute')
                  and not has_function_privilege('authenticated', 'public.catalog_set_product_status(jsonb)', 'execute')
                  and not has_function_privilege('anon', 'public.catalog_register_image(jsonb)', 'execute')
                  and not has_function_privilege('authenticated', 'public.catalog_claim_orphan_images(text, integer)', 'execute')
                  and not has_function_privilege('anon', 'public.catalog_list_products(text)', 'execute'),
                  'anon / authenticated: no function access');
select pg_temp.ok(has_function_privilege('service_role', 'public.catalog_save_product(jsonb)', 'execute')
                  and has_table_privilege('service_role', 'public.catalog_storefront_products', 'select'), 'service role may use them');
select pg_temp.ok((select relrowsecurity from pg_class where oid = 'public.catalog_products'::regclass)
                  and (select relrowsecurity from pg_class where oid = 'public.catalog_product_images'::regclass), 'row level security on');
select pg_temp.ok((select public and file_size_limit = 4194304 and allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
                     from storage.buckets where id = 'product-images'), 'bucket product-images: public read, 4 MB, JPEG/PNG/WebP');

do $$ begin raise notice 'ALL CATALOG PRODUCT CHECKS PASSED'; end $$;

rollback;
