/**
 * İletişim talepleri in the database (migration 0012) — server-only.
 *
 * Every call is an RPC through `supabaseRest` (service role + environment
 * marker check). There is no in-memory stand-in: without Supabase nothing is
 * stored and the form says so instead of pretending.
 */

import { isSupabaseConfigured, SupabaseRestError, supabaseRest } from "../supabase-server";
import type { ContactRequest, ContactRequestPage, ContactStatus, ContactSubject } from "./types";

if (typeof window !== "undefined") {
  throw new Error("contact/store.ts must never be imported on the client");
}

/** Migration 0012 isn't applied to the connected project. */
export class ContactNotReadyError extends Error {
  constructor(detail: string) {
    super(`contact_requests table/functions missing (0012) — ${detail}`);
    this.name = "ContactNotReadyError";
  }
}

/** A rule the database refused (`raise exception` text), e.g. "rate_limited". */
export class ContactRefusedError extends Error {
  constructor(readonly code: string) {
    super(`contact request refused: ${code}`);
    this.name = "ContactRefusedError";
  }
}

const KNOWN_REFUSALS = new Set([
  "invalid_request_id",
  "invalid_client_key",
  "invalid_name",
  "contact_required",
  "invalid_phone",
  "invalid_email",
  "invalid_subject",
  "invalid_message",
  "invalid_attachment",
  "rate_limited",
  "forbidden",
  "invalid_status",
  "note_too_long",
  "not_found",
]);

type Row = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  subject: ContactSubject;
  message: string;
  status: ContactStatus;
  internal_note: string | null;
  created_at: string;
  handled_by: string | null;
  handled_at: string | null;
  note_updated_by: string | null;
  note_updated_at: string | null;
  /** 0016; absent before it is applied */
  attachment_path?: string | null;
};

const toRequest = (r: Row): ContactRequest => ({
  id: r.id,
  fullName: r.full_name,
  phone: r.phone,
  email: r.email,
  subject: r.subject,
  message: r.message,
  status: r.status,
  internalNote: r.internal_note,
  createdAt: r.created_at,
  handledBy: r.handled_by,
  handledAt: r.handled_at,
  noteUpdatedBy: r.note_updated_by,
  noteUpdatedAt: r.note_updated_at,
  attachmentPath: r.attachment_path ?? null,
  attachmentUrl: null,
});

function notReady(err: unknown): boolean {
  return (
    err instanceof SupabaseRestError &&
    (err.status === 404 || err.code === "PGRST202" || err.code === "PGRST205" || err.code === "42P01" || err.code === "42883")
  );
}

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  try {
    return await supabaseRest<T>(`/rpc/${name}`, { method: "POST", body: JSON.stringify(args) });
  } catch (err) {
    if (notReady(err)) throw new ContactNotReadyError(`${name}: ${(err as Error).message.slice(0, 160)}`);
    if (err instanceof SupabaseRestError && err.dbMessage && KNOWN_REFUSALS.has(err.dbMessage)) {
      throw new ContactRefusedError(err.dbMessage);
    }
    throw err;
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SubmitPayload = {
  fullName: string;
  phone: string | null;
  email: string | null;
  subject: ContactSubject;
  message: string;
  /** the request's photo, already stored in the private bucket (0016) */
  attachmentPath: string | null;
  clientRequestId: string;
  clientKey: string;
};

export type SubmitResult = { id: string; createdAt: string; duplicate: boolean; attachmentPath: string | null };

export type ContactStore = {
  readonly kind: "supabase" | "none";
  /** The stored row's id and time (and photo path) — only what the database returned. */
  submit(p: SubmitPayload): Promise<SubmitResult>;
  list(q: { status: ContactStatus | null; limit: number; offset: number }): Promise<ContactRequestPage>;
  update(
    id: string,
    change: { status: ContactStatus | null; note?: string | null },
    actor: { account: string; name: string },
  ): Promise<ContactRequest>;
};

export const supabaseContactStore: ContactStore = {
  kind: "supabase",

  async submit(p) {
    const r = await rpc<{ id?: unknown; created_at?: unknown; duplicate?: unknown; attachment_path?: unknown } | null>("submit_contact_request", {
      p_payload: {
        full_name: p.fullName,
        phone: p.phone,
        email: p.email,
        subject: p.subject,
        message: p.message,
        ...(p.attachmentPath ? { attachment_path: p.attachmentPath } : {}),
        client_request_id: p.clientRequestId,
        client_key: p.clientKey,
      },
    });
    // the visitor is told "received" only for a row the database confirmed
    if (!r || typeof r.id !== "string" || !UUID.test(r.id) || typeof r.created_at !== "string") {
      throw new Error("submit_contact_request returned no stored row");
    }
    // a photo sent but not on the row: the database (before 0016) ignored it — not "received"
    const attachmentPath = typeof r.attachment_path === "string" ? r.attachment_path : null;
    if (p.attachmentPath && r.duplicate !== true && attachmentPath !== p.attachmentPath) {
      throw new ContactNotReadyError("submit_contact_request did not store the photo path (0016)");
    }
    return { id: r.id, createdAt: r.created_at, duplicate: r.duplicate === true, attachmentPath };
  },

  async list({ status, limit, offset }) {
    const r = await rpc<{ counts?: Partial<Record<ContactStatus, number>>; total?: number; rows?: Row[] } | null>(
      "list_contact_requests",
      { p_status: status, p_limit: limit, p_offset: offset },
    );
    return {
      counts: {
        new: Number(r?.counts?.new ?? 0),
        in_progress: Number(r?.counts?.in_progress ?? 0),
        closed: Number(r?.counts?.closed ?? 0),
      },
      total: Number(r?.total ?? 0),
      rows: (r?.rows ?? []).map(toRequest),
    };
  },

  async update(id, change, actor) {
    if (!UUID.test(id)) throw new ContactRefusedError("not_found");
    const r = await rpc<Row>("update_contact_request", {
      p_id: id,
      p_status: change.status,
      p_set_note: change.note !== undefined,
      p_note: change.note ?? null,
      p_actor_account: actor.account,
      p_actor_name: actor.name,
    });
    return toRequest(r);
  },
};

/** No Supabase (developer machine without .env.local): nothing stored, nothing to list. */
export const noContactStore: ContactStore = {
  kind: "none",
  async submit() {
    throw new ContactNotReadyError("Supabase is not configured");
  },
  async list() {
    return { counts: { new: 0, in_progress: 0, closed: 0 }, total: 0, rows: [] };
  },
  async update() {
    throw new ContactNotReadyError("Supabase is not configured");
  },
};

let override: ContactStore | null = null;

/** verify scripts only */
export function setContactStoreForTests(next: ContactStore | null): void {
  override = next;
}

export function getContactStore(): ContactStore {
  return override ?? (isSupabaseConfigured() ? supabaseContactStore : noContactStore);
}
