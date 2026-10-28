/**
 * Özel pasta talebi photos in Supabase Storage — the PRIVATE bucket
 * `contact-attachments` (migration 0016). Server-only, service role. Like
 * every database call, a Storage call first checks that the connected project
 * is this deployment's (environment marker, D3). Nobody loads these by a
 * public address: Merkez gets short-lived signed URLs.
 */

import { createHash } from "node:crypto";
import { dataEnvironmentError, isSupabaseConfigured, readDataEnvironmentMarker } from "../supabase-server";
import { readImageHeader } from "../image-header";
import { CUSTOM_CAKE_IMAGE } from "./custom-cake";

if (typeof window !== "undefined") {
  throw new Error("contact/attachments.ts must never be imported on the client");
}

export const CONTACT_ATTACHMENT_BUCKET = "contact-attachments";
const SIGNED_URL_SECONDS = 60 * 60;

/** The photo itself isn't acceptable (the reason is for the visitor). */
export class AttachmentRejectedError extends Error {
  constructor(readonly reason: string) {
    super(`attachment rejected: ${reason}`);
    this.name = "AttachmentRejectedError";
  }
}

export class AttachmentStorageError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
  ) {
    super(`storage ${status}: ${detail.slice(0, 300)}`);
    this.name = "AttachmentStorageError";
  }

  /** the bucket doesn't exist yet — migration 0016 isn't applied */
  get bucketMissing(): boolean {
    return /bucket not found/i.test(this.detail);
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

/**
 * The photo checked by its content (never its name or declared type), and
 * the object it is stored as: requests/<request id>/<sha256>.<ext> — the same
 * request sent again with the same photo writes the same object.
 */
export function checkAttachment(
  bytes: Uint8Array,
  declaredType: string | null,
  requestId: string,
): { path: string; mime: string; bytes: Uint8Array } {
  if (bytes.length === 0) throw new AttachmentRejectedError("Görsel dosyası boş.");
  if (bytes.length > CUSTOM_CAKE_IMAGE.maxBytes) throw new AttachmentRejectedError("Görsel en fazla 4 MB olabilir.");
  const header = readImageHeader(bytes);
  if (!header) throw new AttachmentRejectedError("Yalnızca JPEG, PNG veya WebP görsel yüklenebilir.");
  if (header.animated) throw new AttachmentRejectedError("Hareketli görsel yüklenemez.");
  const mime = header.type === "jpeg" ? "image/jpeg" : header.type === "png" ? "image/png" : "image/webp";
  if (declaredType && declaredType !== mime) throw new AttachmentRejectedError("Dosyanın türü içeriğiyle uyuşmuyor.");
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  return { path: `requests/${requestId}/${sha256}.${header.type === "jpeg" ? "jpg" : header.type}`, mime, bytes };
}

export const contactAttachments = {
  async upload(path: string, bytes: Uint8Array, mime: string): Promise<void> {
    await checkedProject();
    const res = await fetch(`${base()}/storage/v1/object/${CONTACT_ATTACHMENT_BUCKET}/${path}`, {
      method: "POST",
      headers: headers({ "Content-Type": mime, "x-upsert": "true" }),
      body: Buffer.from(bytes),
      cache: "no-store",
    });
    if (!res.ok) throw new AttachmentStorageError(res.status, await res.text());
  },

  /** Removes objects; paths that are already gone are not an error. */
  async remove(paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    await checkedProject();
    const res = await fetch(`${base()}/storage/v1/object/${CONTACT_ATTACHMENT_BUCKET}`, {
      method: "DELETE",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ prefixes: paths }),
      cache: "no-store",
    });
    if (!res.ok && res.status !== 404) throw new AttachmentStorageError(res.status, await res.text());
  },

  /** Short-lived addresses for Merkez, by path; a path that couldn't be signed is left out. */
  async signedUrls(paths: string[]): Promise<Record<string, string>> {
    if (paths.length === 0) return {};
    await checkedProject();
    const res = await fetch(`${base()}/storage/v1/object/sign/${CONTACT_ATTACHMENT_BUCKET}`, {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ expiresIn: SIGNED_URL_SECONDS, paths }),
      cache: "no-store",
    });
    if (!res.ok) throw new AttachmentStorageError(res.status, await res.text());
    const rows = (await res.json()) as { path?: string | null; signedURL?: string | null; error?: string | null }[];
    const out: Record<string, string> = {};
    for (const r of rows) {
      if (r.path && r.signedURL && !r.error) out[r.path] = `${base()}/storage/v1${r.signedURL}`;
    }
    return out;
  },
};
