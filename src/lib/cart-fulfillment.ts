"use client";

/**
 * Fulfillment layer on top of the existing cart.
 *
 * One order = one branch. The resolved/chosen branch and the chosen delivery
 * date + slot are stamped onto every cart line (reusing the line's existing
 * `branch` / `deliveryType` / `deliveryDate` / `deliveryTime` fields), so the
 * cart schema is untouched. This module never rewrites cart mechanics — it
 * only reads through `getCart()` and writes through `patchAllItems()`.
 */

import { getCart, patchAllItems, removeItems, type CartItem, type CartDeliveryType } from "./cart";
import type { DeliveryContext } from "./availability/types";
import type { CartAvailabilityResult } from "./availability";

export type CartFulfillment = {
  branchId: string | null;
  deliveryType: CartDeliveryType | null;
  date: string | null;
  slotLabel: string | null;
};

export function readCartFulfillment(items: CartItem[] = getCart()): CartFulfillment {
  const first = items[0];
  return {
    branchId: first?.branch ?? null,
    deliveryType: first?.deliveryType ?? null,
    date: first?.deliveryDate ?? null,
    slotLabel: first?.deliveryTime ?? null,
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

/** Clear the branch/slot stamp (e.g. after a location change). */
export function clearCartFulfillment(): void {
  patchAllItems({ branch: null, deliveryType: null, deliveryDate: null, deliveryTime: null });
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

  if (unavailableItemIds.length > 0) {
    status = "unavailable";
    message = "Sepetinizdeki bazı ürünler seçtiğiniz teslimat koşullarında şu an uygun değil.";
  } else if (branchChanged || (fulfillment.slotLabel && !availability.available)) {
    status = "updated";
    message =
      "Teslimat konumunuz değişti. Sepetiniz yeni bölgenin stok ve teslimat durumuna göre yeniden kontrol edildi.";
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
  };
}
