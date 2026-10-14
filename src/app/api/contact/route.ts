import { NextResponse } from "next/server";
import { PersistenceUnavailableError, assertPersistentWrite, logPersistenceRefusal } from "@/lib/persistence";
import { isContactFormOpen } from "@/lib/contact/config";
import { ContactNotReadyError, ContactRefusedError } from "@/lib/contact/store";
import { clientAddress, contactClientKey, submitContactRequest } from "@/lib/contact/service";
import { isValidContactRequestId, validateContactInput } from "@/lib/contact";

export const dynamic = "force-dynamic";

/**
 * POST /api/contact — the /iletisim form (D43).
 * { fullName, phone, email, subject, message, clientRequestId, website }
 * 201 { ok, id, createdAt } only for a row the database stored (a retry with
 * the same clientRequestId returns the same row). Closed on Production.
 * `website` is the hidden trap field: filled in -> refused, nothing stored.
 */

const CLOSED = "Çevrimiçi iletişim formu şu an kapalı. Şubelerimizi arayarak veya e-posta ile bize ulaşabilirsiniz.";
const UNAVAILABLE = "Mesajınız şu an kaydedilemedi. Lütfen daha sonra tekrar deneyin veya şubelerimizi arayın.";
const NOT_SENT = "Mesajınız gönderilemedi. Lütfen formu kontrol edip tekrar deneyin.";

const REFUSAL: Record<string, { status: number; error: string }> = {
  rate_limited: { status: 429, error: "Kısa sürede çok sayıda mesaj gönderildi. Lütfen biraz sonra tekrar deneyin veya şubelerimizi arayın." },
  contact_required: { status: 400, error: "Size dönebilmemiz için telefon veya e-posta adresinizden en az birini yazın." },
  invalid_name: { status: 400, error: "Adınızı ve soyadınızı yazın." },
  invalid_phone: { status: 400, error: "Geçerli bir telefon numarası yazın." },
  invalid_email: { status: 400, error: "Geçerli bir e-posta adresi yazın." },
  invalid_subject: { status: 400, error: "Bir konu seçin." },
  invalid_message: { status: 400, error: "Mesajınızı yazın (en az 10, en fazla 3.000 karakter)." },
};

type Body = Record<string, unknown>;

export async function POST(request: Request) {
  // Production: closed before the body is even read — no request field can reopen it
  if (!isContactFormOpen()) {
    console.error("[api/contact] refused: the contact form is closed in this environment");
    return NextResponse.json({ ok: false, error: CLOSED }, { status: 503 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
    if (!body || typeof body !== "object") throw new Error("not an object");
  } catch {
    return NextResponse.json({ ok: false, error: NOT_SENT }, { status: 400 });
  }

  if (typeof body.website === "string" && body.website.trim() !== "") {
    console.warn("[api/contact] refused: trap field filled");
    return NextResponse.json({ ok: false, error: NOT_SENT }, { status: 400 });
  }
  if (!isValidContactRequestId(body.clientRequestId)) {
    return NextResponse.json({ ok: false, error: NOT_SENT }, { status: 400 });
  }
  const checked = validateContactInput({
    fullName: body.fullName,
    phone: body.phone,
    email: body.email,
    subject: body.subject,
    message: body.message,
  });
  if (!checked.ok) {
    return NextResponse.json({ ok: false, error: Object.values(checked.errors)[0], errors: checked.errors }, { status: 400 });
  }

  // never "sent" without a database: wrong / missing project -> 503
  try {
    const target = await assertPersistentWrite("contact");
    if (target !== "database") return NextResponse.json({ ok: false, error: UNAVAILABLE }, { status: 503 });
  } catch (err) {
    if (!(err instanceof PersistenceUnavailableError)) throw err;
    logPersistenceRefusal(err);
    return NextResponse.json({ ok: false, error: UNAVAILABLE }, { status: 503 });
  }

  const clientKey = contactClientKey(clientAddress(request.headers));
  if (!clientKey) {
    console.error("[api/contact] refused: ADMIN_SESSION_SECRET missing — no rate-limit key");
    return NextResponse.json({ ok: false, error: UNAVAILABLE }, { status: 503 });
  }

  try {
    const saved = await submitContactRequest({ ...checked.value, clientRequestId: body.clientRequestId, clientKey });
    return NextResponse.json({ ok: true, id: saved.id, createdAt: saved.createdAt }, { status: 201 });
  } catch (err) {
    if (err instanceof ContactRefusedError && REFUSAL[err.code]) {
      const m = REFUSAL[err.code];
      return NextResponse.json({ ok: false, error: m.error }, { status: m.status });
    }
    if (err instanceof ContactNotReadyError) {
      console.error("[api/contact] contact_requests not set up (0012)", { error: err.message });
      return NextResponse.json({ ok: false, error: UNAVAILABLE }, { status: 503 });
    }
    console.error("[api/contact] not stored", { error: (err as Error).message.slice(0, 300) });
    return NextResponse.json({ ok: false, error: UNAVAILABLE }, { status: 502 });
  }
}
