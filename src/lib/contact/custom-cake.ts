/**
 * "Kutlamanıza özel bir pasta" — the home page request form. The same rules
 * run in the browser (instant messages) and on the server (the one that
 * counts). Stored as an iletişim talebi with subject "ozel-pasta" (0016): the
 * server writes every field into the message, so Merkez sees them all in
 * the request. It is a request, never an order. Client-safe.
 */

import { CONTACT_LIMITS, isValidContactPhone } from "./validate";
import { MONTHS_TR, WEEKDAYS_TR, weekdayOfISO } from "../time/istanbul";

export const CELEBRATION_TYPES = [
  "Doğum Günü",
  "Nişan & Söz",
  "Düğün",
  "Yıldönümü",
  "Özel Davet",
  "Kurumsal Kutlama",
  "Diğer",
] as const;

export const CUSTOM_CAKE_LIMITS = { guestsMax: 2000, noteMax: 1000 } as const;

/**
 * The optional reference photo with the note: JPEG / PNG / WebP, at most
 * 4 MB (Vercel's request limit is 4.5 MB). The browser shrinks a bigger or
 * heavier photo to `maxSide` before sending; the server checks the content.
 */
export const CUSTOM_CAKE_IMAGE = {
  maxBytes: 4 * 1024 * 1024,
  maxSide: 2400,
  types: ["image/jpeg", "image/png", "image/webp"] as const,
} as const;

export type CustomCakeInput = {
  fullName: string;
  phone: string;
  celebration: string;
  guests: string;
  eventDate: string;
  note: string;
};

export type CustomCakeField = keyof CustomCakeInput;

export type CustomCakeValidation =
  | { ok: true; value: { fullName: string; phone: string; message: string } }
  | { ok: false; errors: Partial<Record<CustomCakeField, string>> };

const str = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");

/** A real calendar day "YYYY-MM-DD". */
function isCalendarDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

/** "15 Kasım 2026, Pazar" */
function eventDateText(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_TR[m - 1]} ${y}, ${WEEKDAYS_TR[weekdayOfISO(iso)]}`;
}

/** `todayISO` is today in Europe/Istanbul — an earlier event date is refused. */
export function validateCustomCakeInput(raw: Partial<Record<CustomCakeField, unknown>>, todayISO: string): CustomCakeValidation {
  const fullName = str(raw.fullName).trim().replace(/\s+/g, " ");
  const phone = str(raw.phone).trim().replace(/\s+/g, " ");
  const celebration = str(raw.celebration).trim();
  const guestsText = str(raw.guests).trim();
  const eventDate = str(raw.eventDate).trim();
  const note = str(raw.note).trim();
  const errors: Partial<Record<CustomCakeField, string>> = {};

  if (fullName.length < CONTACT_LIMITS.nameMin || fullName.length > CONTACT_LIMITS.nameMax) {
    errors.fullName = "Adınızı ve soyadınızı yazın.";
  }
  if (!phone) errors.phone = "Telefon numaranızı yazın.";
  else if (!isValidContactPhone(phone)) errors.phone = "Geçerli bir telefon numarası yazın (ör. 0555 123 45 67).";
  if (!(CELEBRATION_TYPES as readonly string[]).includes(celebration)) {
    errors.celebration = "Kutlama türünü seçin.";
  }
  const guests = /^\d+$/.test(guestsText) ? Number(guestsText) : NaN;
  if (!Number.isInteger(guests) || guests < 1) {
    errors.guests = "Kişi sayısını yazın (1 veya daha fazla).";
  } else if (guests > CUSTOM_CAKE_LIMITS.guestsMax) {
    errors.guests = `Kişi sayısı en fazla ${CUSTOM_CAKE_LIMITS.guestsMax.toLocaleString("tr-TR")} olabilir; daha kalabalık etkinlikler için notunuza yazın.`;
  }
  if (!eventDate) errors.eventDate = "Etkinlik tarihini seçin.";
  else if (!isCalendarDate(eventDate)) errors.eventDate = "Geçerli bir tarih seçin.";
  else if (todayISO && eventDate < todayISO) errors.eventDate = "Geçmiş bir tarih seçilemez.";
  if (note.length > CUSTOM_CAKE_LIMITS.noteMax) {
    errors.note = `Not en fazla ${CUSTOM_CAKE_LIMITS.noteMax.toLocaleString("tr-TR")} karakter olabilir.`;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  const message = [
    `Kutlama Türü: ${celebration}`,
    `Kişi Sayısı: ${guests}`,
    `Etkinlik Tarihi: ${eventDateText(eventDate)}`,
    ...(note ? [`Not: ${note}`] : []),
  ].join("\n");
  return { ok: true, value: { fullName, phone, message } };
}
