/**
 * Delivery / pickup time-slot definitions and their per-day capacity.
 *
 * A slot definition is `(branch, weekday, window, capacity)`. The remaining
 * capacity for a concrete date is `capacity - confirmed - reserved`, where
 * `confirmed` is demo consumption (deterministic per branch/date/slot, plus a
 * few scripted overrides) and `reserved` comes from the Reservation engine.
 */

import type { Weekday } from "../branch";

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

/** The public-facing windows Funda offers. */
export const STANDARD_WINDOWS: SlotWindow[] = [
  { startTime: "10:00", endTime: "12:00" },
  { startTime: "12:00", endTime: "14:00" },
  { startTime: "14:00", endTime: "16:00" },
  { startTime: "16:00", endTime: "18:00" },
  { startTime: "18:00", endTime: "20:00" },
];

/** "10:00 – 12:00" — matches the legacy DELIVERY_TIME_SLOTS label format. */
export const slotLabel = (w: SlotWindow): string => `${w.startTime} – ${w.endTime}`;

type BranchSlotConfig = {
  branchId: string;
  /** windows offered; omit to use STANDARD_WINDOWS */
  windows?: SlotWindow[];
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
    windows.map((w) => ({
      id: `${cfg.branchId}-${day}-${w.startTime.replace(":", "")}`,
      branchId: cfg.branchId,
      dayOfWeek: day,
      startTime: w.startTime,
      endTime: w.endTime,
      capacity: cfg.capacity,
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
const SLOT_OVERRIDES: SlotOverride[] = [
  { branchId: "incek", dayOffset: 0, startTime: "10:00", full: true },
  { branchId: "incek", dayOffset: 0, startTime: "12:00", full: true },
  { branchId: "incek", dayOffset: 0, startTime: "14:00", full: true },
];

function dayOffset(iso: string, today: Date): number {
  const [y, m, d] = iso.split("-").map(Number);
  const target = Date.UTC(y, m - 1, d);
  const base = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target - base) / 86_400_000);
}

/** Full per-slot capacity picture for a branch on a date (for the ops panel). */
export function dailySlotStates(
  branchId: string,
  isoDate: string,
  reservedFor: (branchId: string, iso: string, slotStart: string) => number,
  now: Date = new Date(),
): DailySlotState[] {
  const weekday = new Date(`${isoDate}T12:00:00`).getDay() as Weekday;
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
