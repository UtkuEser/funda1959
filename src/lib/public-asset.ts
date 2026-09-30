/**
 * Server-only helper: does a given /public-relative path actually exist on
 * disk? CMS-managed content (campaign images, Instagram posters) stores a
 * path string with no upload pipeline behind it yet — the UI falls back to a
 * gradient placeholder instead of a broken <img> when the file is missing.
 * Same idea as `hero-media.ts` / `product-images.ts`.
 */

import { closeSync, existsSync, openSync, readSync } from "node:fs";
import { join } from "node:path";

const PUBLIC_DIR = join(process.cwd(), "public");

export function resolvePublicAsset(publicPath: string | null | undefined): string | null {
  if (!publicPath) return null;
  return existsSync(join(PUBLIC_DIR, publicPath)) ? publicPath : null;
}

/**
 * Intrinsic pixel size of a /public image (PNG, JPEG or WebP), read from the
 * file header — lets a layout size its frame to the real aspect ratio instead
 * of cropping. null when the file is missing or the format is unknown.
 */
export function publicImageSize(publicPath: string | null | undefined): { width: number; height: number } | null {
  if (!resolvePublicAsset(publicPath)) return null;
  let buf: Buffer;
  try {
    const fd = openSync(join(PUBLIC_DIR, publicPath!), "r");
    buf = Buffer.alloc(256 * 1024);
    const n = readSync(fd, buf, 0, buf.length, 0);
    closeSync(fd);
    buf = buf.subarray(0, n);
  } catch {
    return null;
  }

  // PNG: IHDR follows the 8-byte signature
  if (buf.length >= 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // WebP: RIFF....WEBP + VP8 / VP8L / VP8X chunk
  if (buf.length >= 30 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const chunk = buf.toString("ascii", 12, 16);
    if (chunk === "VP8 ") return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    if (chunk === "VP8L") {
      const b = buf.readUInt32LE(21);
      return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
    }
    if (chunk === "VP8X") return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 };
    return null;
  }
  // JPEG: walk the markers to the first SOFn frame header
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) return null;
      const marker = buf[i + 1];
      const isSOF = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSOF) return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}
