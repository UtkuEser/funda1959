/**
 * Availability reason codes.
 *
 * The engine only ever emits codes — never prose. `reasonMessage()` turns a
 * code into a customer-facing Turkish string; the UI can also branch on the
 * code for special handling (e.g. show a location picker for LOCATION_REQUIRED).
 */

export type ReasonCode =
  | "OK"
  | "LOCATION_REQUIRED"
  | "DELIVERY_ZONE_NOT_FOUND"
  | "BRANCH_REQUIRED"
  | "BRANCH_CLOSED"
  | "BRANCH_DISABLED"
  | "PRODUCT_DISABLED"
  | "PRODUCT_DISABLED_AT_BRANCH"
  | "OUT_OF_STOCK"
  | "DAILY_CAPACITY_FULL"
  | "PREPARATION_TIME"
  | "SAME_DAY_DISABLED"
  | "DELIVERY_SLOT_FULL"
  | "DELIVERY_UNAVAILABLE"
  | "PICKUP_UNAVAILABLE"
  | "NO_SLOTS_DEFINED"
  | "DATE_UNAVAILABLE";

const MESSAGES: Record<ReasonCode, string> = {
  OK: "Uygun.",
  LOCATION_REQUIRED: "Teslimat için önce ilçe ve mahalle seçin.",
  DELIVERY_ZONE_NOT_FOUND: "Bu adrese şu an teslimat yapamıyoruz. Mağazadan teslim alabilirsiniz.",
  BRANCH_REQUIRED: "Lütfen bir mağaza seçin.",
  BRANCH_CLOSED: "Seçtiğiniz gün mağaza kapalı.",
  BRANCH_DISABLED: "Bu mağaza şu an sipariş almıyor.",
  PRODUCT_DISABLED: "Bu ürün şu an satışta değil.",
  PRODUCT_DISABLED_AT_BRANCH: "Bu ürün seçtiğiniz bölgede/mağazada şu an sunulmuyor.",
  OUT_OF_STOCK: "Bu ürün seçtiğiniz mağazada tükendi.",
  DAILY_CAPACITY_FULL: "Bu ürünün seçtiğiniz gün için üretim kapasitesi doldu.",
  PREPARATION_TIME: "Bu ürünün hazırlanması için daha fazla süre gerekiyor.",
  SAME_DAY_DISABLED: "Bu ürün aynı gün teslimata uygun değil.",
  DELIVERY_SLOT_FULL: "Bu saat aralığı doldu.",
  DELIVERY_UNAVAILABLE: "Bu bölgede adrese teslimat yapılmıyor.",
  PICKUP_UNAVAILABLE: "Bu mağazadan teslim alma şu an mümkün değil.",
  NO_SLOTS_DEFINED: "Seçtiğiniz gün için teslimat saati tanımlı değil.",
  DATE_UNAVAILABLE: "Seçtiğiniz gün uygun değil.",
};

export function reasonMessage(code: ReasonCode | null | undefined): string {
  if (!code) return "";
  return MESSAGES[code] ?? MESSAGES.DATE_UNAVAILABLE;
}

/** codes the customer can fix by supplying more info (not a hard "no") */
export function isRecoverableReason(code: ReasonCode | null | undefined): boolean {
  return code === "LOCATION_REQUIRED" || code === "BRANCH_REQUIRED";
}
