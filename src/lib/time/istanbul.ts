/**
 * Europe/Istanbul calendar helpers — every delivery date/slot calculation
 * (server and browser) goes through these, so "today", weekdays and slot
 * start times mean the same thing whatever the machine's own time zone is.
 *
 * Dates are ISO strings ("2026-10-02"); arithmetic on them is pure calendar
 * math (UTC-based), never local-time Date math.
 */

export const ISTANBUL_TZ = "Europe/Istanbul";

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: ISTANBUL_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

type Parts = { year: number; month: number; day: number; hour: number; minute: number };

function istanbulParts(instant: Date): Parts {
  const out: Record<string, number> = {};
  for (const p of partsFormatter.formatToParts(instant)) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  return { year: out.year, month: out.month, day: out.day, hour: out.hour, minute: out.minute };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Istanbul calendar date of an instant. */
export function istanbulDateISO(instant: Date = new Date()): string {
  const p = istanbulParts(instant);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Calendar arithmetic on ISO dates. */
export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** Whole days from `fromISO` to `toISO` (negative when earlier). */
export function daysBetweenISO(fromISO: string, toISO: string): number {
  const [y1, m1, d1] = fromISO.split("-").map(Number);
  const [y2, m2, d2] = toISO.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

/** 0 = Sunday … 6 = Saturday (JS getDay convention) for an ISO date. */
export function weekdayOfISO(iso: string): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

/** The instant of an Istanbul wall-clock time ("HH:MM") on an ISO date. */
export function istanbulInstant(iso: string, time: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, h, min);
  const p = istanbulParts(new Date(guess));
  const offsetMs = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - guess;
  return new Date(guess - offsetMs);
}

export const MONTHS_TR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
export const MONTHS_TR_SHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
/** dative suffix per month: "Ekim'e", "Kasım'a" */
const MONTH_DATIVE = ["a", "a", "a", "a", "a", "a", "a", "a", "e", "e", "a", "a"];
export const WEEKDAYS_TR = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
export const WEEKDAYS_TR_SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

/** "2 Ekim Cuma" */
export function longDateTR(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_TR[m - 1]} ${WEEKDAYS_TR[weekdayOfISO(iso)]}`;
}

/** "3 Ekim'e" */
export function dativeDateTR(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_TR[m - 1]}'${MONTH_DATIVE[m - 1]}`;
}
