/**
 * İletişim talepleri — server-only access rules (D43).
 *
 * - The form: anyone may send, only where the form is open (test data), and
 *   the sender is identified for the rate limit by an HMAC of the IP — the
 *   IP itself is never stored.
 * - Reading and managing: Merkez (SUPER_ADMIN) only. Hiding the menu isn't
 *   the boundary: every function here refuses a branch account, and the
 *   database refuses any actor but "merkez".
 */

import { createHmac } from "node:crypto";
import type { AdminRole, AdminScope } from "../admin/access";
import { getContactStore, type SubmitResult } from "./store";
import { contactAttachments } from "./attachments";
import type { ContactRequest, ContactRequestPage, ContactStatus, ContactSubject } from "./types";

if (typeof window !== "undefined") {
  throw new Error("contact/service.ts must never be imported on the client");
}

export class ContactAccessError extends Error {
  constructor() {
    super("CONTACT_FORBIDDEN");
    this.name = "ContactAccessError";
  }
}

function assertSuperAdmin(role: AdminRole): void {
  if (role !== "SUPER_ADMIN") throw new ContactAccessError();
}

/** The visitor's address from the platform's headers (Vercel sets them). */
export function clientAddress(headers: Headers): string {
  return (
    headers.get("x-real-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/**
 * Rate-limit key: HMAC-SHA256 of the address with a server secret — the same
 * sender gets the same key on every instance, and the address can't be read
 * back from the database. null when the secret is missing (then nothing is sent).
 */
export function contactClientKey(address: string): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) return null;
  return createHmac("sha256", secret).update(`contact:${address}`).digest("hex").slice(0, 64);
}

export async function submitContactRequest(input: {
  fullName: string;
  phone: string | null;
  email: string | null;
  subject: ContactSubject;
  message: string;
  attachmentPath?: string | null;
  clientRequestId: string;
  clientKey: string;
}): Promise<SubmitResult> {
  return getContactStore().submit({ ...input, attachmentPath: input.attachmentPath ?? null });
}

/** Signed addresses for the rows' photos (Merkez only); a failure leaves them null and is logged. */
async function withAttachmentUrls(rows: ContactRequest[]): Promise<ContactRequest[]> {
  const paths = rows.map((r) => r.attachmentPath).filter((p): p is string => Boolean(p));
  if (paths.length === 0) return rows;
  let urls: Record<string, string> = {};
  try {
    urls = await contactAttachments.signedUrls(paths);
  } catch (err) {
    console.error("[contact] photo addresses could not be signed", { error: (err as Error).message.slice(0, 200) });
  }
  return rows.map((r) => (r.attachmentPath ? { ...r, attachmentUrl: urls[r.attachmentPath] ?? null } : r));
}

export async function listContactRequests(
  role: AdminRole,
  q: { status?: ContactStatus | null; limit?: number; offset?: number } = {},
): Promise<ContactRequestPage> {
  assertSuperAdmin(role);
  const page = await getContactStore().list({ status: q.status ?? null, limit: q.limit ?? 50, offset: q.offset ?? 0 });
  return { ...page, rows: await withAttachmentUrls(page.rows) };
}

/** Merkez change: the actor is the session's admin, never a request field. */
export async function updateContactRequest(
  scope: AdminScope,
  id: string,
  change: { status: ContactStatus | null; note?: string | null },
): Promise<ContactRequest> {
  assertSuperAdmin(scope.user.role);
  const row = await getContactStore().update(id, change, { account: "merkez", name: scope.user.name });
  return (await withAttachmentUrls([row]))[0];
}
