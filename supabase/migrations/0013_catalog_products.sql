-- Funda 1959 — products added in the admin panel ("Ürün Ekle", D45, D46)
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor,
-- TEST project first. Depends on 0001 (set_updated_at, orders, order_items),
-- 0003 (branch_product_status), 0009 (product_prices). Safe to re-run:
-- create ... if not exists / drop + add constraint / drop + create trigger /
-- create or replace function / insert ... on conflict.
--
-- SUPABASE_PLAN.md D45, D46, §8.6:
--   * the 18 products in code (ids p1–p18) are NOT here and never move here:
--     new products only, ids "n" + 12 hex (a code id can't be stored);
--   * a product is a draft until published; published products can be edited
--     and unpublished (republished later); there is NO delete. An order keeps
--     its own copy of name, size and price (order_items), so old orders never
--     change;
--   * only PUBLISHED products reach the storefront (view
--     catalog_storefront_products) and orders (trigger on order_items):
--     drafts and unpublished products can't be ordered, whatever the app sends;
--   * catalog prices per size in `sizes` (like SIZE_PRICES in code); a price
--     Merkez sets on the "Fiyatlar" screen (product_prices) wins, as for every
--     product. Stock: the branch_product_status rows (active / passive), written
--     at the first publish from the panel's choice;
--   * photos: one registry row per upload (catalog_product_images) for an
--     object in the public Storage bucket `product-images`. A product points
--     to a registry row (FOREIGN KEY ... ON DELETE RESTRICT), so a photo any
--     product uses — draft, published or unpublished, this one or another —
--     can't be removed by the cleanup;
--   * writes only from the server (service role, RPCs below) and only for
--     Merkez (actor_account 'merkez'); RLS on, no policies, nothing granted to
--     anon / authenticated. The app also keeps the whole panel closed on
--     Production for now (D46).

-- ---------------------------------------------------------------------------
-- shape checks (used by the table constraints)
-- ---------------------------------------------------------------------------

-- [{ "key": "4-6", "price": 780 }, …] — size ids of the category's kind, or one
-- { "key": "" } for a single price; a draft may leave a price null
create or replace function public.catalog_sizes_valid(p jsonb)
returns boolean
language sql
immutable
as $$
  select jsonb_typeof(p) = 'array'
     and jsonb_array_length(p) <= 6
     and not exists (
       select 1 from jsonb_array_elements(p) e
        where jsonb_typeof(e) <> 'object'
           or jsonb_typeof(e->'key') is distinct from 'string'
           or (e->>'key') !~ '^([0-9a-z.-]{1,10})?$'
           or case jsonb_typeof(e->'price')
                when 'number' then (e->>'price')::numeric <= 0
                                   or (e->>'price')::numeric > 100000
                                   or (e->>'price')::numeric <> round((e->>'price')::numeric, 2)
                when 'null' then false
                else e ? 'price' -- a string, object, … is wrong; no price key at all is a draft
              end)
     and (select count(distinct e->>'key') from jsonb_array_elements(p) e) = jsonb_array_length(p)
     and (not exists (select 1 from jsonb_array_elements(p) e where e->>'key' = '') or jsonb_array_length(p) = 1);
$$;

-- every size priced, at least one
create or replace function public.catalog_sizes_complete(p jsonb)
returns boolean
language sql
immutable
as $$
  select public.catalog_sizes_valid(p)
     and jsonb_array_length(p) >= 1
     and not exists (select 1 from jsonb_array_elements(p) e where jsonb_typeof(e->'price') is distinct from 'number');
$$;

-- { "gop": true, "panora": false, … } — the three branches, active / passive
create or replace function public.catalog_branch_stock_valid(p jsonb)
returns boolean
language sql
immutable
as $$
  select jsonb_typeof(p) = 'object'
     and not exists (
       select 1 from jsonb_each(p) e
        where e.key not in ('gop', 'panora', 'incek') or jsonb_typeof(e.value) <> 'boolean');
$$;

-- ---------------------------------------------------------------------------
-- catalog_product_images — one row per uploaded photo
-- ---------------------------------------------------------------------------
create table if not exists public.catalog_product_images (
  id               uuid        primary key default gen_random_uuid(),
  client_upload_id text        not null,
  object_path      text        not null,
  sha256           text        not null,
  mime             text        not null,
  width            integer     not null,
  height           integer     not null,
  bytes            integer     not null,
  uploaded_by      text        not null,
  created_at       timestamptz not null default now()
);

alter table public.catalog_product_images drop constraint if exists catalog_product_images_upload_key;
alter table public.catalog_product_images add constraint catalog_product_images_upload_key unique (client_upload_id);
alter table public.catalog_product_images drop constraint if exists catalog_product_images_path_key;
alter table public.catalog_product_images add constraint catalog_product_images_path_key unique (object_path);
alter table public.catalog_product_images drop constraint if exists catalog_product_images_upload_check;
alter table public.catalog_product_images add constraint catalog_product_images_upload_check
  check (client_upload_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
alter table public.catalog_product_images drop constraint if exists catalog_product_images_path_check;
alter table public.catalog_product_images add constraint catalog_product_images_path_check
  check (object_path ~ '^img/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$');
alter table public.catalog_product_images drop constraint if exists catalog_product_images_sha_check;
alter table public.catalog_product_images add constraint catalog_product_images_sha_check check (sha256 ~ '^[0-9a-f]{64}$');
alter table public.catalog_product_images drop constraint if exists catalog_product_images_mime_check;
alter table public.catalog_product_images add constraint catalog_product_images_mime_check
  check (mime in ('image/jpeg', 'image/png', 'image/webp'));
-- D46: square like the existing photos (within 1 %), 800–1600 px, at most 4 MB
alter table public.catalog_product_images drop constraint if exists catalog_product_images_size_check;
alter table public.catalog_product_images add constraint catalog_product_images_size_check
  check (width between 800 and 1600 and height between 800 and 1600
         and abs(width - height) <= greatest(width, height) * 0.01
         and bytes between 1 and 4194304);
alter table public.catalog_product_images drop constraint if exists catalog_product_images_by_check;
alter table public.catalog_product_images add constraint catalog_product_images_by_check check (length(btrim(uploaded_by)) > 0);

create index if not exists catalog_product_images_created_idx on public.catalog_product_images (created_at);

alter table public.catalog_product_images enable row level security;
revoke all on table public.catalog_product_images from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- catalog_products
-- ---------------------------------------------------------------------------
create table if not exists public.catalog_products (
  id                text        primary key,
  slug              text        not null,
  status            text        not null default 'draft',
  name              text        not null,
  category_slug     text,
  short_description text        not null default '',
  image_id          uuid        references public.catalog_product_images (id) on delete restrict,
  sizes             jsonb       not null default '[]'::jsonb,
  branch_stock      jsonb       not null default '{}'::jsonb,
  allergens         text,
  cake_message      boolean     not null default false,
  is_new            boolean     not null default false,
  is_best_seller    boolean     not null default false,
  is_gift           boolean     not null default false,
  version           integer     not null default 1,
  client_request_id text        not null,
  created_at        timestamptz not null default now(),
  created_by        text        not null,
  updated_at        timestamptz not null default now(),
  updated_by        text        not null,
  published_at      timestamptz,
  published_by      text,
  unpublished_at    timestamptz,
  unpublished_by    text
);

alter table public.catalog_products drop constraint if exists catalog_products_id_check;
alter table public.catalog_products add constraint catalog_products_id_check check (id ~ '^n[0-9a-f]{12}$');
alter table public.catalog_products drop constraint if exists catalog_products_slug_key;
alter table public.catalog_products add constraint catalog_products_slug_key unique (slug);
alter table public.catalog_products drop constraint if exists catalog_products_slug_check;
alter table public.catalog_products add constraint catalog_products_slug_check
  check (length(slug) <= 80 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
alter table public.catalog_products drop constraint if exists catalog_products_request_key;
alter table public.catalog_products add constraint catalog_products_request_key unique (client_request_id);
alter table public.catalog_products drop constraint if exists catalog_products_request_check;
alter table public.catalog_products add constraint catalog_products_request_check check (length(client_request_id) between 8 and 80);
alter table public.catalog_products drop constraint if exists catalog_products_status_check;
alter table public.catalog_products add constraint catalog_products_status_check
  check (status in ('draft', 'published', 'unpublished'));
alter table public.catalog_products drop constraint if exists catalog_products_name_check;
alter table public.catalog_products add constraint catalog_products_name_check check (length(btrim(name)) between 2 and 80);
alter table public.catalog_products drop constraint if exists catalog_products_category_check;
alter table public.catalog_products add constraint catalog_products_category_check
  check (category_slug is null or category_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
alter table public.catalog_products drop constraint if exists catalog_products_short_check;
alter table public.catalog_products add constraint catalog_products_short_check check (length(short_description) <= 300);
alter table public.catalog_products drop constraint if exists catalog_products_allergens_check;
alter table public.catalog_products add constraint catalog_products_allergens_check
  check (allergens is null or length(btrim(allergens)) between 1 and 500);
alter table public.catalog_products drop constraint if exists catalog_products_sizes_check;
alter table public.catalog_products add constraint catalog_products_sizes_check check (public.catalog_sizes_valid(sizes));
alter table public.catalog_products drop constraint if exists catalog_products_stock_check;
alter table public.catalog_products add constraint catalog_products_stock_check check (public.catalog_branch_stock_valid(branch_stock));
alter table public.catalog_products drop constraint if exists catalog_products_by_check;
alter table public.catalog_products add constraint catalog_products_by_check
  check (length(btrim(created_by)) > 0 and length(btrim(updated_by)) > 0);
-- once published (also after unpublishing) a product stays complete
alter table public.catalog_products drop constraint if exists catalog_products_complete;
alter table public.catalog_products add constraint catalog_products_complete
  check (status = 'draft'
         or (category_slug is not null
             and length(btrim(short_description)) >= 10
             and image_id is not null
             and public.catalog_sizes_complete(sizes)
             and branch_stock ?& array['gop', 'panora', 'incek']
             and published_at is not null));

create index if not exists catalog_products_status_idx on public.catalog_products (status, published_at);
create index if not exists catalog_products_image_idx on public.catalog_products (image_id);

drop trigger if exists catalog_products_set_updated_at on public.catalog_products;
create trigger catalog_products_set_updated_at
  before update on public.catalog_products
  for each row execute function public.set_updated_at();

alter table public.catalog_products enable row level security;
revoke all on table public.catalog_products from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- catalog_storefront_products — the ONLY read the storefront makes:
-- published products, with their photo's object path. No drafts, no
-- unpublished products, no audit fields.
-- ---------------------------------------------------------------------------
create or replace view public.catalog_storefront_products
with (security_invoker = true) as
  select p.id, p.slug, p.name, p.category_slug, p.short_description, i.object_path as image_path,
         p.sizes, p.allergens, p.cake_message, p.is_new, p.is_best_seller, p.is_gift, p.branch_stock,
         p.updated_at, p.published_at
    from public.catalog_products p
    join public.catalog_product_images i on i.id = p.image_id
   where p.status = 'published';

revoke all on table public.catalog_storefront_products from public, anon, authenticated;
grant select on table public.catalog_storefront_products to service_role;

-- ---------------------------------------------------------------------------
-- catalog_product_json — one product for the panel (drafts included)
-- ---------------------------------------------------------------------------
create or replace function public.catalog_product_json(p_id text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', p.id, 'slug', p.slug, 'status', p.status, 'name', p.name,
    'category_slug', p.category_slug, 'short_description', p.short_description,
    'image_id', p.image_id, 'image_path', i.object_path, 'sizes', p.sizes,
    'branch_stock', p.branch_stock,
    -- after the first publish the branches' own rows are the stock
    'branch_status', (select jsonb_object_agg(s.branch_slug, s.is_active)
                        from branch_product_status s where s.product_id = p.id),
    'allergens', p.allergens, 'cake_message', p.cake_message, 'is_new', p.is_new,
    'is_best_seller', p.is_best_seller, 'is_gift', p.is_gift, 'version', p.version,
    'slug_locked', p.published_at is not null,
    'created_at', p.created_at, 'created_by', p.created_by,
    'updated_at', p.updated_at, 'updated_by', p.updated_by,
    'published_at', p.published_at, 'published_by', p.published_by,
    'unpublished_at', p.unpublished_at, 'unpublished_by', p.unpublished_by)
  from catalog_products p
  left join catalog_product_images i on i.id = p.image_id
  where p.id = p_id;
$$;

-- every product (or one), newest first — Merkez panel
create or replace function public.catalog_list_products(p_id text default null)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(public.catalog_product_json(p.id) order by p.created_at desc, p.id), '[]'::jsonb)
    from catalog_products p
   where p_id is null or p.id = p_id;
$$;

-- ---------------------------------------------------------------------------
-- catalog_save_product — create a draft (same client_request_id -> same row)
-- or update a product (expected_version must match). Merkez only.
-- p_payload: { actor_account, actor, client_request_id?, id?, expected_version?,
--              slug, fields: { name, category_slug, short_description, image_id,
--              sizes, branch_stock, allergens, cake_message, is_new,
--              is_best_seller, is_gift } }
-- ---------------------------------------------------------------------------
create or replace function public.catalog_save_product(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor  text := nullif(btrim(coalesce(p_payload->>'actor', '')), '');
  v_req    text := btrim(coalesce(p_payload->>'client_request_id', ''));
  v_id     text := nullif(btrim(coalesce(p_payload->>'id', '')), '');
  v_slug   text := btrim(coalesce(p_payload->>'slug', ''));
  v_f      jsonb := coalesce(p_payload->'fields', '{}'::jsonb);
  v_image  uuid;
  v_row    catalog_products%rowtype;
begin
  if p_payload->>'actor_account' is distinct from 'merkez' or v_actor is null then
    raise exception 'forbidden';
  end if;
  if jsonb_typeof(v_f) <> 'object' then raise exception 'invalid_fields'; end if;
  begin
    v_image := nullif(v_f->>'image_id', '')::uuid;
  exception when invalid_text_representation then
    raise exception 'image_not_found';
  end;
  if v_image is not null and not exists (select 1 from catalog_product_images where id = v_image) then
    raise exception 'image_not_found';
  end if;

  if v_id is null then
    if length(v_req) not between 8 and 80 then raise exception 'invalid_request_id'; end if;
    -- the same request twice (retry, double click, two at once): one row
    perform pg_advisory_xact_lock(hashtextextended('catalog_product_request:' || v_req, 0));
    select * into v_row from catalog_products where client_request_id = v_req;
    if found then
      return jsonb_build_object('product', public.catalog_product_json(v_row.id), 'duplicate', true);
    end if;
    if exists (select 1 from catalog_products where slug = v_slug) then raise exception 'slug_taken'; end if;
    insert into catalog_products (
      id, slug, name, category_slug, short_description, image_id, sizes, branch_stock, allergens,
      cake_message, is_new, is_best_seller, is_gift, client_request_id, created_by, updated_by)
    values (
      'n' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12), v_slug, btrim(coalesce(v_f->>'name', '')),
      nullif(v_f->>'category_slug', ''), btrim(coalesce(v_f->>'short_description', '')), v_image,
      coalesce(v_f->'sizes', '[]'::jsonb), coalesce(v_f->'branch_stock', '{}'::jsonb),
      nullif(btrim(coalesce(v_f->>'allergens', '')), ''),
      coalesce((v_f->>'cake_message')::boolean, false), coalesce((v_f->>'is_new')::boolean, false),
      coalesce((v_f->>'is_best_seller')::boolean, false), coalesce((v_f->>'is_gift')::boolean, false),
      v_req, v_actor, v_actor)
    returning * into v_row;
    return jsonb_build_object('product', public.catalog_product_json(v_row.id), 'duplicate', false);
  end if;

  select * into v_row from catalog_products where id = v_id for update;
  if not found then raise exception 'not_found'; end if;
  if (p_payload->>'expected_version')::int is distinct from v_row.version then raise exception 'version_conflict'; end if;
  -- the address is fixed once the product was published (links, carts)
  if v_row.published_at is not null then v_slug := v_row.slug; end if;
  if v_slug <> v_row.slug and exists (select 1 from catalog_products where slug = v_slug and id <> v_id) then
    raise exception 'slug_taken';
  end if;

  update catalog_products set
    slug = v_slug,
    name = btrim(coalesce(v_f->>'name', '')),
    category_slug = nullif(v_f->>'category_slug', ''),
    short_description = btrim(coalesce(v_f->>'short_description', '')),
    image_id = v_image,
    sizes = coalesce(v_f->'sizes', '[]'::jsonb),
    branch_stock = coalesce(v_f->'branch_stock', '{}'::jsonb),
    allergens = nullif(btrim(coalesce(v_f->>'allergens', '')), ''),
    cake_message = coalesce((v_f->>'cake_message')::boolean, false),
    is_new = coalesce((v_f->>'is_new')::boolean, false),
    is_best_seller = coalesce((v_f->>'is_best_seller')::boolean, false),
    is_gift = coalesce((v_f->>'is_gift')::boolean, false),
    version = v_row.version + 1,
    updated_by = v_actor
  where id = v_id
  returning * into v_row;

  -- after the first publish the branches' rows are the stock: the panel's choice is written there too
  if v_row.published_at is not null then
    insert into branch_product_status (branch_slug, product_id, is_active, updated_by)
    select e.key, v_row.id, e.value::boolean, v_actor from jsonb_each_text(v_row.branch_stock) e
    on conflict (branch_slug, product_id) do update
      set is_active = excluded.is_active, updated_by = excluded.updated_by
      where branch_product_status.is_active is distinct from excluded.is_active;
  end if;

  return jsonb_build_object('product', public.catalog_product_json(v_row.id), 'duplicate', false);
end;
$$;

-- ---------------------------------------------------------------------------
-- catalog_set_product_status — publish / unpublish (no delete). Merkez only.
-- p_payload: { actor_account, actor, id, expected_version, status }
-- ---------------------------------------------------------------------------
create or replace function public.catalog_set_product_status(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor  text := nullif(btrim(coalesce(p_payload->>'actor', '')), '');
  v_status text := p_payload->>'status';
  v_row    catalog_products%rowtype;
begin
  if p_payload->>'actor_account' is distinct from 'merkez' or v_actor is null then
    raise exception 'forbidden';
  end if;
  if v_status is null or v_status not in ('published', 'unpublished') then raise exception 'invalid_status'; end if;

  select * into v_row from catalog_products where id = p_payload->>'id' for update;
  if not found then raise exception 'not_found'; end if;
  if (p_payload->>'expected_version')::int is distinct from v_row.version then raise exception 'version_conflict'; end if;
  if v_row.status = v_status then
    return public.catalog_product_json(v_row.id); -- already so: nothing changes
  end if;

  if v_status = 'published' then
    if v_row.category_slug is null
       or length(btrim(v_row.short_description)) < 10
       or v_row.image_id is null
       or not public.catalog_sizes_complete(v_row.sizes)
       or not (v_row.branch_stock ?& array['gop', 'panora', 'incek']) then
      raise exception 'incomplete';
    end if;
    update catalog_products set
      status = 'published',
      published_at = coalesce(published_at, now()),
      published_by = coalesce(published_by, v_actor),
      version = v_row.version + 1,
      updated_by = v_actor
    where id = v_row.id;
    -- stock: the panel's choice where a branch has no row yet (a later stock change is kept)
    insert into branch_product_status (branch_slug, product_id, is_active, updated_by)
    select e.key, v_row.id, e.value::boolean, v_actor from jsonb_each_text(v_row.branch_stock) e
    on conflict (branch_slug, product_id) do nothing;
  else
    if v_row.status <> 'published' then raise exception 'not_published'; end if;
    update catalog_products set
      status = 'unpublished',
      unpublished_at = now(),
      unpublished_by = v_actor,
      version = v_row.version + 1,
      updated_by = v_actor
    where id = v_row.id;
  end if;
  return public.catalog_product_json(v_row.id);
end;
$$;

-- ---------------------------------------------------------------------------
-- catalog_register_image — record an uploaded photo (the app has checked the
-- file's content and stored the object). The same client_upload_id twice gives
-- the first row; with a different file it is refused.
-- ---------------------------------------------------------------------------
create or replace function public.catalog_register_image(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor  text := nullif(btrim(coalesce(p_payload->>'actor', '')), '');
  v_upload text := coalesce(p_payload->>'client_upload_id', '');
  v_row    catalog_product_images%rowtype;
begin
  if p_payload->>'actor_account' is distinct from 'merkez' or v_actor is null then
    raise exception 'forbidden';
  end if;
  if v_upload !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'invalid_upload_id';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('catalog_image_upload:' || v_upload, 0));
  select * into v_row from catalog_product_images where client_upload_id = v_upload;
  if found then
    if v_row.sha256 is distinct from p_payload->>'sha256' then raise exception 'upload_id_reused'; end if;
  else
    insert into catalog_product_images (client_upload_id, object_path, sha256, mime, width, height, bytes, uploaded_by)
    values (v_upload, p_payload->>'object_path', p_payload->>'sha256', p_payload->>'mime',
            (p_payload->>'width')::int, (p_payload->>'height')::int, (p_payload->>'bytes')::int, v_actor)
    returning * into v_row;
  end if;
  return jsonb_build_object(
    'id', v_row.id, 'object_path', v_row.object_path, 'sha256', v_row.sha256, 'mime', v_row.mime,
    'width', v_row.width, 'height', v_row.height, 'bytes', v_row.bytes, 'created_at', v_row.created_at);
end;
$$;

-- ---------------------------------------------------------------------------
-- catalog_claim_orphan_images — remove the registry rows of photos NO product
-- uses (any status) and older than p_min_age_minutes; returns their object
-- paths for the app to delete from Storage. A photo in use can't be claimed:
-- the NOT EXISTS below, and the foreign key (ON DELETE RESTRICT) besides.
-- ---------------------------------------------------------------------------
create or replace function public.catalog_claim_orphan_images(p_actor_account text, p_min_age_minutes integer)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paths text[];
begin
  if p_actor_account is distinct from 'merkez' then raise exception 'forbidden'; end if;
  with gone as (
    delete from catalog_product_images i
     where i.created_at <= now() - make_interval(mins => greatest(coalesce(p_min_age_minutes, 1440), 0))
       and not exists (select 1 from catalog_products p where p.image_id = i.id)
    returning i.object_path
  )
  select coalesce(array_agg(object_path order by object_path), '{}') into v_paths from gone;
  return v_paths;
end;
$$;

-- which of these object paths have a registry row (the Storage sweep keeps those)
create or replace function public.catalog_registered_image_paths(p_paths text[])
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(object_path order by object_path), '{}')
    from catalog_product_images where object_path = any(coalesce(p_paths, '{}'));
$$;

-- ---------------------------------------------------------------------------
-- order_items guard — a product added in the panel is ordered only while
-- PUBLISHED, in one of its sizes, at its current price (a "Fiyatlar" price,
-- else its catalog price). Code products (p1–p18) are not affected.
-- ---------------------------------------------------------------------------
create or replace function public.catalog_order_item_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p     catalog_products%rowtype;
  v_key   text := coalesce(nullif(new.variant_id, ''), '');
  v_size  jsonb;
  v_price numeric;
begin
  select * into v_p from catalog_products where id = new.product_id;
  if not found then return new; end if;
  if v_p.status <> 'published' then raise exception 'product_unavailable'; end if;
  select e into v_size from jsonb_array_elements(v_p.sizes) e where e->>'key' = v_key;
  if v_size is null then raise exception 'product_unavailable'; end if;
  select pp.price into v_price from product_prices pp where pp.product_id = new.product_id and pp.variant_key = v_key;
  v_price := coalesce(v_price, (v_size->>'price')::numeric);
  if round(new.unit_price, 2) <> round(v_price, 2) then raise exception 'price_mismatch'; end if;
  return new;
end;
$$;

drop trigger if exists order_items_catalog_guard on public.order_items;
create trigger order_items_catalog_guard
  before insert on public.order_items
  for each row execute function public.catalog_order_item_guard();

-- ---------------------------------------------------------------------------
-- Storage bucket for the photos: public read (product photos are public
-- content), at most 4 MB, JPEG / PNG / WebP. No storage.objects policies:
-- only the server (service role) uploads or deletes.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 4194304, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- grants
-- ---------------------------------------------------------------------------
revoke all on function public.catalog_product_json(text) from public, anon, authenticated;
grant execute on function public.catalog_product_json(text) to service_role;
revoke all on function public.catalog_list_products(text) from public, anon, authenticated;
grant execute on function public.catalog_list_products(text) to service_role;
revoke all on function public.catalog_save_product(jsonb) from public, anon, authenticated;
grant execute on function public.catalog_save_product(jsonb) to service_role;
revoke all on function public.catalog_set_product_status(jsonb) from public, anon, authenticated;
grant execute on function public.catalog_set_product_status(jsonb) to service_role;
revoke all on function public.catalog_register_image(jsonb) from public, anon, authenticated;
grant execute on function public.catalog_register_image(jsonb) to service_role;
revoke all on function public.catalog_claim_orphan_images(text, integer) from public, anon, authenticated;
grant execute on function public.catalog_claim_orphan_images(text, integer) to service_role;
revoke all on function public.catalog_registered_image_paths(text[]) from public, anon, authenticated;
grant execute on function public.catalog_registered_image_paths(text[]) to service_role;
revoke all on function public.catalog_order_item_guard() from public, anon, authenticated;
