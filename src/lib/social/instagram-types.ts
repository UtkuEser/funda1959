/**
 * "Funda'dan Kareler" — CMS-managed Instagram/reel content for the homepage.
 * We never embed Instagram's iframe; we show our own poster image and send
 * the click to the real reel/post URL.
 */

export type InstagramContent = {
  id: string;
  title?: string;
  /** /public path, e.g. "/social/reels/reel-01.mp4" */
  videoUrl: string;
  /** /public path, e.g. "/social/reels/reel-01-cover.webp" */
  posterImage: string;
  instagramUrl: string;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type NewInstagramContentInput = Omit<InstagramContent, "id" | "createdAt" | "updatedAt">;
