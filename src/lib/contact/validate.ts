/**
 * The form's rules (D43) — the same function runs in the browser (instant
 * messages) and on the server (the one that counts). The database checks
 * them again (0012). Client-safe.
 */

import { CONTACT_SUBJECTS, type ContactField, type ContactFormInput, type ContactSubject } from "./types";

export const CONTACT_LIMITS = {
  nameMin: 2,
  nameMax: 120,
  messageMin: 10,
  messageMax: 3000,
  emailMax: 254,
  phoneDigitsMin: 10,
  phoneDigitsMax: 15,
  noteMax: 2000,
} as const;

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_CHARS = /^\+?[0-9 ()-]+$/;

export type ContactValidation =
  | { ok: true; value: { fullName: string; phone: string | null; email: string | null; subject: ContactSubject; message: string } }
  | { ok: false; errors: Partial<Record<ContactField | "contact", string>> };

const str = (v: unknown) => (typeof v === "string" ? v : "");

export function validateContactInput(raw: Partial<Record<ContactField, unknown>>): ContactValidation {
  const fullName = str(raw.fullName).trim().replace(/\s+/g, " ");
  const phone = str(raw.phone).trim().replace(/\s+/g, " ");
  const email = str(raw.email).trim().toLowerCase();
  const subject = str(raw.subject).trim();
  const message = str(raw.message).trim();
  const errors: Partial<Record<ContactField | "contact", string>> = {};

  if (fullName.length < CONTACT_LIMITS.nameMin || fullName.length > CONTACT_LIMITS.nameMax) {
    errors.fullName = "Adınızı ve soyadınızı yazın.";
  }
  if (!phone && !email) {
    errors.contact = "Size dönebilmemiz için telefon veya e-posta adresinizden en az birini yazın.";
  }
  if (phone) {
    const digits = phone.replace(/\D/g, "").length;
    if (!PHONE_CHARS.test(phone) || digits < CONTACT_LIMITS.phoneDigitsMin || digits > CONTACT_LIMITS.phoneDigitsMax || phone.length > 20) {
      errors.phone = "Geçerli bir telefon numarası yazın (ör. 0555 123 45 67).";
    }
  }
  if (email && (email.length > CONTACT_LIMITS.emailMax || email.length < 6 || !EMAIL.test(email))) {
    errors.email = "Geçerli bir e-posta adresi yazın.";
  }
  if (!CONTACT_SUBJECTS.some((s) => s.value === subject)) {
    errors.subject = "Bir konu seçin.";
  }
  if (message.length < CONTACT_LIMITS.messageMin) {
    errors.message = `Mesajınızı yazın (en az ${CONTACT_LIMITS.messageMin} karakter).`;
  } else if (message.length > CONTACT_LIMITS.messageMax) {
    errors.message = `Mesaj en fazla ${CONTACT_LIMITS.messageMax.toLocaleString("tr-TR")} karakter olabilir.`;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { fullName, phone: phone || null, email: email || null, subject: subject as ContactSubject, message },
  };
}

/** A per-form-session id: the same submit retried is stored once. */
export function isValidContactRequestId(v: unknown): v is string {
  return typeof v === "string" && /^[A-Za-z0-9_-]{8,80}$/.test(v);
}

export type { ContactFormInput };
