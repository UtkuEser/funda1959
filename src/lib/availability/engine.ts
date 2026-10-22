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

import { allCatalogProducts, type CatalogProduct } from "../data";
import {
  getBranch,
  isBranchOpenOn,
  isBranchOpenAt,
  type Branch,
  type Weekday,
} from "../branch";
import { areasState, resolveZone } from "../delivery/zones";
import { deliveryFeeFor } from "../delivery/fees";
import { effectivePriceValue, effectiveUnitPrice, priceRowsForDisplay } from "../pricing/prices";
import { getSlotRepository, slotHasStarted, slotLabel, type DeliverySlotDefinition } from "../delivery/slots";
import { getBranchProduct, branchUnitPrice, type BranchProduct } from "../inventory";
import { addDaysISO, istanbulDateISO, weekdayOfISO } from "../time/istanbul";
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

function resolveProduct(idOrSlug: string, slug?: string): CatalogProduct | null {
  return (
    allCatalogProducts().find((p) => p.id === idOrSlug || p.slug === idOrSlug) ??
    (slug ? allCatalogProducts().find((p) => p.slug === slug) ?? null : null)
  );
}

/** shown price of a product / size (display reading of the price store; orders price on their own) */
function unitPriceFor(product: CatalogProduct, variantId: string | null | undefined): number {
  return effectiveUnitPrice(product, variantId, priceRowsForDisplay()) ?? effectivePriceValue(product, priceRowsForDisplay());
}

/* -------------------------------------------------------------------------- */
/* Branch resolution                                                          */
/* -------------------------------------------------------------------------- */

type BranchResolution =
  | { ok: true; branch: Branch; zoneId: string | null; deliveryFee: number; deliveryFeeState: "paid" | "free" | null }
  | { ok: false; reason: ReasonCode };

export function resolveContextBranch(ctx: DeliveryContext): BranchResolution {
  if (ctx.fulfillmentType === "pickup") {
    if (!ctx.branchId) return { ok: false, reason: "BRANCH_REQUIRED" };
    const branch = getBranch(ctx.branchId);
    if (!branch || !branch.active) return { ok: false, reason: "BRANCH_DISABLED" };
    if (!branch.pickupEnabled) return { ok: false, reason: "PICKUP_UNAVAILABLE" };
    return { ok: true, branch, zoneId: null, deliveryFee: 0, deliveryFeeState: null };
  }

  // delivery is address-first: the serving branch follows from the address's
  // zone — the same lookup the client uses (lib/delivery/context.tsx). A
  // client-sent branchId or deliveryZoneId neither replaces the address nor
  // changes which branch serves it, so without district + neighbourhood there
  // is no availability and no fee.
  if (!ctx.district?.trim() || !ctx.neighborhood?.trim()) return { ok: false, reason: "LOCATION_REQUIRED" };
  // D49: the district + neighbourhood -> branch map as last read; unreadable -> no answer built on an older map
  if (areasState() !== "ready") return { ok: false, reason: "DELIVERY_INFO_UNAVAILABLE" };
  const zone = resolveZone(ctx.district, ctx.neighborhood);
  if (!zone) return { ok: false, reason: "DELIVERY_ZONE_NOT_FOUND" };
  const branch = getBranch(zone.branchId);
  if (!branch || !branch.active) return { ok: false, reason: "BRANCH_DISABLED" };
  if (!branch.deliveryEnabled) return { ok: false, reason: "DELIVERY_UNAVAILABLE" };
  // D15: the fee comes from the fee store (Supabase) — never from the zone list.
  // Not set -> no delivery here; not readable -> no answer built on older values.
  const fee = deliveryFeeFor(zone.id);
  if (fee.kind === "unavailable") return { ok: false, reason: "DELIVERY_INFO_UNAVAILABLE" };
  if (fee.kind === "unset") return { ok: false, reason: "DELIVERY_FEE_NOT_SET" };
  return {
    ok: true,
    branch,
    zoneId: zone.id,
    deliveryFee: fee.kind === "paid" ? fee.fee : 0,
    deliveryFeeState: fee.kind,
  };
}

/* -------------------------------------------------------------------------- */
/* Per-(branch, product) date + slot evaluation                               */
/* -------------------------------------------------------------------------- */

type StockCheck = { ok: boolean; reason: ReasonCode | null };

/**
 * Branch stock for a date — the only product rule for dates (D44): a product
 * the branch has set "passive" can't go out today but stays orderable from
 * tomorrow; an active one can go out today. No preparation time, production
 * day, per-product wait, cut-off or buffer.
 */
function branchDayCheck(bp: BranchProduct, iso: string, todayISO: string): StockCheck {
  return bp.status === "passive" && iso === todayISO ? { ok: false, reason: "NEXT_DAY_ONLY" } : { ok: true, reason: null };
}

/**
 * One of the branch's windows on a date — the same for every product. There
 * is no hourly order limit (D11): a window closes only outside opening hours
 * or once it has started (`slotHasStarted`, Europe/Istanbul). Stock is
 * checked per product and day (`branchDayCheck`).
 */
function evalSlot(def: DeliverySlotDefinition, iso: string, branch: Branch, now: Date): SlotAvailability {
  const base = { slotId: def.id, startTime: def.startTime, endTime: def.endTime, label: slotLabel(def) };

  const weekday = weekdayOfISO(iso) as Weekday;
  if (!isBranchOpenAt(branch, weekday, def.startTime)) {
    return { ...base, available: false, reason: "BRANCH_CLOSED" };
  }
  if (slotHasStarted(iso, def.startTime, now)) {
    return { ...base, available: false, reason: "SLOT_STARTED" };
  }
  return { ...base, available: true, reason: null };
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
    deliveryFeeState: null,
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
  const { branch, zoneId, deliveryFee, deliveryFeeState } = resolved;

  const bp = getBranchProduct(branch.id, product.id);
  if (!bp || !bp.active) {
    return emptyResult("PRODUCT_DISABLED_AT_BRANCH", requestedDate, {
      branchId: branch.id,
      branchName: branch.name,
      deliveryZoneId: zoneId,
      deliveryFee,
      deliveryFeeState,
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
          daySlots = defs.map((def) => evalSlot(def, iso, branch, now));
          const openSlots = daySlots.filter((s) => s.available);
          if (openSlots.length === 0) {
            // today, after the last window has started -> say so; otherwise generic
            dayReason = daySlots.some((s) => s.reason === "SLOT_STARTED") ? "NO_SLOTS_LEFT_TODAY" : "DATE_UNAVAILABLE";
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
    deliveryFeeState,
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
    deliveryFeeState: null,
  };

  if (req.items.length === 0) return base;

  const resolved = resolveContextBranch(req.context);
  if (!resolved.ok) {
    return { ...base, itemIssues: [{ productId: "*", productName: "", variantId: null, reason: resolved.reason, earliestDate: null }] };
  }
  const { branch, deliveryFee, deliveryFeeState } = resolved;

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

  // the first stock reason any item has on a date (a passive item holds the whole order to tomorrow)
  const stockBlock = (iso: string): ReasonCode | null => {
    for (const { item } of perItem) {
      const bp = getBranchProduct(branch.id, resolveProduct(item.productId, item.productSlug)?.id ?? "");
      if (!bp) return "PRODUCT_DISABLED_AT_BRANCH";
      const stock = branchDayCheck(bp, iso, todayISO);
      if (!stock.ok) return stock.reason;
    }
    return null;
  };

  const blockedToday = stockBlock(requestedDate);
  const slots: SlotAvailability[] = defs.map((def) => {
    const slot = evalSlot(def, requestedDate, branch, now);
    return blockedToday ? { ...slot, available: false, reason: blockedToday } : slot;
  });

  // Earliest shared slot across the whole horizon.
  let earliest: CartAvailabilityResult["earliestAvailableSlot"] = null;
  const horizonDates = perItem[0]?.result.dates ?? [];
  for (const d of horizonDates) {
    if (stockBlock(d.date)) continue;
    const wd = weekdayOfISO(d.date) as Weekday;
    const dayDefs = slotRepo.forBranchDay(branch.id, wd);
    const shared = dayDefs.find((def) => evalSlot(def, d.date, branch, now).available);
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
    deliveryFeeState,
  };
}
