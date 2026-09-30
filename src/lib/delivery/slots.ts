/**
 * Delivery / pickup time-slot definitions and their per-day capacity.
 *
 * A slot definition is `(branch, weekday, window, capacity)`. The remaining
 * capacity for a concrete date is `capacity - confirmed - reserved`, where
 * `confirmed` is demo consumption (deterministic per branch/date/slot, plus a
 * few scripted overrides) and `reserved` comes from the Reservation engine.
 */

import type { Weekday } from "../branch";
import { daysBetweenISO, istanbulDateISO, weekdayOfISO } from "../time/istanbul";

export type SlotWindow = { startTime: string; endTime: string };

export type DeliverySlotDefinition = SlotWindow & {
  id: string;
  branchId: string;
  dayOfWeek: Weekday;
  capacity: number;
  active: boolean;
};

export type DailySlotState = SlotWindow & {
  slotId: string;
  branchId: string;
  date: string; // ISO
  capacity: number;
  confirmed: number;
  reserved: number;
  remaining: number;
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
  /** deliveries per configured (two-hour) window; split evenly per hour */
  capacity: number;
  /** weekdays the branch runs delivery slots; default all 7 */
  days?: Weekday[];
};

const BRANCH_SLOT_CONFIG: BranchSlotConfig[] = [
  { branchId: "gop", capacity: 14 },
  { branchId: "panora", capacity: 10, windows: STANDARD_WINDOWS.slice(1) /* opens 10:00 */ },
  { branchId: "incek", capacity: 8 },
];

const ALL_DAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

const SLOT_DEFS: DeliverySlotDefinition[] = BRANCH_SLOT_CONFIG.flatMap((cfg) => {
  const windows = cfg.windows ?? STANDARD_WINDOWS;
  const days = cfg.days ?? ALL_DAYS;
  return days.flatMap((day) =>
    windows.flatMap((w) => {
      const hours = toHourlyWindows([w]);
      const perHour = Math.max(1, Math.ceil(cfg.capacity / hours.length));
      return hours.map((hw) => ({
        id: `${cfg.branchId}-${day}-${hw.startTime.replace(":", "")}`,
        branchId: cfg.branchId,
        dayOfWeek: day,
        startTime: hw.startTime,
        endTime: hw.endTime,
        capacity: perHour,
        active: true,
      }));
    }),
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

/* -------------------------------------------------------------------------- */
/* Demo consumption                                                            */
/* -------------------------------------------------------------------------- */

/** deterministic 0..(max-1) hash for demo "already booked" counts */
function hashCount(seed: string, max: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % max;
}

type SlotOverride = {
  branchId: string;
  /** 0 = today, 1 = tomorrow, ... */
  dayOffset: number;
  startTime: string;
  /** force this slot to look full */
  full: boolean;
};

/**
 * Scripted overrides so the demo behaves predictably. Today at İncek the two
 * early afternoon windows are full; everything else follows the hash.
 */
const SLOT_OVERRIDES: SlotOverride[] = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00"].map((startTime) => ({
  branchId: "incek",
  dayOffset: 0,
  startTime,
  full: true,
}));

function dayOffset(iso: string, today: Date): number {
  return daysBetweenISO(istanbulDateISO(today), iso);
}

/** Full per-slot capacity picture for a branch on a date (for the ops panel). */
export function dailySlotStates(
  branchId: string,
  isoDate: string,
  reservedFor: (branchId: string, iso: string, slotStart: string) => number,
  now: Date = new Date(),
): DailySlotState[] {
  const weekday = weekdayOfISO(isoDate) as Weekday;
  return repo.forBranchDay(branchId, weekday).map((def) => {
    const confirmed = slotConfirmedCount(def, isoDate, now);
    const reserved = reservedFor(branchId, isoDate, def.startTime);
    return {
      slotId: def.id,
      branchId,
      date: isoDate,
      startTime: def.startTime,
      endTime: def.endTime,
      capacity: def.capacity,
      confirmed,
      reserved,
      remaining: Math.max(0, def.capacity - confirmed - reserved),
      active: def.active,
    };
  });
}

/** demo `confirmed` count for a concrete branch/date/slot */
export function slotConfirmedCount(
  def: DeliverySlotDefinition,
  isoDate: string,
  today: Date,
): number {
  const off = dayOffset(isoDate, today);
  const override = SLOT_OVERRIDES.find(
    (o) => o.branchId === def.branchId && o.dayOffset === off && o.startTime === def.startTime,
  );
  if (override?.full) return def.capacity;
  // near-term days are busier
  const load = off <= 1 ? def.capacity : Math.ceil(def.capacity * 0.55);
  return hashCount(`${def.branchId}|${isoDate}|${def.startTime}`, Math.max(1, load));
}
