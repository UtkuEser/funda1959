/**
 * Server-side validation + re-pricing for POST /api/orders.
 * The client's prices are treated as advisory only; every unit price is
 * recomputed here from `src/lib/data.ts`, the same source the catalog uses.
 */

import { catalogProducts, getProductDetail } from "./data";
import {
  ANKARA_DISTRICTS,
  DELIVERY_TIME_SLOTS,
  isValidEmail,
  isValidFullName,
  isValidPhone,
  toISODate,
} from "./checkout-utils";

const BRANCH_SLUGS = ["gop", "panora", "incek"];
const MAX_QTY = 20;

type BuildResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; error: string };

const fail = (error: string): BuildResult => ({ ok: false, error });
const str = (v: unknown): string => (typeof v === "string" ? v : "");

function earliestDate(prepHours: number): string {
  const addDays = prepHours >= 24 ? Math.ceil(prepHours / 24) : 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + addDays);
  return toISODate(d);
}

export function buildOrderPayload(body: unknown): BuildResult {
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
  let subtotal = 0;
  let maxPrep = 0;

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
    maxPrep = Math.max(maxPrep, detail?.preparationTimeHours ?? 24);

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

    const totalPrice = unitPrice * quantity;
    subtotal += totalPrice;

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
  }

  /* ---- delivery ---- */
  const d = (b.delivery ?? {}) as Record<string, unknown>;
  const type = str(d.type);
  if (type !== "delivery" && type !== "pickup") return fail("Teslimat türü geçersiz.");

  const date = str(d.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail("Teslimat tarihi geçersiz.");
  if (date < earliestDate(maxPrep)) {
    return fail("Seçilen teslimat tarihi bu sipariş için uygun değil.");
  }

  const timeSlot = str(d.timeSlot);
  if (!DELIVERY_TIME_SLOTS.includes(timeSlot)) return fail("Teslimat saati geçersiz.");

  let branchSlug: string | null = null;
  let address: Record<string, unknown> | null = null;

  if (type === "pickup") {
    branchSlug = str(d.branchSlug);
    if (!BRANCH_SLUGS.includes(branchSlug)) return fail("Mağaza seçimi geçersiz.");
  } else {
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
  }

  /* ---- totals (server-owned) ---- */
  const discount = 0;
  // TODO: delivery zone service will determine this.
  const deliveryFee = 0;
  const total = subtotal - discount + deliveryFee;

  const clientRequestId = str(b.clientRequestId).slice(0, 64) || null;

  return {
    ok: true,
    payload: {
      client_request_id: clientRequestId,
      customer: { full_name: fullName, phone, email },
      delivery: { type, branch_slug: branchSlug, date, time_slot: timeSlot, address },
      items,
      subtotal,
      delivery_fee: deliveryFee,
      discount,
      total,
      order_note: str(b.orderNote).trim() || null,
    },
  };
}
