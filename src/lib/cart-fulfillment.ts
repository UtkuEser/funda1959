"use client";

/**
 * Fulfillment layer on top of the existing cart.
 *
 * One order = one branch. The resolved/chosen branch is stamped onto every
 * cart line; each line keeps the delivery date + slot chosen for it and the
 * order ships at the latest of them (`cartDeliveryPlan`). The line's existing
 * `branch` / `deliveryType` / `deliveryDate` / `deliveryTime` fields are
 * reused, so the cart schema is untouched. This module never rewrites cart
 * mechanics — it only reads through `getCart()` and writes through
 * `patchAllItems()` / `patchEachItem()`.
 */

import { getCart, patchAllItems, patchEachItem, removeItems, type CartItem, type CartDeliveryType } from "./cart";
import type { DeliveryContext } from "./availability/types";
import { isDeliveryFeeReason, reasonMessage, type AvailabilityResult, type CartAvailabilityResult } from "./availability";
import { istanbulInstant } from "./time/istanbul";

export type CartFulfillment = {
  branchId: string | null;
  deliveryType: CartDeliveryType | null;
  date: string | null;
  slotLabel: string | null;
};

/**
 * The order's one shipping time: the latest date + window chosen across the
 * lines, compared as Europe/Istanbul instants (window start, then end). Every
 * line is sent together at that time.
 */
export type CartDeliveryPlan = {
  /** null when no line has a date and window */
  date: string | null;
  slotLabel: string | null;
  /** the lines were chosen for different dates / windows */
  mixed: boolean;
  /** some line has no date or window */
  incomplete: boolean;
};

export function cartDeliveryPlan(items: CartItem[] = getCart()): CartDeliveryPlan {
  let latest: { date: string; slotLabel: string; start: number; end: number } | null = null;
  const chosen = new Set<string>();
  let incomplete = false;
  for (const i of items) {
    const [startTime, endTime] = i.deliveryTime?.match(/\d{2}:\d{2}/g) ?? [];
    if (!i.deliveryDate || !/^\d{4}-\d{2}-\d{2}$/.test(i.deliveryDate) || !i.deliveryTime || !startTime) {
      incomplete = true;
      continue;
    }
    chosen.add(`${i.deliveryDate}|${startTime}|${endTime ?? ""}`);
    const start = istanbulInstant(i.deliveryDate, startTime).getTime();
    const end = endTime ? istanbulInstant(i.deliveryDate, endTime).getTime() : start;
    if (!latest || start > latest.start || (start === latest.start && end > latest.end)) {
      latest = { date: i.deliveryDate, slotLabel: i.deliveryTime, start, end };
    }
  }
  return { date: latest?.date ?? null, slotLabel: latest?.slotLabel ?? null, mixed: chosen.size > 1, incomplete };
}

/** Branch and type of the cart, and the shipping time every line goes out at (`cartDeliveryPlan`). */
export function readCartFulfillment(items: CartItem[] = getCart()): CartFulfillment {
  const first = items[0];
  const plan = cartDeliveryPlan(items);
  return {
    branchId: first?.branch ?? null,
    deliveryType: first?.deliveryType ?? null,
    date: plan.date,
    slotLabel: plan.slotLabel,
  };
}

/** engine "delivery" ↔ cart "address" */
export const toCartDeliveryType = (t: "delivery" | "pickup"): CartDeliveryType =>
  t === "delivery" ? "address" : "pickup";

/** true when the cart already holds items from a different branch */
export function cartHasBranchConflict(branchId: string | null, items: CartItem[] = getCart()): boolean {
  if (!branchId) return false;
  return items.some((i) => i.branch != null && i.branch !== branchId);
}

/** Stamp branch + delivery selection onto every line. */
export function stampCartFulfillment(patch: {
  branchId: string;
  deliveryType: "delivery" | "pickup";
  date: string;
  slotLabel: string;
}): void {
  patchAllItems({
    branch: patch.branchId,
    deliveryType: toCartDeliveryType(patch.deliveryType),
    deliveryDate: patch.date,
    deliveryTime: patch.slotLabel,
  });
}

/**
 * The cart's shipping time still works: stamp branch + type, keep every
 * line's own date/slot (checkout shows that they go out together at the
 * latest one); a line without a choice gets the shared one.
 */
export function keepCartFulfillment(patch: {
  branchId: string;
  deliveryType: "delivery" | "pickup";
  date: string;
  slotLabel: string;
}): void {
  patchEachItem((i) => {
    const own = Boolean(i.deliveryDate && i.deliveryTime);
    return {
      branch: patch.branchId,
      deliveryType: toCartDeliveryType(patch.deliveryType),
      deliveryDate: own ? i.deliveryDate : patch.date,
      deliveryTime: own ? i.deliveryTime : patch.slotLabel,
    };
  });
}

/**
 * Switch every line to pickup (e.g. the delivery minimum isn't met, D14) — the
 * checkout then opens on pickup; the store is confirmed there or in the selector.
 */
export function markCartForPickup(): void {
  patchAllItems({ deliveryType: "pickup" });
}

/** Clear the branch/slot stamp (e.g. after a location change). */
export function clearCartFulfillment(): void {
  patchAllItems({ branch: null, deliveryType: null, deliveryDate: null, deliveryTime: null });
}

/* -------------------------------------------------------------------------- */
/* Quick add                                                                   */
/* -------------------------------------------------------------------------- */

export type CartLinePlan =
  | { ok: true; branchId: string; deliveryType: CartDeliveryType; date: string; slotLabel: string }
  | { ok: false; message: string };

/**
 * Authoritative check before a one-tap add (quick order rows, catalog cards):
 * asks the server for the chosen branch and stamps the line with the earliest
 * slot. Callers must only call this once a branch is chosen.
 */
export async function planCartLine(input: {
  productId: string;
  productSlug: string;
  variantId: string | null;
  quantity: number;
  context: DeliveryContext;
}): Promise<CartLinePlan> {
  const check = await fetch("/api/availability", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "product", ...input }),
  })
    .then((r) => r.json() as Promise<AvailabilityResult>)
    .catch(() => null);

  if (!check) return { ok: false, message: "Uygunluk kontrol edilemedi. Lütfen tekrar deneyin." };
  // not deliverable today is not a dead end: the line is stamped with the earliest date (e.g. tomorrow)
  if (check.reason === "PRODUCT_DISABLED_AT_BRANCH") {
    return { ok: false, message: reasonMessage(check.reason) };
  }
  if (cartHasBranchConflict(check.branchId)) {
    return { ok: false, message: "Sepetinizde başka bir şubeden ürün var. Önce mevcut siparişi tamamlayın." };
  }
  const target = check.available
    ? { date: check.requestedDate, slot: check.slots.find((s) => s.available) ?? null }
    : check.earliestAvailableSlot
      ? { date: check.earliestAvailableSlot.date, slot: check.earliestAvailableSlot }
      : null;
  if (!target?.slot || !check.branchId) return { ok: false, message: reasonMessage(check.reason) };

  return {
    ok: true,
    branchId: check.branchId,
    deliveryType: toCartDeliveryType(input.context.fulfillmentType),
    date: target.date,
    slotLabel: target.slot.label,
  };
}

/**
 * Before adding a suggested product (/sepet, /checkout): the whole cart plus
 * that product, at the cart's own shipping time — the same server check as
 * checkout's "Gönderim Zamanı". Only when that time works for all of them
 * does the line go in, stamped with that time and the cart's branch / type,
 * so adding it never moves the order's shipping time; otherwise nothing is
 * added and the customer is told why.
 */
export async function planLineAtCartTime(input: {
  productId: string;
  productSlug: string;
  variantId: string | null;
  quantity: number;
  /** the context the order is checked with on this page (checkout: its own pickup store / address) */
  context: DeliveryContext;
}): Promise<CartLinePlan> {
  const items = getCart();
  const plan = cartDeliveryPlan(items);
  const slotStart = slotStartFromLabel(plan.slotLabel);
  if (!plan.date || !plan.slotLabel || !slotStart || plan.incomplete) {
    return { ok: false, message: "Sepetinizin gönderim zamanı henüz belli değil; ürün eklenmedi." };
  }
  const res = await fetch("/api/availability", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: "cart",
      context: input.context,
      items: [
        ...items.map((i) => ({ productId: i.productId, productSlug: i.slug, variantId: i.selectedVariant, quantity: i.quantity })),
        { productId: input.productId, productSlug: input.productSlug, variantId: input.variantId, quantity: input.quantity },
      ],
      date: plan.date,
      slotStart,
    }),
  })
    .then((r) => (r.ok ? (r.json() as Promise<CartAvailabilityResult>) : null))
    .catch(() => null);

  if (!res) return { ok: false, message: "Uygunluk kontrol edilemedi. Lütfen tekrar deneyin." };
  if (!res.available || res.requestedDate !== plan.date || !res.branchId) {
    return { ok: false, message: "Bu ürün siparişinizin gönderim zamanında hazırlanamıyor; sepete eklenmedi." };
  }
  const first = items[0];
  return {
    ok: true,
    branchId: first?.branch ?? res.branchId,
    deliveryType: first?.deliveryType ?? toCartDeliveryType(input.context.fulfillmentType),
    date: plan.date,
    slotLabel: plan.slotLabel,
  };
}

/* -------------------------------------------------------------------------- */
/* Revalidation                                                                */
/* -------------------------------------------------------------------------- */

export type CartLineStatus = "valid" | "updated" | "unavailable";

export type CartRevalidation = {
  status: CartLineStatus;
  availability: CartAvailabilityResult;
  unavailableItemIds: string[];
  message: string | null;
};

/** Re-run availability for the whole cart against a (possibly new) context. */
export async function revalidateCart(
  context: DeliveryContext,
  items: CartItem[] = getCart(),
): Promise<CartRevalidation> {
  if (items.length === 0) {
    return {
      status: "valid",
      availability: emptyCartAvailability(),
      unavailableItemIds: [],
      message: null,
    };
  }

  const fulfillment = readCartFulfillment(items);
  const availability = await fetch("/api/availability", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: "cart",
      context,
      items: items.map((i) => ({
        productId: i.productId,
        productSlug: i.slug,
        variantId: i.selectedVariant,
        quantity: i.quantity,
      })),
      date: fulfillment.date ?? undefined,
      slotStart: slotStartFromLabel(fulfillment.slotLabel),
    }),
  })
    .then((r) => r.json() as Promise<CartAvailabilityResult>)
    .catch(() => emptyCartAvailability());

  const unavailableItemIds = availability.itemIssues.flatMap((issue) =>
    items
      .filter((i) => i.productId === issue.productId && (issue.variantId == null || i.selectedVariant === issue.variantId))
      .map((i) => i.id),
  );

  const branchChanged = Boolean(
    fulfillment.branchId && availability.branchId && fulfillment.branchId !== availability.branchId,
  );

  let status: CartLineStatus = "valid";
  let message: string | null = null;
  // D15: no fee set for the zone / fees unreadable — refuses the whole delivery, not single lines
  const feeIssue = availability.itemIssues.find((i) => i.productId === "*" && isDeliveryFeeReason(i.reason));

  if (feeIssue) {
    status = "unavailable";
    message = reasonMessage(feeIssue.reason);
  } else if (unavailableItemIds.length > 0) {
    status = "unavailable";
    // name them: the customer sees which products the new address / branch changed
    const names = [...new Set(availability.itemIssues.filter((i) => i.productId !== "*").map((i) => i.productName).filter(Boolean))];
    message =
      names.length > 0
        ? `${names.join(", ")} seçtiğiniz teslimat koşullarında${availability.branchName ? ` (${availability.branchName})` : ""} şu an uygun değil.`
        : "Sepetinizdeki bazı ürünler seçtiğiniz teslimat koşullarında şu an uygun değil.";
  } else if (branchChanged) {
    status = "updated";
    message = `Teslimat bölgeniz değişti${availability.branchName ? `; siparişiniz ${availability.branchName} şubesinden hazırlanacak` : ""}. Sepetiniz yeni bölgenin teslimat tarihlerine göre yeniden kontrol edildi.`;
  } else if (fulfillment.slotLabel && !availability.available) {
    status = "updated";
    message = "Seçtiğiniz teslimat günü veya saati artık uygun değil; sepetiniz en erken uygun teslimata taşındı.";
  }

  return { status, availability, unavailableItemIds, message };
}

export function dropUnavailable(ids: string[]): void {
  if (ids.length > 0) removeItems(ids);
}

/* -------------------------------------------------------------------------- */

function slotStartFromLabel(label: string | null | undefined): string | undefined {
  if (!label) return undefined;
  const m = label.match(/(\d{2}:\d{2})/);
  return m ? m[1] : undefined;
}

function emptyCartAvailability(): CartAvailabilityResult {
  return {
    available: false,
    branchId: null,
    branchName: null,
    requestedDate: null,
    requestedSlotStart: null,
    slots: [],
    earliestAvailableSlot: null,
    itemIssues: [],
    deliveryFee: 0,
    deliveryFeeState: null,
  };
}
