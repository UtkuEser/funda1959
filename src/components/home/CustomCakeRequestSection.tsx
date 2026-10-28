"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/shared/Container";
import {
  CELEBRATION_TYPES,
  CONTACT_LIMITS,
  CUSTOM_CAKE_IMAGE,
  CUSTOM_CAKE_LIMITS,
  validateCustomCakeInput,
  type CustomCakeField,
  type CustomCakeInput,
} from "@/lib/contact";
import { istanbulDateISO } from "@/lib/time/istanbul";
import { useNow } from "@/lib/time/use-now";

const EMPTY: CustomCakeInput = { fullName: "", phone: "", celebration: "", guests: "", eventDate: "", note: "" };
type Errors = Partial<Record<CustomCakeField | "image", string>>;

const CAKE_PHOTO = "/home/hero/3.png";
const CAKE_ALT = "Pembe güller ve altın detaylarla süslenmiş iki katlı kutlama pastası";

/** The reference photo as it will be sent (a blob URL shows it before sending). */
type Photo = { blob: Blob; name: string; bytes: number; previewUrl: string };

function newRequestId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

const kb = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/**
 * The chosen file, sent as is when it fits (JPEG / PNG / WebP, ≤ 4 MB, long
 * side ≤ 2400 px); a bigger or heavier photo is redrawn as a JPEG first. The
 * server checks the result again by its content.
 */
async function preparePhoto(file: File): Promise<{ blob: Blob; name: string } | { error: string }> {
  if (!(CUSTOM_CAKE_IMAGE.types as readonly string[]).includes(file.type)) {
    return { error: "Yalnızca JPEG, PNG veya WebP görsel ekleyebilirsiniz." };
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { error: "Görsel okunamadı; başka bir dosya seçin." };
  }
  const long = Math.max(bitmap.width, bitmap.height);
  if (long <= CUSTOM_CAKE_IMAGE.maxSide && file.size <= CUSTOM_CAKE_IMAGE.maxBytes) {
    bitmap.close();
    return { blob: file, name: file.name };
  }
  const scale = Math.min(1, CUSTOM_CAKE_IMAGE.maxSide / long);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { error: "Görsel hazırlanamadı; daha küçük bir dosya seçin." };
  }
  ctx.fillStyle = "#ffffff"; // a transparent PNG becomes a JPEG on white
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
  if (!blob) return { error: "Görsel hazırlanamadı; daha küçük bir dosya seçin." };
  if (blob.size > CUSTOM_CAKE_IMAGE.maxBytes) return { error: "Görsel en fazla 4 MB olabilir; daha küçük bir görsel seçin." };
  return { blob, name: `${file.name.replace(/\.[^.]+$/, "") || "gorsel"}.jpg` };
}

const labelClass = "mb-1.5 block font-sans text-[13px] font-semibold text-espresso";
const fieldClass =
  "w-full rounded-lg border bg-white px-3.5 font-sans text-[14.5px] text-espresso placeholder:text-taupe/70 transition-colors focus:border-burgundy focus:outline-none";
const errorClass = "mt-1.5 font-sans text-[12.5px] text-burgundy";

/**
 * Home page "Kutlamanıza özel bir pasta" — one form, no steps, no suggested
 * products; an optional reference photo with the note. Sent through the
 * iletişim talepleri path (POST /api/contact, subject "ozel-pasta"; the photo
 * to the private bucket): "Talebiniz alındı" only after the server answers
 * 201, i.e. the database stored the row. A failed or lost answer keeps every
 * field, the photo and the same request id, so sending again can't create a
 * second row. Closed (Production for now): no form, the phone numbers and
 * e-mail stay.
 */
export function CustomCakeRequestSection({ open }: { open: boolean }) {
  const [values, setValues] = useState<CustomCakeInput>(EMPTY);
  const [trap, setTrap] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [requestId, setRequestId] = useState(newRequestId);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  // today in Europe/Istanbul — earlier event dates can't be chosen ("" before mount)
  const now = useNow();
  const today = now ? istanbulDateISO(now) : "";

  // the preview's blob URL is released when the photo changes or the page goes
  const previewRef = useRef<string | null>(null);
  useEffect(() => {
    previewRef.current = photo?.previewUrl ?? null;
  }, [photo]);
  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  const replacePhoto = (next: Photo | null) => {
    setPhoto((cur) => {
      if (cur) URL.revokeObjectURL(cur.previewUrl);
      return next;
    });
  };

  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // the same file can be chosen again after "Kaldır"
    if (!file) return;
    setErrors((prev) => {
      if (!prev.image) return prev;
      const next = { ...prev };
      delete next.image;
      return next;
    });
    setPhotoBusy(true);
    const ready = await preparePhoto(file);
    setPhotoBusy(false);
    if ("error" in ready) {
      setErrors((prev) => ({ ...prev, image: ready.error }));
      return;
    }
    replacePhoto({ blob: ready.blob, name: ready.name, bytes: ready.blob.size, previewUrl: URL.createObjectURL(ready.blob) });
  };

  const set = (field: CustomCakeField) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = field === "guests" ? e.target.value.replace(/\D/g, "").slice(0, 5) : e.target.value;
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "sending" || photoBusy) return;
    const checked = validateCustomCakeInput(values, today);
    if (!checked.ok) {
      setErrors(checked.errors);
      setServerError(null);
      return;
    }
    setErrors({});
    setServerError(null);
    setState("sending");
    try {
      const form = new FormData();
      form.set("form", "custom-cake");
      for (const [key, value] of Object.entries(values)) form.set(key, value);
      form.set("clientRequestId", requestId);
      form.set("website", trap);
      if (photo) form.set("image", photo.blob, photo.name);
      const res = await fetch("/api/contact", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; error?: string; errors?: Errors };
      if (res.status === 201 && data.ok && typeof data.id === "string") {
        setState("sent");
        return;
      }
      if (data.errors) setErrors(data.errors);
      setServerError(data.error ?? "Talebiniz gönderilemedi. Lütfen tekrar deneyin.");
    } catch {
      setServerError("Bağlantı kurulamadı; talebiniz gönderilmedi. Tekrar deneyebilirsiniz — aynı talep iki kez kaydedilmez.");
    }
    setState("idle");
  };

  const sending = state === "sending";
  const border = (field: CustomCakeField) => (errors[field] ? "border-burgundy/60" : "border-sand");
  const described = (field: CustomCakeField) => (errors[field] ? `cake-${field}-error` : undefined);
  const fieldError = (field: CustomCakeField) =>
    errors[field] ? (
      <p id={`cake-${field}-error`} className={errorClass}>
        {errors[field]}
      </p>
    ) : null;

  let body: React.ReactNode;
  if (!open) {
    body = (
      <div role="status" className="rounded-2xl border border-sand-light bg-white/60 p-6 md:p-8">
        <p className="font-serif text-[20px] font-semibold text-burgundy">Çevrimiçi talep formu şu an kapalı</p>
        <p className="mt-2 font-sans text-[14px] leading-relaxed text-warm-brown">
          Özel pasta talepleriniz için{" "}
          <Link href="/iletisim" className="font-semibold text-burgundy underline underline-offset-2">
            şubelerimizi arayabilir
          </Link>{" "}
          veya{" "}
          <a href="mailto:info@funda1959.com" className="font-semibold text-burgundy underline underline-offset-2">
            info@funda1959.com
          </a>{" "}
          adresine yazabilirsiniz.
        </p>
      </div>
    );
  } else if (state === "sent") {
    body = (
      <div role="status" className="rounded-2xl border border-sand-light bg-white/60 p-6 md:p-8">
        <p className="font-serif text-[22px] font-semibold text-burgundy">Talebiniz alındı</p>
        <p className="mt-2 font-sans text-[14.5px] leading-relaxed text-warm-brown">
          Özel pasta talebinizi inceleyip telefonla size dönüş yapacağız. Bu talep bir sipariş değildir.
        </p>
        <button
          type="button"
          onClick={() => {
            setValues(EMPTY);
            setErrors({});
            replacePhoto(null);
            setRequestId(newRequestId());
            setState("idle");
          }}
          className="mt-5 font-sans text-[13.5px] font-semibold text-burgundy underline underline-offset-2 hover:text-chocolate-light"
        >
          Yeni talep oluştur
        </button>
      </div>
    );
  } else {
    body = (
      <form
        onSubmit={submit}
        noValidate
        aria-busy={sending}
        className="rounded-2xl border border-sand-light bg-white/60 p-5 sm:p-7"
      >
        {serverError && (
          <p role="alert" className="mb-5 rounded-lg border border-burgundy/30 bg-cream-light px-4 py-3 font-sans text-[13.5px] leading-relaxed text-burgundy">
            {serverError}
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="cake-fullName" className={labelClass}>
              Ad Soyad
            </label>
            <input
              id="cake-fullName"
              type="text"
              autoComplete="name"
              required
              maxLength={CONTACT_LIMITS.nameMax}
              value={values.fullName}
              onChange={set("fullName")}
              aria-invalid={!!errors.fullName}
              aria-describedby={described("fullName")}
              className={`${fieldClass} h-12 ${border("fullName")}`}
            />
            {fieldError("fullName")}
          </div>

          <div>
            <label htmlFor="cake-phone" className={labelClass}>
              Telefon
            </label>
            <input
              id="cake-phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              required
              maxLength={20}
              value={values.phone}
              onChange={set("phone")}
              placeholder="05xx xxx xx xx"
              aria-invalid={!!errors.phone}
              aria-describedby={described("phone")}
              className={`${fieldClass} h-12 ${border("phone")}`}
            />
            {fieldError("phone")}
          </div>

          <div>
            <label htmlFor="cake-celebration" className={labelClass}>
              Kutlama Türü
            </label>
            <div className="relative">
              <select
                id="cake-celebration"
                required
                value={values.celebration}
                onChange={set("celebration")}
                aria-invalid={!!errors.celebration}
                aria-describedby={described("celebration")}
                className={`${fieldClass} h-12 cursor-pointer appearance-none pr-10 ${border("celebration")} ${values.celebration ? "" : "text-taupe"}`}
              >
                <option value="">Seçin</option>
                {CELEBRATION_TYPES.map((t) => (
                  <option key={t} value={t} className="text-espresso">
                    {t}
                  </option>
                ))}
              </select>
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-burgundy/60"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
              </svg>
            </div>
            {fieldError("celebration")}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="cake-guests" className={labelClass}>
                Kişi Sayısı
              </label>
              <input
                id="cake-guests"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                value={values.guests}
                onChange={set("guests")}
                placeholder="Ör. 20"
                aria-invalid={!!errors.guests}
                aria-describedby={described("guests")}
                className={`${fieldClass} h-12 ${border("guests")}`}
              />
              {fieldError("guests")}
            </div>

            <div>
              <label htmlFor="cake-eventDate" className={labelClass}>
                Etkinlik Tarihi
              </label>
              <input
                id="cake-eventDate"
                type="date"
                required
                min={today || undefined}
                value={values.eventDate}
                onChange={set("eventDate")}
                aria-invalid={!!errors.eventDate}
                aria-describedby={described("eventDate")}
                className={`${fieldClass} h-12 ${border("eventDate")}`}
              />
              {fieldError("eventDate")}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="cake-note" className={labelClass}>
              Notunuz <span className="font-normal text-taupe">(isteğe bağlı)</span>
            </label>
            <textarea
              id="cake-note"
              rows={4}
              maxLength={CUSTOM_CAKE_LIMITS.noteMax}
              value={values.note}
              onChange={set("note")}
              placeholder="Pastanın tasarımı, lezzeti, üzerine yazılacak yazı veya özel istekleriniz…"
              aria-invalid={!!errors.note}
              aria-describedby={described("note")}
              className={`${fieldClass} resize-none py-3 leading-relaxed ${border("note")}`}
            />
            {fieldError("note")}

            {/* optional reference photo — stored privately with the request */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              {photo ? (
                <div className="flex min-w-0 max-w-full items-center gap-3 rounded-lg border border-sand bg-white p-2 pr-3">
                  {/* the chosen file (blob URL), shown as is */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.previewUrl} alt="Eklenen görsel" className="h-12 w-12 shrink-0 rounded-md object-cover" />
                  <div className="min-w-0">
                    <p className="max-w-[14rem] truncate font-sans text-[13px] text-espresso">{photo.name}</p>
                    <p className="font-sans text-[12px] text-taupe">{kb(photo.bytes)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => replacePhoto(null)}
                    disabled={sending}
                    className="ml-1 shrink-0 font-sans text-[12.5px] font-semibold text-burgundy underline underline-offset-2 hover:text-chocolate-light disabled:opacity-60"
                  >
                    Kaldır
                  </button>
                </div>
              ) : (
                <label
                  className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border bg-white px-4 font-sans text-[13px] font-semibold text-burgundy transition-colors focus-within:ring-2 focus-within:ring-burgundy/30 hover:border-burgundy/50 ${
                    errors.image ? "border-burgundy/60" : "border-sand"
                  }`}
                >
                  <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                    <rect x="3.5" y="5" width="17" height="14" rx="2" strokeWidth={1.6} />
                    <circle cx="9" cy="10" r="1.6" strokeWidth={1.6} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M20.5 15.5l-5-5L7 19" />
                  </svg>
                  {photoBusy ? "Görsel hazırlanıyor…" : "Görsel ekle"}
                  <input
                    type="file"
                    accept={CUSTOM_CAKE_IMAGE.types.join(",")}
                    onChange={(e) => void pickPhoto(e)}
                    disabled={photoBusy || sending}
                    aria-describedby={errors.image ? "cake-image-error" : "cake-image-hint"}
                    className="sr-only"
                  />
                </label>
              )}
              <span id="cake-image-hint" className="font-sans text-[12px] text-taupe">
                İsteğe bağlı · örnek görsel · JPEG, PNG veya WebP, en fazla 4 MB
              </span>
            </div>
            {errors.image && (
              <p id="cake-image-error" className={errorClass}>
                {errors.image}
              </p>
            )}
          </div>
        </div>

        {/* trap for bots: hidden from people and screen readers, never filled by hand */}
        <div aria-hidden className="absolute -left-[10000px] h-px w-px overflow-hidden">
          <label htmlFor="cake-website">Web sitesi</label>
          <input id="cake-website" type="text" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <button
            type="submit"
            disabled={sending || photoBusy}
            className="h-12 w-full shrink-0 rounded-lg bg-burgundy px-8 font-sans text-[14.5px] font-semibold text-cream-light transition-colors hover:bg-chocolate-light disabled:opacity-60 sm:w-auto"
          >
            {sending ? "Gönderiliyor…" : "Talep Gönder"}
          </button>
          <p className="font-sans text-[12.5px] leading-relaxed text-taupe">
            Bu form bir sipariş oluşturmaz. Detaylar için sizinle iletişime geçeceğiz.
          </p>
        </div>
      </form>
    );
  }

  return (
    <section aria-labelledby="custom-cake-title" className="bg-cream-light">
      <Container>
        <div className="grid items-start gap-8 py-14 md:py-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-stretch lg:gap-16">
          <div className="flex min-w-0 flex-col lg:pt-2">
            <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-burgundy/60">Özel Pasta</p>
            <h2
              id="custom-cake-title"
              className="mt-3 font-serif text-[30px] font-semibold leading-[1.1] tracking-[-0.01em] text-burgundy sm:text-[38px] xl:text-[44px]"
            >
              Kutlamanıza özel bir pasta
            </h2>
            <p className="mt-3 max-w-[26rem] font-sans text-[15px] leading-relaxed text-warm-brown md:text-[16px]">
              Hayalinizdeki pastayı birlikte planlayalım.
            </p>
            {/* desktop: fills the column down to the form's end; phones keep the form first */}
            <div className="relative mt-8 hidden min-h-[280px] flex-1 overflow-hidden rounded-2xl bg-cream-dark lg:block">
              <Image
                src={CAKE_PHOTO}
                alt={CAKE_ALT}
                fill
                sizes="(min-width: 1320px) 470px, 36vw"
                className="object-cover"
                style={{ objectPosition: "52% 45%" }}
              />
            </div>
          </div>
          <div className="relative min-w-0">{body}</div>
        </div>
      </Container>
    </section>
  );
}
