/**
 * Server-only helper: does a given /public-relative path actually exist on
 * disk? CMS-managed content (campaign images, Instagram posters) stores a
 * path string with no upload pipeline behind it yet — the UI falls back to a
 * gradient placeholder instead of a broken <img> when the file is missing.
 * Same idea as `hero-media.ts` / `product-images.ts`.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";

const PUBLIC_DIR = join(process.cwd(), "public");

export function resolvePublicAsset(publicPath: string | null | undefined): string | null {
  if (!publicPath) return null;
  return existsSync(join(PUBLIC_DIR, publicPath)) ? publicPath : null;
}
