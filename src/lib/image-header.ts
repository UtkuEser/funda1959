/**
 * Image type and pixel size from a file's first bytes — never from its name
 * or a declared type. PNG, JPEG and WebP only. Server-only users: the
 * homepage's /public checks (`public-asset.ts`) and product image uploads
 * (`catalog/images.ts`). No dependencies.
 */

export type ImageHeader = {
  type: "png" | "jpeg" | "webp";
  width: number;
  height: number;
  /** an animated WebP / PNG (APNG) — not a product photo */
  animated: boolean;
};

const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.subarray(from, to));
const u16be = (b: Uint8Array, i: number) => (b[i] << 8) | b[i + 1];
const u32be = (b: Uint8Array, i: number) => ((b[i] << 24) >>> 0) + (b[i + 1] << 16) + (b[i + 2] << 8) + b[i + 3];
const u16le = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8);
const u24le = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
const u32le = (b: Uint8Array, i: number) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;

/** null when the bytes are not a PNG, JPEG or WebP this can read. */
export function readImageHeader(b: Uint8Array): ImageHeader | null {
  // PNG: signature, then IHDR (width, height); an acTL chunk before IDAT = animated
  if (b.length >= 24 && u32be(b, 0) === 0x89504e47 && u32be(b, 4) === 0x0d0a1a0a && ascii(b, 12, 16) === "IHDR") {
    let animated = false;
    for (let i = 8; i + 8 <= b.length; ) {
      const len = u32be(b, i);
      const kind = ascii(b, i + 4, i + 8);
      if (kind === "acTL") animated = true;
      if (kind === "IDAT" || kind === "IEND") break;
      i += 12 + len;
    }
    return { type: "png", width: u32be(b, 16), height: u32be(b, 20), animated };
  }
  // WebP: RIFF....WEBP + VP8 / VP8L / VP8X chunk
  if (b.length >= 30 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP") {
    const chunk = ascii(b, 12, 16);
    if (chunk === "VP8 ") return { type: "webp", width: u16le(b, 26) & 0x3fff, height: u16le(b, 28) & 0x3fff, animated: false };
    if (chunk === "VP8L") {
      const v = u32le(b, 21);
      return { type: "webp", width: (v & 0x3fff) + 1, height: ((v >> 14) & 0x3fff) + 1, animated: false };
    }
    if (chunk === "VP8X") return { type: "webp", width: u24le(b, 24) + 1, height: u24le(b, 27) + 1, animated: (b[20] & 0x02) !== 0 };
    return null;
  }
  // JPEG: walk the markers to the first SOFn frame header
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null;
      const marker = b[i + 1];
      const isSOF = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSOF) return { type: "jpeg", width: u16be(b, i + 7), height: u16be(b, i + 5), animated: false };
      i += 2 + u16be(b, i + 2);
    }
  }
  return null;
}
