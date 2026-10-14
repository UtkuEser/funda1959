import { NextResponse } from "next/server";
import { resolveAdminScope } from "@/lib/admin/access";
import { PersistenceUnavailableError, assertPersistentWrite, logPersistenceRefusal } from "@/lib/persistence";
import { ContactNotReadyError, ContactRefusedError } from "@/lib/contact/store";
import { ContactAccessError, listContactRequests, updateContactRequest } from "@/lib/contact/service";
import { CONTACT_LIMITS, CONTACT_STATUSES, type ContactStatus } from "@/lib/contact";

export const dynamic = "force-dynamic";

/**
 * İletişim talepleri — Merkez only (SUPER_ADMIN, from the signed session; D43).
 * GET ?status=&offset= — newest first, 50 per page, counts per status.
 * PATCH { id, status?, note? } — status and / or the internal note; the
 * session's admin is recorded as the one who handled it.
 */

const FORBIDDEN = { error: "Bu işlem için yetkiniz yok." } as const;
const NOT_READY = { error: "İletişim talepleri tablosu henüz kurulmadı (0012)." } as const;
const PAGE = 50;

const isStatus = (v: unknown): v is ContactStatus => typeof v === "string" && (CONTACT_STATUSES as readonly string[]).includes(v);

export async function GET(request: Request) {
  const scope = await resolveAdminScope();
  if (!scope) return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const rawStatus = params.get("status");
  if (rawStatus && !isStatus(rawStatus)) return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
  const status = rawStatus && isStatus(rawStatus) ? rawStatus : null;
  const offset = Math.max(0, Math.floor(Number(params.get("offset")) || 0));
  try {
    const page = await listContactRequests(scope.user.role, { status, limit: PAGE, offset });
    return NextResponse.json({ ok: true, ...page }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof ContactAccessError) return NextResponse.json(FORBIDDEN, { status: 403 });
    if (err instanceof ContactNotReadyError) return NextResponse.json(NOT_READY, { status: 503 });
    console.error("[api/admin/contact-requests] list failed", { error: (err as Error).message.slice(0, 300) });
    return NextResponse.json({ error: "Talepler okunamadı." }, { status: 502 });
  }
}

type PatchBody = { id?: unknown; status?: unknown; note?: unknown };

export async function PATCH(request: Request) {
  const scope = await resolveAdminScope();
  if (!scope) return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
  if (scope.user.role !== "SUPER_ADMIN") return NextResponse.json(FORBIDDEN, { status: 403 });

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id : "";
  const status = body.status === undefined || body.status === null ? null : isStatus(body.status) ? body.status : undefined;
  const note = body.note === undefined ? undefined : body.note === null ? null : typeof body.note === "string" ? body.note : false;
  if (!id || status === undefined || note === false) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  if (status === null && note === undefined) return NextResponse.json({ error: "Değişiklik yok." }, { status: 400 });
  if (typeof note === "string" && note.trim().length > CONTACT_LIMITS.noteMax) {
    return NextResponse.json({ error: `İç not en fazla ${CONTACT_LIMITS.noteMax.toLocaleString("tr-TR")} karakter olabilir.` }, { status: 400 });
  }

  try {
    const target = await assertPersistentWrite("contact");
    if (target !== "database") return NextResponse.json({ error: "Kaydedilemedi: kayıt servisi şu an kullanılamıyor." }, { status: 503 });
  } catch (err) {
    if (!(err instanceof PersistenceUnavailableError)) throw err;
    logPersistenceRefusal(err, { id });
    return NextResponse.json({ error: err.userMessage }, { status: 503 });
  }

  try {
    const saved = await updateContactRequest(scope, id, { status, ...(note !== undefined ? { note } : {}) });
    return NextResponse.json({ ok: true, request: saved });
  } catch (err) {
    if (err instanceof ContactAccessError) return NextResponse.json(FORBIDDEN, { status: 403 });
    if (err instanceof ContactNotReadyError) return NextResponse.json(NOT_READY, { status: 503 });
    if (err instanceof ContactRefusedError) {
      if (err.code === "not_found") return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
      if (err.code === "forbidden") return NextResponse.json(FORBIDDEN, { status: 403 });
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }
    console.error("[api/admin/contact-requests] update failed", { error: (err as Error).message.slice(0, 300) });
    return NextResponse.json({ error: "Kaydedilemedi." }, { status: 502 });
  }
}
