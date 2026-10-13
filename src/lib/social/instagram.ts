/**
 * Which entries of `instagram-content.ts` the homepage shows. Pure: the
 * caller says whether a poster file exists, so the same rules run on the
 * server (InstagramContentSection) and in scripts/verify-instagram-content.ts.
 */

import type { InstagramCard, InstagramContentEntry } from "./instagram-types";

export const INSTAGRAM_MAX_CARDS = 5;

/** a post, reel or IGTV link — not the profile, not another site */
const INSTAGRAM_POST_URL = /^https:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv)\/[A-Za-z0-9_-]+\/?(\?[^\s#]*)?$/;
const POSTER_PATH = /^\/social\/[A-Za-z0-9_\-/]+\.(webp|jpe?g|png|avif)$/i;
const VIDEO_PATH = /^\/social\/[A-Za-z0-9_\-/]+\.(mp4|webm)$/i;

/** What is wrong with an entry's fields (files are checked separately). */
export function instagramEntryProblems(entry: InstagramContentEntry): string[] {
  const problems: string[] = [];
  if (!entry.title?.trim()) problems.push("başlık boş");
  if (!POSTER_PATH.test(entry.poster ?? "") || entry.poster.includes("//")) {
    problems.push("poster /social/ altında bir .webp/.jpg/.png/.avif yolu olmalı");
  }
  if (entry.video !== undefined && (!VIDEO_PATH.test(entry.video) || entry.video.includes("//"))) {
    problems.push("video /social/ altında bir .mp4/.webm yolu olmalı");
  }
  if (!INSTAGRAM_POST_URL.test(entry.instagramUrl?.trim() ?? "")) {
    problems.push("Instagram bağlantısı bir gönderi/reel adresi olmalı (https://www.instagram.com/p/… veya /reel/…)");
  }
  return problems;
}

/**
 * Published, well-formed entries whose poster exists, in file order, at most
 * 5. The video isn't checked here: video files are kept out of the server
 * bundle (next.config.ts), so the verify script checks them before deploy.
 */
export function selectInstagramCards(
  entries: readonly InstagramContentEntry[],
  posterExists: (publicPath: string) => boolean,
): InstagramCard[] {
  const cards: InstagramCard[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    if (cards.length >= INSTAGRAM_MAX_CARDS) break;
    if (entry.published !== true || instagramEntryProblems(entry).length > 0) continue;
    const instagramUrl = entry.instagramUrl.trim();
    if (seen.has(instagramUrl) || !posterExists(entry.poster)) continue;
    seen.add(instagramUrl);
    cards.push({ id: instagramUrl, title: entry.title.trim(), poster: entry.poster, video: entry.video ?? null, instagramUrl });
  }
  return cards;
}
