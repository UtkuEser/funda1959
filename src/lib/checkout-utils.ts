import { HOURLY_SLOT_LABELS } from "./delivery/slots";

/** One-hour delivery windows, generated from the branches' delivery hours. */
export const DELIVERY_TIME_SLOTS: string[] = HOURLY_SLOT_LABELS;

/** Demo district list — designed to be replaced by an admin-managed source. */
export const ANKARA_DISTRICTS = [
  "Çankaya",
  "Gölbaşı",
  "Yenimahalle",
  "Keçiören",
  "Etimesgut",
  "Sincan",
  "Mamak",
  "Altındağ",
];

export const toISODate = (d: Date): string => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

export function isValidFullName(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 5 && trimmed.split(/\s+/).filter(Boolean).length >= 2;
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return /^(0)?5\d{9}$/.test(digits);
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** 05XX XXX XX XX */
export function formatPhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("90")) digits = digits.slice(2);
  if (!digits.startsWith("0")) digits = `0${digits}`;
  digits = digits.slice(0, 11);
  const parts = [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 9), digits.slice(9, 11)];
  return parts.filter(Boolean).join(" ");
}
