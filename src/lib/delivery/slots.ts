/**
 * Delivery / pickup time windows.
 *
 * Each branch's delivery hours are configured as windows (unchanged);
 * customers book one-hour windows within them. There is NO hourly order
 * limit (SUPABASE_PLAN.md, D11) and no product-based lead time (D44): a
 * window closes only because of opening hours, because it has already
 * started (today, Europe/Istanbul) or because a product is passive at the
 * branch today — all decided in the availability engine. Branch stock
 * (active / passive) and delivery windows are separate concepts.
 */

import type { Weekday } from "../branch";
import { istanbulInstant, weekdayOfISO } from "../time/istanbul";

/**
 * A window can be chosen only before it starts: at 10:30, "10:00 – 11:00"
 * is closed and "11:00 – 12:00" open; at exactly 10:00 the 10:00 window is
 * closed. Europe/Istanbul wall time, whatever the device's or server's zone.
 * Used by the engine (server) and the date / time pickers (browser) alike.
 */
export function slotHasStarted(dateISO: string, startTime: string, now: Date): boolean {
  return istanbulInstant(dateISO, startTime).getTime() <= now.getTime();
}

export type SlotWindow = { startTime: string; endTime: string };

export type DeliverySlotDefinition = SlotWindow & {
  id: string;
  branchId: string;
  dayOfWeek: Weekday;
  active: boolean;
};

/* -------------------------------------------------------------------------- */
/* Seed                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Each branch's delivery hours, as configured (unchanged). Customers book
 * them in one-hour windows — see `toHourlyWindows`.
 */
export const STANDARD_WINDOWS: SlotWindow[] = [
  { startTime: "10:00", endTime: "12:00" },
  { startTime: "12:00", endTime: "14:00" },
  { startTime: "14:00", endTime: "16:00" },
  { startTime: "16:00", endTime: "18:00" },
  { startTime: "18:00", endTime: "20:00" },
];

/** "10:00 – 11:00" — the label stored on cart lines and orders. */
export const slotLabel = (w: SlotWindow): string => `${w.startTime} – ${w.endTime}`;

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const toTime = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** Splits configured windows into one-hour booking windows, keeping the hours. */
export function toHourlyWindows(windows: SlotWindow[]): SlotWindow[] {
  return windows.flatMap((w) => {
    const out: SlotWindow[] = [];
    for (let t = toMin(w.startTime); t + 60 <= toMin(w.endTime); t += 60) {
      out.push({ startTime: toTime(t), endTime: toTime(t + 60) });
    }
    return out;
  });
}

/** Every one-hour label any branch offers — the order API validates against it. */
export const HOURLY_SLOT_LABELS: string[] = toHourlyWindows(STANDARD_WINDOWS).map(slotLabel);

type BranchSlotConfig = {
  branchId: string;
  /** windows offered; omit to use STANDARD_WINDOWS */
  windows?: SlotWindow[];
  /** weekdays the branch runs delivery slots; default all 7 */
  days?: Weekday[];
};

const BRANCH_SLOT_CONFIG: BranchSlotConfig[] = [
  { branchId: "gop" },
  { branchId: "panora", windows: STANDARD_WINDOWS.slice(1) /* delivery windows from 12:00 */ },
  { branchId: "incek" },
];

const ALL_DAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

const SLOT_DEFS: DeliverySlotDefinition[] = BRANCH_SLOT_CONFIG.flatMap((cfg) => {
  const windows = cfg.windows ?? STANDARD_WINDOWS;
  const days = cfg.days ?? ALL_DAYS;
  return days.flatMap((day) =>
    toHourlyWindows(windows).map((hw) => ({
      id: `${cfg.branchId}-${day}-${hw.startTime.replace(":", "")}`,
      branchId: cfg.branchId,
      dayOfWeek: day,
      startTime: hw.startTime,
      endTime: hw.endTime,
      active: true,
    })),
  );
});

/* -------------------------------------------------------------------------- */
/* Repository                                                                  */
/* -------------------------------------------------------------------------- */

export interface SlotRepository {
  forBranchDay(branchId: string, weekday: Weekday): DeliverySlotDefinition[];
}

class InMemorySlotRepository implements SlotRepository {
  constructor(private readonly defs: DeliverySlotDefinition[]) {}
  forBranchDay(branchId: string, weekday: Weekday): DeliverySlotDefinition[] {
    return this.defs
      .filter((s) => s.branchId === branchId && s.dayOfWeek === weekday && s.active)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
}

let repo: SlotRepository = new InMemorySlotRepository(SLOT_DEFS);
export function setSlotRepository(next: SlotRepository): void {
  repo = next;
}
export function getSlotRepository(): SlotRepository {
  return repo;
}

/** The one-hour windows a branch offers on a date (admin "Teslimat Slotları"). */
export function slotsForBranchDate(branchId: string, isoDate: string): DeliverySlotDefinition[] {
  return repo.forBranchDay(branchId, weekdayOfISO(isoDate) as Weekday);
}
