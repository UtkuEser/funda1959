/**
 * "Funda'dan videolar" — the homepage Instagram cards. Managed by hand in
 * `instagram-content.ts` and published with a deploy (D42): no database, no
 * upload. We never embed Instagram's iframe; each card shows our own 9:16
 * poster and links to the real post. The video is optional.
 */

export type InstagramContentEntry = {
  /** card caption */
  title: string;
  /** 9:16 cover image under public/social/, e.g. "/social/reels/2026-10-vitrin.webp" */
  poster: string;
  /** the real post or reel, e.g. "https://www.instagram.com/reel/ABC123xyz/" */
  instagramUrl: string;
  /** optional short clip under public/social/, e.g. "/social/reels/2026-10-vitrin.mp4" */
  video?: string;
  /** false keeps the entry in the file without showing it */
  published: boolean;
};

/** What the homepage renders for one entry. */
export type InstagramCard = {
  id: string;
  title: string;
  poster: string;
  /** null: poster + link only */
  video: string | null;
  instagramUrl: string;
};
