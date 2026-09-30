/**
 * Seed campaigns — served only while no Supabase campaign store is configured
 * (see `campaigns/server-init.ts`); the homepage then labels the section as
 * sample content.
 *
 * The five visuals are the campaign posters in `public/kampanya/`; title and
 * description are transcribed from each poster (used as alt text and in the
 * admin list — the homepage card doesn't repeat them, `imageHasText`). Dates,
 * CTA targets and branch targeting are placeholders until the campaigns are
 * managed from the admin panel; every CTA points at a route that exists.
 */

import type { Campaign } from "./types";

const nowISO = () => new Date().toISOString();

const SEED_WINDOW = { startAt: "2025-01-01T00:00:00+03:00", endAt: "2026-12-31T23:59:59+03:00" };

export const CAMPAIGN_SEED: Campaign[] = [
  {
    id: "cmp_3_al_2_ode",
    title: "3 Al 2 Öde",
    description: "Seçili tek kişilik pastalarda",
    image: "/kampanya/1.png",
    imageHasText: true,
    ...SEED_WINDOW,
    ctaLabel: "Pastaları incele",
    ctaHref: "/lezzetlerimiz/adet-pastalar",
    active: true,
    branchIds: "all",
    priority: 1,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "cmp_tatli_yaninda_kahve",
    title: "Tatlı yanında kahve bizden",
    description: "Seçili tatlılara özel",
    image: "/kampanya/2.png",
    imageHasText: true,
    ...SEED_WINDOW,
    ctaLabel: "Tatlıları incele",
    ctaHref: "/lezzetlerimiz/tatlilar",
    active: true,
    branchIds: "all",
    priority: 2,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "cmp_funda_puan_10",
    title: "Funda Puan %10",
    description: "Online alışverişinizin %10’u kadar Funda Puan kazanın.",
    image: "/kampanya/3.png",
    imageHasText: true,
    ...SEED_WINDOW,
    ctaLabel: "Alışverişe başla",
    ctaHref: "/lezzetlerimiz",
    active: true,
    branchIds: "all",
    priority: 3,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "cmp_ilk_siparis_15",
    title: "İlk online siparişe %15",
    description: "Tatlı bir başlangıç",
    image: "/kampanya/4.png",
    imageHasText: true,
    ...SEED_WINDOW,
    ctaLabel: "Ürünleri keşfet",
    ctaHref: "/lezzetlerimiz",
    active: true,
    branchIds: "all",
    priority: 4,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "cmp_hafta_sonu_sofrasi",
    title: "Hafta sonu sofranıza Funda",
    description: "Kahvaltılık lezzetler",
    image: "/kampanya/5.png",
    imageHasText: true,
    ...SEED_WINDOW,
    ctaLabel: "Kahvaltılıkları gör",
    ctaHref: "/lezzetlerimiz/borekler",
    active: true,
    branchIds: "all",
    priority: 5,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
];
