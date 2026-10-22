/**
 * Server-only helper: does a given /public-relative path actually exist on
 * disk? CMS-managed content (campaign images, Instagram posters) stores a
 * path string with no upload pipeline behind it yet — the UI falls back to a
 * gradient placeholder instead of a broken <img> when the file is missing.
 * Same idea as `hero-media.ts` / `product-images.ts`.
 */

import { closeSync, existsSync, openSync, readSync } from "node:fs";
import { join } from "node:path";
import { readImageHeader } from "./image-header";

const PUBLIC_DIR = join(process.cwd(), "public");

type ImageSize = { width: number; height: number };

/**
 * /public doesn't change while a production build runs, so each answer is
 * worked out once per server process instead of on every request. In
 * development files may be added at any time: no reuse there.
 */
const reuse = process.env.NODE_ENV === "production";
const existsMemo = new Map<string, boolean>();
const sizeMemo = new Map<string, ImageSize | null>();

export function resolvePublicAsset(publicPath: string | null | undefined): string | null {
  if (!publicPath) return null;
  let exists = reuse ? existsMemo.get(publicPath) : undefined;
  if (exists === undefined) {
    exists = existsSync(join(PUBLIC_DIR, publicPath));
    if (reuse) existsMemo.set(publicPath, exists);
  }
  return exists ? publicPath : null;
}

/**
 * Intrinsic pixel size of a /public image (PNG, JPEG or WebP), read from the
 * file header — lets a layout size its frame to the real aspect ratio instead
 * of cropping. null when the file is missing or the format is unknown.
 */
export function publicImageSize(publicPath: string | null | undefined): ImageSize | null {
  if (!publicPath) return null;
  if (reuse && sizeMemo.has(publicPath)) return sizeMemo.get(publicPath)!;
  const size = readImageSize(publicPath);
  if (reuse) sizeMemo.set(publicPath, size);
  return size;
}

function readImageSize(publicPath: string): ImageSize | null {
  if (!resolvePublicAsset(publicPath)) return null;
  let buf: Buffer;
  try {
    const fd = openSync(join(PUBLIC_DIR, publicPath), "r");
    buf = Buffer.alloc(256 * 1024);
    const n = readSync(fd, buf, 0, buf.length, 0);
    closeSync(fd);
    buf = buf.subarray(0, n);
  } catch {
    return null;
  }

  const header = readImageHeader(buf);
  return header ? { width: header.width, height: header.height } : null;
}
