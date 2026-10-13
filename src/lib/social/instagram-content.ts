/**
 * Homepage Instagram cards — THE ONLY PLACE TO EDIT THEM (D42).
 *
 * 1. Put the files under public/social/reels/:
 *    - poster (required): 9:16 image, .webp / .jpg / .png / .avif
 *    - video (optional): short muted clip, .mp4 / .webm
 * 2. Add an entry below. Order here = order on the homepage; the first 5
 *    published entries are shown. `published: false` hides an entry.
 * 3. Check: `npx tsx scripts/verify-instagram-content.ts`
 * 4. Commit and deploy.
 *
 * An empty list (or no valid published entry) hides the homepage section.
 * Never add sample or placeholder entries here: everything published is live.
 *
 * Example (not live — copy it into the list and fill in real values):
 *
 *   {
 *     title: "Vitrinde sabah hazırlığı",
 *     poster: "/social/reels/2026-10-vitrin.webp",
 *     video: "/social/reels/2026-10-vitrin.mp4",
 *     instagramUrl: "https://www.instagram.com/reel/ABC123xyz/",
 *     published: true,
 *   },
 */

import type { InstagramContentEntry } from "./instagram-types";

export const INSTAGRAM_CONTENT: InstagramContentEntry[] = [];
