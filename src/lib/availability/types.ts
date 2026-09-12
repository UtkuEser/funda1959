import type { ReasonCode } from "./reasons";

export type FulfillmentType = "delivery" | "pickup";

/**
 * Where + how the customer wants their order. Held for the whole session and
 * fed into every availability call. Domain code takes this as a plain object —
 * it never reads browser storage itself.
 */
export type DeliveryContext = {
  fulfillmentType: FulfillmentType;
  /** delivery flow */
  district: string | null;
  neighborhood: string | null;
  deliveryZoneId: string | null;
  /** resolved for delivery, chosen for pickup */
  branchId: string | null;
};

export const EMPTY_DELIVERY_CONTEXT: DeliveryContext = {
  fulfillmentType: "delivery",
  district: null,
  neighborhood: null,
  deliveryZoneId: null,
  branchId: null,
};

export type AvailabilityRequestItem = {
  productId: string;
  /** slug is accepted too (engine resolves either) */
  productSlug?: string;
  variantId?: string | null;
  quantity: number;
};

export type ProductAvailabilityRequest = AvailabilityRequestItem & {
  context: DeliveryContext;
  /** ISO date the customer is looking at; defaults to today */
  date?: string;
  /** injectable clock for tests / SSR determinism */
  now?: Date;
};

export type SlotAvailability = {
  slotId: string;
  startTime: string;
  endTime: string;
  /** "10:00 – 12:00" */
  label: string;
  available: boolean;
  remaining: number;
  reason: ReasonCode | null;
};

export type DateAvailability = {
  date: string;
  weekdayLabel: string;
  available: boolean;
  /** the reason the whole day is unavailable, when it is */
  reason: ReasonCode | null;
};

export type AvailabilityResult = {
  available: boolean;
  reason: ReasonCode | null;

  branchId: string | null;
  branchName: string | null;
  deliveryZoneId: string | null;
  deliveryFee: number;

  requestedDate: string;
  /** next ~14 days with an availability verdict each */
  dates: DateAvailability[];
  /** just the ISO strings that are bookable — convenience for pickers */
  availableDates: string[];

  /** slots for `requestedDate` */
  slots: SlotAvailability[];

  earliestAvailableDate: string | null;
  earliestAvailableSlot: { date: string; slotId: string; startTime: string; endTime: string; label: string } | null;

  /** effective unit price at the resolved branch (override or base) */
  unitPrice: number | null;
};

/** compact per-product verdict for catalog / quick-order rows */
export type CatalogAvailabilityVerdict = {
  available: boolean;
  reason: ReasonCode | null;
  earliestLabel: string | null;
  earliestDate: string | null;
  slotLabel: string | null;
};

export type CartAvailabilityItemIssue = {
  productId: string;
  productName: string;
  variantId: string | null;
  reason: ReasonCode;
  /** earliest date this specific item could be fulfilled */
  earliestDate: string | null;
};

export type CartAvailabilityResult = {
  available: boolean;
  branchId: string | null;
  branchName: string | null;
  requestedDate: string | null;
  requestedSlotStart: string | null;
  /** slots where the WHOLE cart can be delivered together */
  slots: SlotAvailability[];
  earliestAvailableSlot: { date: string; startTime: string; endTime: string; label: string } | null;
  itemIssues: CartAvailabilityItemIssue[];
  deliveryFee: number;
};
