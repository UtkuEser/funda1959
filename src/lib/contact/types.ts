/**
 * İletişim talepleri (Aşama 8, D43) — shared by the form, the API and the
 * Merkez screen. Client-safe: no server code here.
 */

export const CONTACT_SUBJECTS = [
  { value: "ozel-gun", label: "Özel Gün Sipariş" },
  { value: "kurumsal", label: "Kurumsal Sipariş" },
  { value: "genel", label: "Genel Bilgi" },
  { value: "sikayet", label: "Şikayet / Geri Bildirim" },
  { value: "diger", label: "Diğer" },
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number]["value"];

export const CONTACT_SUBJECT_LABEL: Record<ContactSubject, string> = Object.fromEntries(
  CONTACT_SUBJECTS.map((s) => [s.value, s.label]),
) as Record<ContactSubject, string>;

export const CONTACT_STATUSES = ["new", "in_progress", "closed"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const CONTACT_STATUS_LABEL: Record<ContactStatus, string> = {
  new: "Yeni",
  in_progress: "İşlemde",
  closed: "Kapandı",
};

/** What the visitor sends. `website` is the hidden trap field — people leave it empty. */
export type ContactFormInput = {
  fullName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
};

export type ContactField = keyof ContactFormInput;

/** One request as Merkez sees it. */
export type ContactRequest = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  subject: ContactSubject;
  message: string;
  status: ContactStatus;
  internalNote: string | null;
  createdAt: string;
  handledBy: string | null;
  handledAt: string | null;
  noteUpdatedBy: string | null;
  noteUpdatedAt: string | null;
};

export type ContactRequestPage = {
  counts: Record<ContactStatus, number>;
  total: number;
  rows: ContactRequest[];
};
