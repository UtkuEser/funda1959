-- Funda 1959 — homepage campaigns: the five poster campaigns
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.
-- Depends on 0002_campaigns.sql.
--
-- The site shows the five posters in public/kampanya/ (src/lib/campaigns/mock.ts).
-- 0002 seeds four older demo campaigns whose images (/home/campaigns/*.webp)
-- no longer exist. This migration:
--   1. adds `image_has_text` (the poster already carries the campaign's words,
--      so the card doesn't repeat the title) and `seed_key` (stable identity
--      for seeded rows, so re-running never duplicates them);
--   2. inserts the five posters once (ON CONFLICT DO NOTHING);
--   3. switches off the four 0002 demo rows ONLY if nobody has edited them
--      since they were seeded (updated_at = created_at). Rows changed in the
--      admin panel are left alone. Nothing is deleted.
-- Titles / descriptions / links are transcribed from the posters and
-- mock.ts; the date window is the same placeholder the site uses today and
-- is meant to be edited in the admin panel.

alter table public.campaigns add column if not exists image_has_text boolean not null default false;
alter table public.campaigns add column if not exists seed_key text;
create unique index if not exists campaigns_seed_key_key on public.campaigns (seed_key);

insert into public.campaigns
  (seed_key, title, description, image, image_has_text, start_at, end_at, cta_label, cta_href, active, branch_ids, priority)
values
  ('cmp_3_al_2_ode', '3 Al 2 Öde', 'Seçili tek kişilik pastalarda', '/kampanya/1.png', true,
   '2025-01-01T00:00:00+03:00', '2026-12-31T23:59:59+03:00', 'Pastaları incele', '/lezzetlerimiz/adet-pastalar', true, ARRAY['all']::text[], 1),
  ('cmp_tatli_yaninda_kahve', 'Tatlı yanında kahve bizden', 'Seçili tatlılara özel', '/kampanya/2.png', true,
   '2025-01-01T00:00:00+03:00', '2026-12-31T23:59:59+03:00', 'Tatlıları incele', '/lezzetlerimiz/tatlilar', true, ARRAY['all']::text[], 2),
  ('cmp_funda_puan_10', 'Funda Puan %10', 'Online alışverişinizin %10’u kadar Funda Puan kazanın.', '/kampanya/3.png', true,
   '2025-01-01T00:00:00+03:00', '2026-12-31T23:59:59+03:00', 'Alışverişe başla', '/lezzetlerimiz', true, ARRAY['all']::text[], 3),
  ('cmp_ilk_siparis_15', 'İlk online siparişe %15', 'Tatlı bir başlangıç', '/kampanya/4.png', true,
   '2025-01-01T00:00:00+03:00', '2026-12-31T23:59:59+03:00', 'Ürünleri keşfet', '/lezzetlerimiz', true, ARRAY['all']::text[], 4),
  ('cmp_hafta_sonu_sofrasi', 'Hafta sonu sofranıza Funda', 'Kahvaltılık lezzetler', '/kampanya/5.png', true,
   '2025-01-01T00:00:00+03:00', '2026-12-31T23:59:59+03:00', 'Kahvaltılıkları gör', '/lezzetlerimiz/borekler', true, ARRAY['all']::text[], 5)
on conflict (seed_key) do nothing;

update public.campaigns
   set active = false
 where seed_key is null
   and active
   and updated_at = created_at
   and image in (
     '/home/campaigns/kampanya-01.webp',
     '/home/campaigns/kampanya-02.webp',
     '/home/campaigns/kampanya-03.webp',
     '/home/campaigns/kampanya-04.webp'
   );
