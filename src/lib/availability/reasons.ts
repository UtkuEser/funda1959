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
  | "NEXT_DAY_ONLY"
  /** today: the window has started (or passed) — Europe/Istanbul */
  | "SLOT_STARTED"
  /** today: every window of the day has started */
  | "NO_SLOTS_LEFT_TODAY"
  | "DELIVERY_UNAVAILABLE"
  | "PICKUP_UNAVAILABLE"
  | "NO_SLOTS_DEFINED"
  | "DATE_UNAVAILABLE"
  /** D15: Merkez has not set this zone's delivery fee — no delivery, pickup works */
  | "DELIVERY_FEE_NOT_SET"
  /** D15: the delivery fees could not be read — nothing is computed from older values */
  | "DELIVERY_INFO_UNAVAILABLE"
  /** D14: delivery order under the minimum (order level, not product level) */
  | "BELOW_MINIMUM";

const MESSAGES: Record<ReasonCode, string> = {
  OK: "Uygun.",
  LOCATION_REQUIRED: "Teslimat için önce ilçe ve mahalle seçin.",
  DELIVERY_ZONE_NOT_FOUND: "Bu adrese şu an teslimat yapamıyoruz. Mağazadan teslim alabilirsiniz.",
  BRANCH_REQUIRED: "Lütfen bir şube seçin.",
  BRANCH_CLOSED: "Seçtiğiniz gün mağaza kapalı.",
  BRANCH_DISABLED: "Bu mağaza şu an sipariş almıyor.",
  PRODUCT_DISABLED: "Bu ürün şu an satışta değil.",
  PRODUCT_DISABLED_AT_BRANCH: "Bu ürün seçtiğiniz bölgede/mağazada şu an sunulmuyor.",
  NEXT_DAY_ONLY: "En erken yarına teslim.",
  SLOT_STARTED: "Bu saat aralığı başladı; lütfen daha ileri bir saat seçin.",
  NO_SLOTS_LEFT_TODAY: "Bugün için seçilebilecek teslimat saati kalmadı.",
  DELIVERY_UNAVAILABLE: "Bu bölgede adrese teslimat yapılmıyor.",
  PICKUP_UNAVAILABLE: "Bu mağazadan teslim alma şu an mümkün değil.",
  NO_SLOTS_DEFINED: "Seçtiğiniz gün için teslimat saati tanımlı değil.",
  DATE_UNAVAILABLE: "Seçtiğiniz gün uygun değil.",
  DELIVERY_FEE_NOT_SET: "Bu bölge için teslimat ücreti henüz belirlenmedi; adrese teslim şu an yapılamıyor. Mağazadan teslim alabilirsiniz.",
  DELIVERY_INFO_UNAVAILABLE: "Teslimat bilgisi şu an alınamıyor. Lütfen biraz sonra tekrar deneyin veya mağazadan teslim alın.",
  BELOW_MINIMUM: "Adrese teslim için minimum sipariş tutarına ulaşılmadı.",
};

export function reasonMessage(code: ReasonCode | null | undefined): string {
  if (!code) return "";
  return MESSAGES[code] ?? MESSAGES.DATE_UNAVAILABLE;
}

/** D15: the zone's fee is not set or cannot be read — the whole delivery is refused, not one product */
export function isDeliveryFeeReason(code: ReasonCode | null | undefined): boolean {
  return code === "DELIVERY_FEE_NOT_SET" || code === "DELIVERY_INFO_UNAVAILABLE";
}

/** codes the customer can fix by supplying more info (not a hard "no") */
export function isRecoverableReason(code: ReasonCode | null | undefined): boolean {
  return code === "LOCATION_REQUIRED" || code === "BRANCH_REQUIRED";
}
