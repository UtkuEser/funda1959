/**
 * Demo seed — 4 campaigns with a wide, always-active window so the homepage
 * has something real to show out of the box. No fake discount percentages;
 * every CTA points at a route that exists.
 */

import type { Campaign } from "./types";

const nowISO = () => new Date().toISOString();

export const CAMPAIGN_SEED: Campaign[] = [
  {
    id: "cmp_haftanin_seckisi",
    title: "Haftanın Seçkisi",
    description: "Haftanın öne çıkan lezzetlerini keşfedin.",
    image: "/home/campaigns/kampanya-01.webp",
    startAt: "2025-01-01T00:00:00+03:00",
    endAt: "2026-12-31T23:59:59+03:00",
    ctaLabel: "İncele",
    ctaHref: "/lezzetlerimiz",
    active: true,
    branchIds: "all",
    priority: 1,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "cmp_kahve_yanina_funda",
    title: "Kahve Yanına Funda",
    description: "Kahve sohbetlerinize eşlik edecek kuru pastalarımızla tanışın.",
    image: "/home/campaigns/kampanya-02.webp",
    startAt: "2025-01-01T00:00:00+03:00",
    endAt: "2026-12-31T23:59:59+03:00",
    ctaLabel: "İncele",
    ctaHref: "/lezzetlerimiz/kuru-pastalar",
    active: true,
    branchIds: "all",
    priority: 2,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "cmp_kutlamalara_ozel",
    title: "Kutlamalara Özel",
    description: "Doğum günleri ve kutlamalarınız için özel tasarım pastalar.",
    image: "/home/campaigns/kampanya-03.webp",
    startAt: "2025-01-01T00:00:00+03:00",
    endAt: "2026-12-31T23:59:59+03:00",
    ctaLabel: "Sipariş İçin İletişime Geç",
    ctaHref: "/ozel-gun",
    active: true,
    branchIds: ["gop", "panora"],
    priority: 3,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "cmp_cikolata_seckisi",
    title: "Çikolata Seçkisi",
    description: "El yapımı çikolatalarımızla tatlı bir mola verin.",
    image: "/home/campaigns/kampanya-04.webp",
    startAt: "2025-01-01T00:00:00+03:00",
    endAt: "2026-12-31T23:59:59+03:00",
    ctaLabel: "İncele",
    ctaHref: "/lezzetlerimiz/cikolatalar",
    active: true,
    branchIds: "all",
    priority: 4,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
];
