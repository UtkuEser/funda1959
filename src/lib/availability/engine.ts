/**
 * Availability engine — the deterministic core of Funda's ordering.
 *
 * `getProductAvailability()` answers, before the customer commits: which branch
 * serves them, is the product sellable there, which dates work, and which time
 * windows on the requested date are open. `getCartAvailability()` does the same
 * for a whole cart at once (order-level: one shared slot for every item).
 *
 * Pure given its inputs (`now` is injectable). No network, no storage.
 */

import { catalogProducts, getProductDetail, type CatalogProduct } from "../data";
import {
  getBranch,
  isBranchOpenOn,
  isBranchOpenAt,
  type Branch,
  type Weekday,
} from "../branch";
import { resolveZone, getZone } from "../delivery/zones";
import {
  getSlotRepository,
  slotConfirmedCount,
  slotLabel,
  type DeliverySlotDefinition,
} from "../delivery/slots";
import { getBranchProduct, branchUnitPrice, type BranchProduct } from "../inventory";
import { addDaysISO, istanbulDateISO, istanbulInstant, weekdayOfISO } from "../time/istanbul";
import { reservedSlotUnits } from "../reservations";
import type { ReasonCode } from "./reasons";
import type {
  AvailabilityResult,
  CartAvailabilityItemIssue,
  CartAvailabilityResult,
  DateAvailability,
  DeliveryContext,
  ProductAvailabilityRequest,
  SlotAvailability,
} from "./types";

/** days evaluated from today — covers the product page's month calendar */
export const HORIZON_DAYS = 60;
const WEEKDAY_TR = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

/* All calendar math is Europe/Istanbul, whatever the server's own time zone. */
const toISO = (d: Date) => istanbulDateISO(d);
const at = (iso: string, time: string) => istanbulInstant(iso, time);

function resolveProduct(idOrSlug: string, slug?: string): CatalogProduct | null {
  return (
    catalogProducts.find((p) => p.id === idOrSlug || p.slug === idOrSlug) ??
    (slug ? catalogProducts.find((p) => p.slug === slug) ?? null : null)
  );
}

function unitPriceFor(product: CatalogProduct, variantId: string | null | undefined): number {
  if (!variantId) return product.priceValue;
  const detail = getProductDetail(product.slug);
  const v = detail?.variants.find((x) => x.id === variantId);
  return v?.price ?? product.priceValue;
}

/* -------------------------------------------------------------------------- */
/* Branch resolution                                                          */
/* -------------------------------------------------------------------------- */

type BranchResolution =
  | { ok: true; branch: Branch; zoneId: string | null; deliveryFee: number }
  | { ok: false; reason: ReasonCode };

export function resolveContextBranch(ctx: DeliveryContext): BranchResolution {
  if (ctx.fulfillmentType === "pickup") {
    if (!ctx.branchId) return { ok: false, reason: "BRANCH_REQUIRED" };
    const branch = getBranch(ctx.branchId);
    if (!branch || !branch.active) return { ok: false, reason: "BRANCH_DISABLED" };
    if (!branch.pickupEnabled) return { ok: false, reason: "PICKUP_UNAVAILABLE" };
    return { ok: true, branch, zoneId: null, deliveryFee: 0 };
  }

  // delivery — a pinned zone id (carried by the reservation/order flow) wins,
  // then an address (district + neighbourhood) served by the chosen branch.
  const pinnedZone = ctx.deliveryZoneId ? getZone(ctx.deliveryZoneId) : null;
  let zone = pinnedZone;
  if (!zone && ctx.district && ctx.neighborhood) {
    zone = resolveZone(ctx.district, ctx.neighborhood, ctx.branchId);
    if (!zone) return { ok: false, reason: "DELIVERY_ZONE_NOT_FOUND" };
  }
  if (!zone) {
    // Branch chosen, address not known yet: evaluate the branch itself (stock,
    // capacity, hours). The address and its fee are settled at checkout.
    if (!ctx.branchId) return { ok: false, reason: "BRANCH_REQUIRED" };
    const branch = getBranch(ctx.branchId);
    if (!branch || !branch.active) return { ok: false, reason: "BRANCH_DISABLED" };
    if (!branch.deliveryEnabled) return { ok: false, reason: "DELIVERY_UNAVAILABLE" };
    return { ok: true, branch, zoneId: null, deliveryFee: 0 };
  }
  const branch = getBranch(zone.branchId);
  if (!branch || !branch.active) return { ok: false, reason: "BRANCH_DISABLED" };
  if (!branch.deliveryEnabled) return { ok: false, reason: "DELIVERY_UNAVAILABLE" };
  return { ok: true, branch, zoneId: zone.id, deliveryFee: zone.deliveryFee };
}

/* -------------------------------------------------------------------------- */
/* Per-(branch, product) date + slot evaluation                               */
/* -------------------------------------------------------------------------- */

type StockCheck = { ok: boolean; reason: ReasonCode | null };

/**
 * Branch availability for a date. Quantities no longer decide anything: a
 * product the branch has set "passive" can't go out today but stays orderable
 * from tomorrow; preparation time and slots are checked separately.
 */
function branchDayCheck(bp: BranchProduct, iso: string, todayISO: string): StockCheck {
  return bp.status === "passive" && iso === todayISO ? { ok: false, reason: "NEXT_DAY_ONLY" } : { ok: true, reason: null };
}

type SlotEval = SlotAvailability & { prepFeasible: boolean };

function evalSlot(
  def: DeliverySlotDefinition,
  iso: string,
  branch: Branch,
  bp: BranchProduct,
  now: Date,
  reservationScope?: string,
): SlotEval {
  const base: Omit<SlotEval, "available" | "remaining" | "reason" | "prepFeasible"> = {
    slotId: def.id,
    startTime: def.startTime,
    endTime: def.endTime,
    label: slotLabel(def),
  };

  const weekday = weekdayOfISO(iso) as Weekday;
  if (!isBranchOpenAt(branch, weekday, def.startTime)) {
    return { ...base, available: false, remaining: 0, reason: "BRANCH_CLOSED", prepFeasible: false };
  }

  // preparation time: ready by the END of the window
  const readyBy = new Date(now.getTime() + bp.prepTimeMinutes * 60_000);
  const slotEnd = at(iso, def.endTime);
  const isToday = iso === toISO(now);
  const prepFeasible = slotEnd.getTime() >= readyBy.getTime();

  if (isToday && !bp.sameDayEnabled) {
    return { ...base, available: false, remaining: 0, reason: "SAME_DAY_DISABLED", prepFeasible: false };
  }
  if (!prepFeasible) {
    return { ...base, available: false, remaining: 0, reason: "PREPARATION_TIME", prepFeasible: false };
  }

  const confirmed = slotConfirmedCount(def, iso, now);
  const reserved = reservedSlotUnits(def.branchId, iso, def.startTime, reservationScope);
  const remaining = def.capacity - confirmed - reserved;
  if (remaining < 1) {
    return { ...base, available: false, remaining: 0, reason: "DELIVERY_SLOT_FULL", prepFeasible };
  }

  return { ...base, available: true, remaining, reason: null, prepFeasible };
}

/* -------------------------------------------------------------------------- */
/* getProductAvailability                                                     */
/* -------------------------------------------------------------------------- */

function emptyResult(
  reason: ReasonCode,
  requestedDate: string,
  extra: Partial<AvailabilityResult> = {},
): AvailabilityResult {
  return {
    available: false,
    reason,
    branchId: null,
    branchName: null,
    deliveryZoneId: null,
    deliveryFee: 0,
    requestedDate,
    dates: [],
    availableDates: [],
    slots: [],
    earliestAvailableDate: null,
    earliestAvailableSlot: null,
    unitPrice: null,
    ...extra,
  };
}

export function getProductAvailability(req: ProductAvailabilityRequest): AvailabilityResult {
  const now = req.now ?? new Date();
  const todayISO = toISO(now);
  const requestedDate = req.date && req.date >= todayISO ? req.date : todayISO;

  const product = resolveProduct(req.productId, req.productSlug);
  if (!product || !(product.priceValue > 0)) {
    return emptyResult("PRODUCT_DISABLED", requestedDate);
  }

  const resolved = resolveContextBranch(req.context);
  if (!resolved.ok) {
    return emptyResult(resolved.reason, requestedDate, {
      unitPrice: unitPriceFor(product, req.variantId),
    });
  }
  const { branch, zoneId, deliveryFee } = resolved;

  const bp = getBranchProduct(branch.id, product.id);
  if (!bp || !bp.active) {
    return emptyResult("PRODUCT_DISABLED_AT_BRANCH", requestedDate, {
      branchId: branch.id,
      branchName: branch.name,
      deliveryZoneId: zoneId,
      deliveryFee,
      unitPrice: unitPriceFor(product, req.variantId),
    });
  }

  const unitPrice = branchUnitPrice(bp, unitPriceFor(product, req.variantId));

  const slotRepo = getSlotRepository();

  const dates: DateAvailability[] = [];
  const availableDates: string[] = [];
  let requestedSlots: SlotAvailability[] = [];
  let earliestAvailableDate: string | null = null;
  let earliestAvailableSlot: AvailabilityResult["earliestAvailableSlot"] = null;

  for (let i = 0; i < HORIZON_DAYS; i += 1) {
    const iso = addDaysISO(todayISO, i);
    const weekday = weekdayOfISO(iso) as Weekday;

    let dayReason: ReasonCode | null = null;
    let daySlots: SlotAvailability[] = [];

    if (!isBranchOpenOn(branch, weekday)) {
      dayReason = "BRANCH_CLOSED";
    } else {
      const stock = branchDayCheck(bp, iso, todayISO);
      if (!stock.ok) {
        dayReason = stock.reason;
      } else {
        const defs = slotRepo.forBranchDay(branch.id, weekday);
        if (defs.length === 0) {
          dayReason = "NO_SLOTS_DEFINED";
        } else {
          daySlots = defs.map((def) => {
            const e = evalSlot(def, iso, branch, bp, now);
            return {
              slotId: e.slotId,
              startTime: e.startTime,
              endTime: e.endTime,
              label: e.label,
              available: e.available,
              remaining: e.remaining,
              reason: e.reason,
            };
          });
          const openSlots = daySlots.filter((s) => s.available);
          if (openSlots.length === 0) {
            // surface the most informative reason
            dayReason =
              daySlots.find((s) => s.reason === "DELIVERY_SLOT_FULL")?.reason ??
              daySlots.find((s) => s.reason === "PREPARATION_TIME")?.reason ??
              daySlots.find((s) => s.reason === "SAME_DAY_DISABLED")?.reason ??
              "DATE_UNAVAILABLE";
          }
        }
      }
    }

    const dayAvailable = dayReason === null && daySlots.some((s) => s.available);
    dates.push({
      date: iso,
      weekdayLabel: WEEKDAY_TR[weekday],
      available: dayAvailable,
      reason: dayAvailable ? null : dayReason,
    });
    if (dayAvailable) {
      availableDates.push(iso);
      if (!earliestAvailableDate) earliestAvailableDate = iso;
      if (!earliestAvailableSlot) {
        const s = daySlots.find((x) => x.available)!;
        earliestAvailableSlot = {
          date: iso,
          slotId: s.slotId,
          startTime: s.startTime,
          endTime: s.endTime,
          label: s.label,
        };
      }
    }

    if (iso === requestedDate) requestedSlots = daySlots;
  }

  const requestedDay = dates.find((d) => d.date === requestedDate) ?? null;
  const available = Boolean(requestedDay?.available);

  return {
    available,
    reason: available ? null : requestedDay?.reason ?? "DATE_UNAVAILABLE",
    branchId: branch.id,
    branchName: branch.name,
    deliveryZoneId: zoneId,
    deliveryFee,
    requestedDate,
    dates,
    availableDates,
    slots: requestedSlots,
    earliestAvailableDate,
    earliestAvailableSlot,
    unitPrice,
  };
}

/* -------------------------------------------------------------------------- */
/* getCartAvailability — order-level, one shared slot                         */
/* -------------------------------------------------------------------------- */

export type CartAvailabilityRequest = {
  context: DeliveryContext;
  items: { productId: string; productSlug?: string; variantId?: string | null; quantity: number }[];
  date?: string;
  slotStart?: string;
  now?: Date;
  /** ignore this reservation's own holds (re-checking after reserving) */
  reservationScope?: string;
};

export function getCartAvailability(req: CartAvailabilityRequest): CartAvailabilityResult {
  const now = req.now ?? new Date();
  const todayISO = toISO(now);
  const requestedDate = req.date && req.date >= todayISO ? req.date : todayISO;

  const base: CartAvailabilityResult = {
    available: false,
    branchId: null,
    branchName: null,
    requestedDate,
    requestedSlotStart: req.slotStart ?? null,
    slots: [],
    earliestAvailableSlot: null,
    itemIssues: [],
    deliveryFee: 0,
  };

  if (req.items.length === 0) return base;

  const resolved = resolveContextBranch(req.context);
  if (!resolved.ok) {
    return { ...base, itemIssues: [{ productId: "*", productName: "", variantId: null, reason: resolved.reason, earliestDate: null }] };
  }
  const { branch, deliveryFee } = resolved;

  // Per-item availability across the horizon.
  const perItem = req.items.map((item) => {
    const product = resolveProduct(item.productId, item.productSlug);
    const result = getProductAvailability({
      productId: item.productId,
      productSlug: item.productSlug,
      variantId: item.variantId ?? null,
      quantity: item.quantity,
      context: req.context,
      date: requestedDate,
      now,
    });
    return { item, product, result };
  });

  const issues: CartAvailabilityItemIssue[] = perItem
    .filter((x) => !x.result.available && (x.result.availableDates.length === 0))
    .map((x) => ({
      productId: x.item.productId,
      productName: x.product?.name ?? x.item.productId,
      variantId: x.item.variantId ?? null,
      reason: x.result.reason ?? "DATE_UNAVAILABLE",
      earliestDate: x.result.earliestAvailableDate,
    }));

  // Order-level slots for the requested date: a slot works only if EVERY item
  // is available in it.
  const slotRepo = getSlotRepository();
  const weekday = weekdayOfISO(requestedDate) as Weekday;
  const defs = slotRepo.forBranchDay(branch.id, weekday);

  const slots: SlotAvailability[] = defs.map((def) => {
    const perItemSlot = perItem.map(({ item }) => {
      const bp = getBranchProduct(branch.id, resolveProduct(item.productId, item.productSlug)?.id ?? "");
      if (!bp) return { available: false, reason: "PRODUCT_DISABLED_AT_BRANCH" as ReasonCode, remaining: 0 };
      const e = evalSlot(def, requestedDate, branch, bp, now, req.reservationScope);
      const dateStock = branchDayCheck(bp, requestedDate, todayISO);
      if (!dateStock.ok) return { available: false, reason: dateStock.reason as ReasonCode, remaining: 0 };
      return { available: e.available, reason: e.reason, remaining: e.remaining };
    });
    const worst = perItemSlot.find((s) => !s.available);
    return {
      slotId: def.id,
      startTime: def.startTime,
      endTime: def.endTime,
      label: slotLabel(def),
      available: !worst,
      remaining: Math.min(...perItemSlot.map((s) => s.remaining), def.capacity),
      reason: worst ? worst.reason : null,
    };
  });

  // Earliest shared slot across the whole horizon.
  let earliest: CartAvailabilityResult["earliestAvailableSlot"] = null;
  const horizonDates = perItem[0]?.result.dates ?? [];
  for (const d of horizonDates) {
    const wd = weekdayOfISO(d.date) as Weekday;
    const dayDefs = slotRepo.forBranchDay(branch.id, wd);
    const shared = dayDefs.find((def) =>
      perItem.every(({ item }) => {
        const bp = getBranchProduct(branch.id, resolveProduct(item.productId, item.productSlug)?.id ?? "");
        if (!bp) return false;
        if (!branchDayCheck(bp, d.date, todayISO).ok) return false;
        return evalSlot(def, d.date, branch, bp, now, req.reservationScope).available;
      }),
    );
    if (shared) {
      earliest = {
        date: d.date,
        startTime: shared.startTime,
        endTime: shared.endTime,
        label: slotLabel(shared),
      };
      break;
    }
  }

  const requestedSlot = req.slotStart ? slots.find((s) => s.startTime === req.slotStart) : null;
  const available =
    issues.length === 0 &&
    (req.slotStart ? Boolean(requestedSlot?.available) : slots.some((s) => s.available));

  return {
    available,
    branchId: branch.id,
    branchName: branch.name,
    requestedDate,
    requestedSlotStart: req.slotStart ?? null,
    slots,
    earliestAvailableSlot: earliest,
    itemIssues: issues,
    deliveryFee,
  };
}
