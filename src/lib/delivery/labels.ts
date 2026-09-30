/**
 * Customer-facing delivery wording — one source for product cards, the
 * product page, quick order and the cart, all fed by the same engine result,
 * so a product can never read "today" in one place and "tomorrow" in another.
 *
 * Deliberately never mentions stock: a product the branch has set passive
 * simply reads "En erken yarına teslim".
 */

import type { CatalogAvailabilityVerdict } from "@/lib/availability";
import { addDaysISO, dativeDateTR, istanbulDateISO, longDateTR, MONTHS_TR_SHORT } from "@/lib/time/istanbul";

export type DeliveryLabel = {
  text: string;
  /** drives the pill's tone */
  when: "today" | "tomorrow" | "later";
};

export function todayAndTomorrow(now: Date = new Date()): { today: string; tomorrow: string } {
  const today = istanbulDateISO(now);
  return { today, tomorrow: addDaysISO(today, 1) };
}

/** Label for the earliest deliverable date: "Bugün teslim" / "En erken yarına teslim" / "En erken 3 Ekim'e teslim". */
export function earliestLabel(iso: string, now: Date = new Date()): DeliveryLabel {
  const { today, tomorrow } = todayAndTomorrow(now);
  if (iso === today) return { text: "Bugün teslim", when: "today" };
  if (iso === tomorrow) return { text: "En erken yarına teslim", when: "tomorrow" };
  return { text: `En erken ${dativeDateTR(iso)} teslim`, when: "later" };
}

/** From a catalog verdict. null when the branch doesn't carry the product (no date at all). */
export function deliveryLabel(v: CatalogAvailabilityVerdict | null | undefined, now: Date = new Date()): DeliveryLabel | null {
  if (!v) return null;
  if (v.available) return earliestLabel(todayAndTomorrow(now).today, now);
  return v.earliestDate ? earliestLabel(v.earliestDate, now) : null;
}

/** "bugün" / "yarın" / "3 Eki" — for running text. */
export function dayWord(iso: string, now: Date = new Date()): string {
  const { today, tomorrow } = todayAndTomorrow(now);
  if (iso === today) return "bugün";
  if (iso === tomorrow) return "yarın";
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_TR_SHORT[m - 1]}`;
}

/** "14:00 – 15:00" -> "14:00–15:00" */
export const compactSlot = (label: string): string => label.replace(/\s*–\s*/, "–");

/** "2 Ekim Cuma · 14:00–15:00" */
export function dateSlotText(iso: string, slotLabel?: string | null): string {
  return `${longDateTR(iso)}${slotLabel ? ` · ${compactSlot(slotLabel)}` : ""}`;
}

/** "Teslimat: 2 Ekim Cuma · 14:00–15:00" */
export function deliverySummary(iso: string, slotLabel?: string | null): string {
  return `Teslimat: ${dateSlotText(iso, slotLabel)}`;
}
