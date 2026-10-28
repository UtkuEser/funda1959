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

/**
 * The home page "Kutlamanıza özel bir pasta" form (./custom-cake). Not one of
 * the /iletisim subjects above: only that form sends it (0016).
 */
export const CUSTOM_CAKE_SUBJECT = "ozel-pasta" as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number]["value"] | typeof CUSTOM_CAKE_SUBJECT;

export const CONTACT_SUBJECT_LABEL: Record<ContactSubject, string> = {
  ...(Object.fromEntries(CONTACT_SUBJECTS.map((s) => [s.value, s.label])) as Record<(typeof CONTACT_SUBJECTS)[number]["value"], string>),
  [CUSTOM_CAKE_SUBJECT]: "Özel Pasta Talebi",
};

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
  /** an "Özel Pasta Talebi" reference photo in the private bucket (0016), or null */
  attachmentPath: string | null;
  /** a short-lived signed address for Merkez; null when there is none or it couldn't be made */
  attachmentUrl: string | null;
};

export type ContactRequestPage = {
  counts: Record<ContactStatus, number>;
  total: number;
  rows: ContactRequest[];
};
