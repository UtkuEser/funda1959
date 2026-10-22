/**
 * Product photos in Supabase Storage (bucket `product-images`, created by
 * migration 0013). Server-only, service role. Like every database call, a
 * Storage call first checks that the connected project is this deployment's
 * (environment marker, D3): a Preview never writes into the production bucket.
 */

import { dataEnvironmentError, isSupabaseConfigured, readDataEnvironmentMarker } from "../supabase-server";

if (typeof window !== "undefined") {
  throw new Error("catalog/storage.ts must never be imported on the client");
}

export const PRODUCT_IMAGE_BUCKET = "product-images";

export class ImageStorageError extends Error {
  constructor(
    readonly status: number,
    detail: string,
  ) {
    super(`storage ${status}: ${detail.slice(0, 300)}`);
    this.name = "ImageStorageError";
  }
}

function base(): string {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("SUPABASE_URL is not configured");
  return url.replace(/\/+$/, "");
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return { apikey: key, Authorization: `Bearer ${key}`, ...extra };
}

async function checkedProject(): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured");
  const marker = await readDataEnvironmentMarker();
  if (marker.status !== "ok") throw dataEnvironmentError(marker);
}

const objectUrl = (path: string) => `${base()}/storage/v1/object/${PRODUCT_IMAGE_BUCKET}/${path}`;

/** The address browsers load a photo from (public bucket). */
export function productImageUrl(path: string): string {
  return `${base()}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${path}`;
}

export const imageStorage = {
  /** A new object at a path nobody used before (never overwrites). */
  async upload(path: string, bytes: Uint8Array, mime: string): Promise<void> {
    await checkedProject();
    const res = await fetch(objectUrl(path), {
      method: "POST",
      headers: headers({ "Content-Type": mime, "x-upsert": "false", "cache-control": "max-age=31536000" }),
      body: Buffer.from(bytes),
      cache: "no-store",
    });
    if (!res.ok) throw new ImageStorageError(res.status, await res.text());
  },

  /** Removes objects; paths that are already gone are not an error. */
  async remove(paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    await checkedProject();
    const res = await fetch(`${base()}/storage/v1/object/${PRODUCT_IMAGE_BUCKET}`, {
      method: "DELETE",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ prefixes: paths }),
      cache: "no-store",
    });
    if (!res.ok && res.status !== 404) throw new ImageStorageError(res.status, await res.text());
  },

  /** Objects under a folder ("img"), oldest first, with their creation time. */
  async list(folder: string): Promise<{ path: string; createdAt: string | null }[]> {
    await checkedProject();
    const out: { path: string; createdAt: string | null }[] = [];
    for (let offset = 0; ; offset += 1000) {
      const res = await fetch(`${base()}/storage/v1/object/list/${PRODUCT_IMAGE_BUCKET}`, {
        method: "POST",
        headers: headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({ prefix: folder, limit: 1000, offset, sortBy: { column: "created_at", order: "asc" } }),
        cache: "no-store",
      });
      if (!res.ok) throw new ImageStorageError(res.status, await res.text());
      const page = (await res.json()) as { name: string; id: string | null; created_at?: string | null }[];
      // folders come back with a null id
      for (const o of page) if (o.id !== null) out.push({ path: `${folder}/${o.name}`, createdAt: o.created_at ?? null });
      if (page.length < 1000) return out;
    }
  },
};
