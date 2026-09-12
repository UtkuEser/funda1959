import type { InstagramContent } from "./instagram-types";
import { INSTAGRAM_PROFILE_URL } from "./config";

const nowISO = () => new Date().toISOString();

export const INSTAGRAM_CONTENT_SEED: InstagramContent[] = [
  {
    id: "ig_vitrin_sabahi",
    title: "Vitrinde sabah hazırlığı",
    videoUrl: "/social/reels/reel-01.mp4",
    posterImage: "/social/reels/reel-01-cover.webp",
    instagramUrl: INSTAGRAM_PROFILE_URL,
    published: true,
    sortOrder: 1,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "ig_pasta_dekor",
    title: "Pasta dekorasyonundan bir kare",
    videoUrl: "/social/reels/reel-02.mp4",
    posterImage: "/social/reels/reel-02-cover.webp",
    instagramUrl: INSTAGRAM_PROFILE_URL,
    published: true,
    sortOrder: 2,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "ig_sube_ani",
    title: "Şubeden bir an",
    videoUrl: "/social/reels/reel-03.mp4",
    posterImage: "/social/reels/reel-03-cover.webp",
    instagramUrl: INSTAGRAM_PROFILE_URL,
    published: true,
    sortOrder: 3,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "ig_ozel_gun",
    title: "Özel gün siparişi",
    videoUrl: "/social/reels/reel-04.mp4",
    posterImage: "/social/reels/reel-04-cover.webp",
    instagramUrl: INSTAGRAM_PROFILE_URL,
    published: true,
    sortOrder: 4,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
];
