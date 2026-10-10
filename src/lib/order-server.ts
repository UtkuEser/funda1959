/**
 * Server-side validation + pricing for POST /api/orders. Nothing the browser
 * sends is trusted beyond the customer's choices:
 *   - unit prices come from `src/lib/data.ts` (the catalog's own source),
 *     discount and delivery fee are decided here, the total is recomputed;
 *   - a delivery order's branch and zone follow from the address
 *     (`resolveContextBranch`), the client's branch / zone fields are ignored;
 *   - date and slot are checked again at order time against the availability
 *     engine — opening hours, preparation time, passive stock, the branch's
 *     own slots — in Europe/Istanbul time.
 * Errors: 400 = malformed request, 409 = valid request the order can't be
 * fulfilled as asked (the message says why).
 */

import { catalogProducts, getProductDetail } from "./data";
import { getBranch, listBranches } from "./branch";
import type { OrderQuote } from "./order";
import {
  HORIZON_DAYS,
  getCartAvailability,
  reasonMessage,
  resolveContextBranch,
  type DeliveryContext,
  type ReasonCode,
} from "./availability";
import { addDaysISO, istanbulDateISO } from "./time/istanbul";
import {
  ANKARA_DISTRICTS,
  DELIVERY_TIME_SLOTS,
  isValidEmail,
  isValidFullName,
  isValidPhone,
} from "./checkout-utils";

const BRANCH_SLUGS = listBranches().map((b) => b.slug);
const MAX_QTY = 20;

export type BuildResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; status: 400 | 409; error: string; reason?: ReasonCode | null };

const fail = (error: string): BuildResult => ({ ok: false, status: 400, error });
const unavailable = (error: string, reason: ReasonCode | null = null): BuildResult => ({ ok: false, status: 409, error, reason });
const str = (v: unknown): string => (typeof v === "string" ? v : "");
/** money in kuruş precision, so the database's sum checks match exactly */
const money = (v: number): number => Math.round(v * 100) / 100;

export function buildOrderPayload(body: unknown, { now = new Date() }: { now?: Date } = {}): BuildResult {
  if (!body || typeof body !== "object") return fail("Geçersiz istek.");
  const b = body as Record<string, unknown>;

  /* ---- customer ---- */
  const c = (b.customer ?? {}) as Record<string, unknown>;
  const fullName = str(c.fullName).trim();
  const phone = str(c.phone).trim();
  const email = str(c.email).trim();
  if (!isValidFullName(fullName)) return fail("Ad soyad geçersiz.");
  if (!isValidPhone(phone)) return fail("Telefon numarası geçersiz.");
  if (!isValidEmail(email)) return fail("E-posta adresi geçersiz.");

  /* ---- items (re-priced) ---- */
  const rawItems = Array.isArray(b.items) ? b.items : [];
  if (rawItems.length === 0) return fail("Sepetinizde ürün bulunmuyor.");

  const items: Record<string, unknown>[] = [];
  const cartLines: { productId: string; productSlug: string; variantId: string | null; quantity: number }[] = [];
  let subtotal = 0;

  for (const raw of rawItems) {
    const r = (raw ?? {}) as Record<string, unknown>;
    const slug = str(r.productSlug);
    const product = catalogProducts.find((p) => p.slug === slug);
    if (!product) return fail("Geçersiz ürün.");

    const quantity = Math.floor(Number(r.quantity));
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_QTY) {
      return fail("Geçersiz ürün adedi.");
    }

    const detail = getProductDetail(slug);
    const variantId = r.variantId == null ? null : str(r.variantId) || null;
    let unitPrice = product.priceValue;
    let variantLabel: string | null = null;

    if (variantId) {
      const variant = detail?.variants.find((v) => v.id === variantId);
      if (!variant) return fail("Geçersiz ürün seçeneği.");
      unitPrice = variant.price;
      variantLabel = variant.label;
    }

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) return fail("Ürün fiyatı belirlenemedi.");
    unitPrice = money(unitPrice);

    const totalPrice = money(unitPrice * quantity);
    subtotal = money(subtotal + totalPrice);

    const extras = Array.isArray(r.extras)
      ? r.extras.filter((x): x is string => typeof x === "string")
      : [];
    const cakeMessage = str(r.cakeMessage).trim();
    const note = str(r.note).trim();

    items.push({
      product_id: product.id,
      product_slug: product.slug,
      product_name: product.name,
      variant_id: variantId,
      variant_label: variantLabel,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      cake_message: cakeMessage || null,
      customization:
        cakeMessage || note || extras.length > 0
          ? { message: cakeMessage || null, note: note || null, extras }
          : null,
      extras: extras.length > 0 ? extras : null,
      note: note || null,
    });
    cartLines.push({ productId: product.id, productSlug: product.slug, variantId, quantity });
  }

  /* ---- delivery: form ---- */
  const d = (b.delivery ?? {}) as Record<string, unknown>;
  const type = str(d.type);
  if (type !== "delivery" && type !== "pickup") return fail("Teslimat türü geçersiz.");

  const date = str(d.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail("Teslimat tarihi geçersiz.");

  const timeSlot = str(d.timeSlot);
  if (!DELIVERY_TIME_SLOTS.includes(timeSlot)) return fail("Teslimat saati geçersiz.");
  const slotStart = timeSlot.slice(0, 5); // "10:00 – 11:00" -> "10:00"

  let context: DeliveryContext;
  let address: Record<string, unknown> | null = null;

  if (type === "pickup") {
    // pickup: the customer picks the store
    const branchSlug = str(d.branchSlug);
    if (!branchSlug) return fail("Bir mağaza seçin.");
    if (!BRANCH_SLUGS.includes(branchSlug)) return fail("Mağaza seçimi geçersiz.");
    context = { fulfillmentType: "pickup", district: null, neighborhood: null, deliveryZoneId: null, branchId: branchSlug };
  } else {
    // delivery: the branch follows from the address — d.branchSlug is ignored
    const a = (d.address ?? null) as Record<string, unknown> | null;
    if (!a) return fail("Teslimat adresi gerekli.");
    const district = str(a.district).trim();
    const neighborhood = str(a.neighborhood).trim();
    const addressLine = str(a.addressLine).trim();
    if (!ANKARA_DISTRICTS.includes(district)) return fail("İlçe geçersiz.");
    if (neighborhood.length < 2) return fail("Mahalle bilgisi gerekli.");
    if (addressLine.length < 10) return fail("Açık adres bilgisi gerekli.");
    address = {
      district,
      neighborhood,
      address_line: addressLine,
      building: str(a.building).trim() || null,
      floor: str(a.floor).trim() || null,
      apartment: str(a.apartment).trim() || null,
      note: str(a.note).trim() || null,
    };
    context = { fulfillmentType: "delivery", district, neighborhood, deliveryZoneId: null, branchId: null };
  }

  /* ---- delivery: availability at order time (Europe/Istanbul) ---- */
  const today = istanbulDateISO(now);
  if (date < today) return unavailable("Seçilen teslimat tarihi geçmişte kaldı. Lütfen yeni bir tarih seçin.", "DATE_UNAVAILABLE");
  if (date > addDaysISO(today, HORIZON_DAYS - 1)) return unavailable("Seçilen teslimat tarihi için henüz sipariş alınmıyor.", "DATE_UNAVAILABLE");

  const resolved = resolveContextBranch(context);
  if (!resolved.ok) return unavailable(reasonMessage(resolved.reason), resolved.reason);

  const cart = getCartAvailability({ context, items: cartLines, date, slotStart, now });
  if (!cart.available) {
    const slot = cart.slots.find((s) => s.startTime === slotStart);
    const reason = cart.itemIssues[0]?.reason ?? slot?.reason ?? null;
    if (!slot && !cart.itemIssues.length) {
      return unavailable("Seçilen teslimat saati bu mağaza için tanımlı değil.", "NO_SLOTS_DEFINED");
    }
    return unavailable(reasonMessage(reason) || "Seçilen tarih ve saat bu sipariş için uygun değil.", reason);
  }

  /* ---- totals (server-owned) ---- */
  const discount = 0; // no discount logic yet (campaigns are content only)
  // the fee of the zone serving the address — the same figure the product page
  // shows; Aşama 3 moves it to the database (`delivery_zone_fees`)
  const deliveryFee = type === "delivery" ? money(resolved.deliveryFee) : 0;
  const total = money(subtotal - discount + deliveryFee);

  const clientRequestId = str(b.clientRequestId).slice(0, 64) || null;

  return {
    ok: true,
    payload: {
      client_request_id: clientRequestId,
      sales_channel: "web",
      customer: { full_name: fullName, phone, email },
      delivery: {
        type,
        branch_slug: resolved.branch.slug,
        zone_id: resolved.zoneId,
        date,
        time_slot: timeSlot,
        address,
      },
      items,
      subtotal,
      delivery_fee: deliveryFee,
      discount,
      total,
      order_note: str(b.orderNote).trim() || null,
    },
  };
}

/** The figures of a built payload, for the payment screen (POST /api/orders/quote). */
export function quoteFromPayload(payload: Record<string, unknown>): OrderQuote {
  const d = payload.delivery as { type: "delivery" | "pickup"; branch_slug: string };
  const items = payload.items as {
    product_name: string;
    variant_label: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  return {
    deliveryType: d.type,
    branchName: getBranch(d.branch_slug)?.name ?? null,
    lines: items.map((i) => ({
      productName: i.product_name,
      variantLabel: i.variant_label,
      quantity: i.quantity,
      unitPrice: i.unit_price,
      lineTotal: i.total_price,
    })),
    subtotal: payload.subtotal as number,
    deliveryFee: payload.delivery_fee as number,
    discount: payload.discount as number,
    total: payload.total as number,
  };
}
