"use client";

import { useState, type FormEvent } from "react";
import { site } from "@/content/site";

type RequestFormProps = {
  /** Oluşan e-postanın konusu. */
  subject: string;
  /** Talep türü seçenekleri. */
  topics: string[];
  submitLabel?: string;
  note?: string;
};

const fieldClass =
  "w-full border border-stone/40 bg-cream px-4 py-3 font-sans text-sm text-ink transition-colors placeholder:text-ink-mute/70 focus:border-bordo focus:outline-none";

const labelClass =
  "block font-sans text-[10px] uppercase tracking-[0.22em] text-ink-mute";

/**
 * Sunucu tarafı olmadan çalışan talep formu:
 * alanları derleyip hazır bir e-posta taslağı açar.
 * Bir sipariş altyapısı bağlandığında yalnızca handleSubmit değişir.
 */
export function RequestForm({
  subject,
  topics,
  submitLabel = "Talebi Gönder",
  note,
}: RequestFormProps) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    topic: topics[0] ?? "",
    date: "",
    message: "",
  });

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const body = [
      `Ad Soyad: ${form.name}`,
      `Telefon: ${form.phone}`,
      `E-posta: ${form.email}`,
      `Konu: ${form.topic}`,
      form.date ? `Tarih: ${form.date}` : null,
      "",
      form.message,
    ]
      .filter(Boolean)
      .join("\n");

    window.location.href = `${site.emailHref}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="request-name">
            Ad Soyad
          </label>
          <input
            id="request-name"
            required
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            className={`${fieldClass} mt-2`}
            placeholder="Adınız"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="request-phone">
            Telefon
          </label>
          <input
            id="request-phone"
            required
            type="tel"
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
            className={`${fieldClass} mt-2`}
            placeholder="0 5xx xxx xx xx"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="request-email">
            E-posta
          </label>
          <input
            id="request-email"
            required
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            className={`${fieldClass} mt-2`}
            placeholder="ornek@eposta.com"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="request-topic">
            Talep Konusu
          </label>
          <select
            id="request-topic"
            value={form.topic}
            onChange={(event) => update("topic", event.target.value)}
            className={`${fieldClass} mt-2`}
          >
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="request-date">
            Teslim / Etkinlik Tarihi (opsiyonel)
          </label>
          <input
            id="request-date"
            type="date"
            value={form.date}
            onChange={(event) => update("date", event.target.value)}
            className={`${fieldClass} mt-2`}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="request-message">
            Mesajınız
          </label>
          <textarea
            id="request-message"
            required
            rows={5}
            value={form.message}
            onChange={(event) => update("message", event.target.value)}
            className={`${fieldClass} mt-2 resize-none`}
            placeholder="Adet, çeşit tercihi ve aklınızdaki detaylar…"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          className="inline-flex items-center justify-center bg-bordo px-8 py-3.5 font-sans text-[11px] uppercase tracking-[0.2em] text-cream transition-colors hover:bg-bordo-dark"
        >
          {submitLabel}
        </button>
        {note ? (
          <p className="font-sans text-xs leading-relaxed text-ink-mute">{note}</p>
        ) : null}
      </div>
    </form>
  );
}
