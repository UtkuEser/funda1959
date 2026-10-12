import { ISTANBUL_TZ } from "../time/istanbul";

/**
 * "10/10 23:06" — a date and time on the admin panel, always Europe/Istanbul
 * (server render and browser agree, whatever their own zones). Client-safe.
 */
export function dayTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("tr-TR", { timeZone: ISTANBUL_TZ, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
