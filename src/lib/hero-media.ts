import { existsSync } from "node:fs";
import { join } from "node:path";
import { heroSlides, type ResolvedHeroSlide } from "./hero-slides";

/**
 * Server-only. Verifies each hero slide's still image exists under /public at
 * build time and resolves its media object. If the exact file is missing we
 * try the same basename with the other common image extensions; if nothing is
 * found the slide renders its gradient `fallbackVisual` instead of a broken
 * image.
 *
 * Import only from Server Components; pass the result to <HeroSection slides>.
 */

const PUBLIC_DIR = join(process.cwd(), "public");
const EXT_CANDIDATES = [".png", ".jpg", ".jpeg", ".webp", ".avif"];

function resolvePublicImage(publicPath: string): string | null {
  if (existsSync(join(PUBLIC_DIR, publicPath))) return publicPath;

  const dot = publicPath.lastIndexOf(".");
  const base = dot === -1 ? publicPath : publicPath.slice(0, dot);
  for (const ext of EXT_CANDIDATES) {
    const candidate = `${base}${ext}`;
    if (existsSync(join(PUBLIC_DIR, candidate))) return candidate;
  }
  return null;
}

/** /public doesn't change while a production build runs: resolved once per process there */
let resolved: ResolvedHeroSlide[] | null = null;

export function resolveHeroSlides(): ResolvedHeroSlide[] {
  if (resolved) return resolved;
  const slides = resolveSlides();
  if (process.env.NODE_ENV === "production") resolved = slides;
  return slides;
}

function resolveSlides(): ResolvedHeroSlide[] {
  return heroSlides.map((slide) => ({
    ...slide,
    media: {
      type: "image",
      src: resolvePublicImage(slide.image),
      alt: `Funda 1959 — ${slide.eyebrow}`,
    },
  }));
}
