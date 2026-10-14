"use client";

import { useState } from "react";
import {
  CONTACT_LIMITS,
  CONTACT_SUBJECTS,
  validateContactInput,
  type ContactField,
  type ContactFormInput,
} from "@/lib/contact";

const EMPTY: ContactFormInput = { fullName: "", phone: "", email: "", subject: "", message: "" };
type Errors = Partial<Record<ContactField | "contact", string>>;

function newRequestId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

const inputClass =
  "w-full px-4 py-3 bg-cream-light border text-espresso font-sans text-sm rounded-xl placeholder:text-mocha/50 focus:outline-none focus:border-gold transition-colors";
const labelClass = "block font-sans text-sm font-medium text-chocolate mb-1.5";
const errorClass = "mt-1.5 font-sans text-xs text-burgundy";

/**
 * /iletisim form (D43). "Received" only after the server answers 201 — that
 * is, after the database stored the row. A failed or lost answer keeps the
 * text and the same request id, so sending again can't create a second row.
 * Closed (Production for now): no form, the phone numbers and e-mail stay.
 */
export function ContactForm({ open }: { open: boolean }) {
  const [values, setValues] = useState<ContactFormInput>(EMPTY);
  const [trap, setTrap] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [requestId, setRequestId] = useState(newRequestId);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  if (!open) {
    return (
      <div role="status" className="rounded-2xl border border-sand-light bg-cream-light p-6">
        <p className="font-serif text-lg font-semibold text-chocolate">Çevrimiçi form şu an kapalı</p>
        <p className="mt-2 font-sans text-sm leading-relaxed text-warm-brown">
          Bize şubelerimizi arayarak veya{" "}
          <a href="mailto:info@funda1959.com" className="font-semibold text-chocolate underline">
            info@funda1959.com
          </a>{" "}
          adresine e-posta göndererek ulaşabilirsiniz.
        </p>
      </div>
    );
  }

  if (state === "sent") {
    return (
      <div role="status" className="rounded-2xl border border-sand-light bg-cream-light p-6">
        <p className="font-serif text-lg font-semibold text-chocolate">Mesajınız alındı</p>
        <p className="mt-2 font-sans text-sm leading-relaxed text-warm-brown">
          Talebinizi inceleyip belirttiğiniz iletişim kanalından dönüş yapacağız.
        </p>
        <button
          type="button"
          onClick={() => {
            setValues(EMPTY);
            setErrors({});
            setRequestId(newRequestId());
            setState("idle");
          }}
          className="mt-5 font-sans text-sm font-semibold text-chocolate underline hover:text-warm-brown"
        >
          Yeni mesaj yaz
        </button>
      </div>
    );
  }

  const set = (field: ContactField) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((prev) => {
      if (!prev[field] && !(prev.contact && (field === "phone" || field === "email"))) return prev;
      const next = { ...prev };
      delete next[field];
      if (field === "phone" || field === "email") delete next.contact;
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "sending") return;
    const checked = validateContactInput(values);
    if (!checked.ok) {
      setErrors(checked.errors);
      setServerError(null);
      return;
    }
    setErrors({});
    setServerError(null);
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, clientRequestId: requestId, website: trap }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; error?: string; errors?: Errors };
      if (res.status === 201 && data.ok && typeof data.id === "string") {
        setState("sent");
        return;
      }
      if (data.errors) setErrors(data.errors);
      setServerError(data.error ?? "Mesajınız gönderilemedi. Lütfen tekrar deneyin.");
    } catch {
      setServerError("Bağlantı kurulamadı; mesajınız gönderilmedi. Tekrar deneyebilirsiniz — aynı mesaj iki kez kaydedilmez.");
    }
    setState("idle");
  };

  const sending = state === "sending";
  const border = (field: ContactField) => (errors[field] ? "border-burgundy/60" : "border-sand");

  return (
    <form className="space-y-5" onSubmit={submit} noValidate aria-busy={sending}>
      {serverError && (
        <p role="alert" className="rounded-xl border border-burgundy/30 bg-cream-light px-4 py-3 font-sans text-sm text-burgundy">
          {serverError}
        </p>
      )}

      <div>
        <label htmlFor="contact-name" className={labelClass}>
          Ad Soyad <span aria-hidden>*</span>
        </label>
        <input
          id="contact-name"
          type="text"
          autoComplete="name"
          maxLength={CONTACT_LIMITS.nameMax}
          value={values.fullName}
          onChange={set("fullName")}
          placeholder="Adınız Soyadınız"
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? "contact-name-error" : undefined}
          className={`${inputClass} ${border("fullName")}`}
        />
        {errors.fullName && <p id="contact-name-error" className={errorClass}>{errors.fullName}</p>}
      </div>

      <fieldset>
        <legend className="mb-1.5 font-sans text-xs text-mocha">
          Size dönebilmemiz için telefon veya e-postadan en az birini yazın.
        </legend>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-phone" className={labelClass}>Telefon</label>
            <input
              id="contact-phone"
              type="tel"
              autoComplete="tel"
              maxLength={20}
              value={values.phone}
              onChange={set("phone")}
              placeholder="05xx xxx xx xx"
              aria-invalid={!!errors.phone || !!errors.contact}
              aria-describedby={errors.phone ? "contact-phone-error" : errors.contact ? "contact-contact-error" : undefined}
              className={`${inputClass} ${errors.phone || errors.contact ? "border-burgundy/60" : "border-sand"}`}
            />
            {errors.phone && <p id="contact-phone-error" className={errorClass}>{errors.phone}</p>}
          </div>
          <div>
            <label htmlFor="contact-email" className={labelClass}>E-posta</label>
            <input
              id="contact-email"
              type="email"
              autoComplete="email"
              maxLength={CONTACT_LIMITS.emailMax}
              value={values.email}
              onChange={set("email")}
              placeholder="ornek@email.com"
              aria-invalid={!!errors.email || !!errors.contact}
              aria-describedby={errors.email ? "contact-email-error" : errors.contact ? "contact-contact-error" : undefined}
              className={`${inputClass} ${errors.email || errors.contact ? "border-burgundy/60" : "border-sand"}`}
            />
            {errors.email && <p id="contact-email-error" className={errorClass}>{errors.email}</p>}
          </div>
        </div>
        {errors.contact && <p id="contact-contact-error" className={errorClass}>{errors.contact}</p>}
      </fieldset>

      <div>
        <label htmlFor="contact-subject" className={labelClass}>
          Konu <span aria-hidden>*</span>
        </label>
        <select
          id="contact-subject"
          value={values.subject}
          onChange={set("subject")}
          aria-invalid={!!errors.subject}
          aria-describedby={`contact-subject-note${errors.subject ? " contact-subject-error" : ""}`}
          className={`${inputClass} ${border("subject")} appearance-none cursor-pointer`}
        >
          <option value="">Konu seçin...</option>
          {CONTACT_SUBJECTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <p id="contact-subject-note" className="mt-1.5 font-sans text-xs text-mocha">
          Özel gün ve kurumsal başvurular sipariş değildir; talep olarak alınır ve size dönüş yapılır.
        </p>
        {errors.subject && <p id="contact-subject-error" className={errorClass}>{errors.subject}</p>}
      </div>

      <div>
        <label htmlFor="contact-message" className={labelClass}>
          Mesajınız <span aria-hidden>*</span>
        </label>
        <textarea
          id="contact-message"
          rows={5}
          maxLength={CONTACT_LIMITS.messageMax}
          value={values.message}
          onChange={set("message")}
          placeholder="Mesajınızı yazın... Özel gün talepleri için pasta türü, boyutu, tarihi ve varsa özel isteklerinizi belirtin."
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          className={`${inputClass} ${border("message")} resize-none`}
        />
        {errors.message && <p id="contact-message-error" className={errorClass}>{errors.message}</p>}
      </div>

      {/* trap for bots: hidden from people and screen readers, never filled by hand */}
      <div aria-hidden className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Web sitesi</label>
        <input id="contact-website" type="text" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
      </div>

      <button
        type="submit"
        disabled={sending}
        className="w-full rounded-xl bg-chocolate py-4 font-sans text-sm font-semibold text-cream-light transition-colors duration-200 hover:bg-chocolate-light disabled:opacity-60"
      >
        {sending ? "Gönderiliyor…" : "Mesajı Gönder"}
      </button>

      <p className="text-center font-sans text-xs text-mocha">
        Talebinizi inceleyip belirttiğiniz iletişim kanalından dönüş yapacağız.
      </p>
    </form>
  );
}
