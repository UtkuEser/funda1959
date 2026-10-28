import { NextResponse } from "next/server";
import { PersistenceUnavailableError, assertPersistentWrite, logPersistenceRefusal } from "@/lib/persistence";
import { isContactFormOpen } from "@/lib/contact/config";
import { ContactNotReadyError, ContactRefusedError } from "@/lib/contact/store";
import { clientAddress, contactClientKey, submitContactRequest } from "@/lib/contact/service";
import {
  CUSTOM_CAKE_IMAGE,
  CUSTOM_CAKE_SUBJECT,
  isValidContactRequestId,
  validateContactInput,
  validateCustomCakeInput,
} from "@/lib/contact";
import { AttachmentRejectedError, AttachmentStorageError, checkAttachment, contactAttachments } from "@/lib/contact/attachments";
import { DataEnvironmentError } from "@/lib/supabase-server";
import { istanbulDateISO } from "@/lib/time/istanbul";

export const dynamic = "force-dynamic";

/**
 * POST /api/contact — the /iletisim form (D43) and the home page "Kutlamanıza
 * özel bir pasta" form.
 *   iletişim (JSON):  { fullName, phone, email, subject, message, clientRequestId, website }
 *   özel pasta (multipart/form-data):  form=custom-cake, fullName, phone,
 *                celebration, guests, eventDate, note, clientRequestId,
 *                website and an optional `image` — checked here (event date
 *                from today, Europe/Istanbul; the photo by its content) and
 *                stored as a request with subject "ozel-pasta"; the photo goes
 *                to the private bucket first (0016). Never an order.
 * 201 { ok, id, createdAt } only for a row the database stored (a retry with
 * the same clientRequestId returns the same row). Closed on Production.
 * `website` is the hidden trap field: filled in -> refused, nothing stored.
 */

const CLOSED = "Çevrimiçi iletişim formu şu an kapalı. Şubelerimizi arayarak veya e-posta ile bize ulaşabilirsiniz.";
const UNAVAILABLE = "Mesajınız şu an kaydedilemedi. Lütfen daha sonra tekrar deneyin veya şubelerimizi arayın.";
const NOT_SENT = "Mesajınız gönderilemedi. Lütfen formu kontrol edip tekrar deneyin.";
const CAKE_UNAVAILABLE = "Talebiniz şu an kaydedilemedi. Lütfen daha sonra tekrar deneyin veya şubelerimizi arayın.";
/** the database doesn't know the "ozel-pasta" subject / the photo bucket yet */
const CAKE_NOT_SET_UP =
  "Özel pasta talepleri henüz kaydedilemiyor: veritabanı kurulumu tamamlanmadı (migration 0016). Talebiniz kaydedilmedi; lütfen şubelerimizi arayın.";
const IMAGE_NOT_STORED = "Görsel kaydedilemedi; talebiniz gönderilmedi. Lütfen tekrar deneyin veya görseli kaldırıp gönderin.";
const TOO_LARGE = "Görsel en fazla 4 MB olabilir.";

const REFUSAL: Record<string, { status: number; error: string }> = {
  rate_limited: { status: 429, error: "Kısa sürede çok sayıda mesaj gönderildi. Lütfen biraz sonra tekrar deneyin veya şubelerimizi arayın." },
  contact_required: { status: 400, error: "Size dönebilmemiz için telefon veya e-posta adresinizden en az birini yazın." },
  invalid_name: { status: 400, error: "Adınızı ve soyadınızı yazın." },
  invalid_phone: { status: 400, error: "Geçerli bir telefon numarası yazın." },
  invalid_email: { status: 400, error: "Geçerli bir e-posta adresi yazın." },
  invalid_subject: { status: 400, error: "Bir konu seçin." },
  invalid_message: { status: 400, error: "Mesajınızı yazın (en az 10, en fazla 3.000 karakter)." },
  invalid_attachment: { status: 400, error: "Görsel kaydedilemedi; lütfen görseli yeniden seçin." },
};

type Body = Record<string, unknown>;

export async function POST(request: Request) {
  // Production: closed before the body is even read — no request field can reopen it
  if (!isContactFormOpen()) {
    console.error("[api/contact] refused: the contact form is closed in this environment");
    return NextResponse.json({ ok: false, error: CLOSED }, { status: 503 });
  }

  // the özel pasta form comes as multipart (it may carry a photo); refuse an oversized body before reading it
  const multipart = (request.headers.get("content-type") ?? "").startsWith("multipart/form-data");
  if (multipart && Number(request.headers.get("content-length") ?? 0) > CUSTOM_CAKE_IMAGE.maxBytes + 64 * 1024) {
    return NextResponse.json({ ok: false, error: TOO_LARGE, errors: { image: TOO_LARGE } }, { status: 413 });
  }

  let body: Body;
  let image: File | null = null;
  try {
    if (multipart) {
      body = {};
      for (const [key, value] of (await request.formData()).entries()) {
        if (typeof value === "string") body[key] = value;
        else if (key === "image" && value.size > 0) image = value;
      }
    } else {
      body = (await request.json()) as Body;
    }
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
  const isCake = body.form === "custom-cake";
  const unavailable = isCake ? CAKE_UNAVAILABLE : UNAVAILABLE;
  const cake = isCake
    ? validateCustomCakeInput(
        { fullName: body.fullName, phone: body.phone, celebration: body.celebration, guests: body.guests, eventDate: body.eventDate, note: body.note },
        istanbulDateISO(),
      )
    : null;
  const checked = cake
    ? cake.ok
      ? { ok: true as const, value: { ...cake.value, email: null, subject: CUSTOM_CAKE_SUBJECT } }
      : cake
    : validateContactInput({
        fullName: body.fullName,
        phone: body.phone,
        email: body.email,
        subject: body.subject,
        message: body.message,
      });
  if (!checked.ok) {
    return NextResponse.json({ ok: false, error: Object.values(checked.errors)[0], errors: checked.errors }, { status: 400 });
  }

  // a photo only comes with the özel pasta form, checked by its content before anything is stored
  if (image && !isCake) return NextResponse.json({ ok: false, error: NOT_SENT }, { status: 400 });
  let attachment: ReturnType<typeof checkAttachment> | null = null;
  if (image) {
    if (image.size > CUSTOM_CAKE_IMAGE.maxBytes) return NextResponse.json({ ok: false, error: TOO_LARGE, errors: { image: TOO_LARGE } }, { status: 413 });
    try {
      attachment = checkAttachment(new Uint8Array(await image.arrayBuffer()), image.type || null, body.clientRequestId);
    } catch (err) {
      if (!(err instanceof AttachmentRejectedError)) throw err;
      return NextResponse.json({ ok: false, error: err.reason, errors: { image: err.reason } }, { status: 400 });
    }
  }

  // never "sent" without a database: wrong / missing project -> 503
  try {
    const target = await assertPersistentWrite("contact");
    if (target !== "database") return NextResponse.json({ ok: false, error: unavailable }, { status: 503 });
  } catch (err) {
    if (!(err instanceof PersistenceUnavailableError)) throw err;
    logPersistenceRefusal(err);
    return NextResponse.json({ ok: false, error: unavailable }, { status: 503 });
  }

  const clientKey = contactClientKey(clientAddress(request.headers));
  if (!clientKey) {
    console.error("[api/contact] refused: ADMIN_SESSION_SECRET missing — no rate-limit key");
    return NextResponse.json({ ok: false, error: unavailable }, { status: 503 });
  }

  // the photo first (private bucket): the request row then points at a stored object
  if (attachment) {
    try {
      await contactAttachments.upload(attachment.path, attachment.bytes, attachment.mime);
    } catch (err) {
      if (err instanceof AttachmentStorageError && err.bucketMissing) {
        console.error("[api/contact] custom cake photo refused: bucket \"contact-attachments\" missing — apply migration 0016");
        return NextResponse.json({ ok: false, error: CAKE_NOT_SET_UP, code: "SETUP_REQUIRED" }, { status: 503 });
      }
      if (err instanceof DataEnvironmentError) return NextResponse.json({ ok: false, error: unavailable }, { status: 503 });
      console.error("[api/contact] custom cake photo not stored", { error: (err as Error).message.slice(0, 300) });
      return NextResponse.json({ ok: false, error: IMAGE_NOT_STORED }, { status: 502 });
    }
  }
  const dropPhoto = () =>
    attachment
      ? contactAttachments.remove([attachment.path]).catch((e: Error) => console.error("[api/contact] unused photo not removed", { error: e.message.slice(0, 200) }))
      : Promise.resolve();

  try {
    const saved = await submitContactRequest({
      ...checked.value,
      attachmentPath: attachment?.path ?? null,
      clientRequestId: body.clientRequestId,
      clientKey,
    });
    // already stored earlier (a retry) with another photo: this one belongs to nothing
    if (attachment && saved.attachmentPath !== attachment.path) await dropPhoto();
    return NextResponse.json({ ok: true, id: saved.id, createdAt: saved.createdAt }, { status: 201 });
  } catch (err) {
    // nothing references the photo when the request wasn't stored
    await dropPhoto();
    // the subject was checked above, so the database refusing it means 0016 isn't applied
    if (isCake && err instanceof ContactRefusedError && err.code === "invalid_subject") {
      console.error("[api/contact] custom cake request refused: subject \"ozel-pasta\" unknown to the database — apply migration 0016");
      return NextResponse.json({ ok: false, error: CAKE_NOT_SET_UP, code: "SETUP_REQUIRED" }, { status: 503 });
    }
    if (err instanceof ContactRefusedError && REFUSAL[err.code]) {
      const m = REFUSAL[err.code];
      return NextResponse.json({ ok: false, error: m.error }, { status: m.status });
    }
    if (err instanceof ContactNotReadyError) {
      console.error("[api/contact] contact_requests not set up (0012)", { error: err.message });
      return NextResponse.json({ ok: false, error: unavailable }, { status: 503 });
    }
    console.error("[api/contact] not stored", { error: (err as Error).message.slice(0, 300) });
    return NextResponse.json({ ok: false, error: unavailable }, { status: 502 });
  }
}
