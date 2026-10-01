"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { EmptyCart } from "@/components/cart/EmptyCart";
import type { CartItem } from "@/lib/cart";
import { useCart } from "@/lib/use-cart";
import { branchName } from "@/lib/cart-utils";
import {
  DELIVERY_TIME_SLOTS,
  earliestDeliveryDate,
  isValidEmail,
  isValidFullName,
  isValidPhone,
} from "@/lib/checkout-utils";
import type { CreateOrderRequest } from "@/lib/order";
import { setCheckoutHandoff } from "@/lib/checkout-handoff";
import { resolveZone } from "@/lib/delivery/zones";
import { useDelivery } from "@/lib/delivery/context";
import { reasonMessage, type CartAvailabilityResult } from "@/lib/availability";
import { CheckoutSummary } from "./CheckoutSummary";
import { ContactStep } from "./ContactStep";
import { DeliveryStep } from "./DeliveryStep";
import { TextAreaField } from "./fields";

export type ContactInfo = { fullName: string; phone: string; email: string };
export type ContactErrors = Partial<Record<keyof ContactInfo, string>>;

export type CheckoutState = {
  contact: ContactInfo;
  deliveryType: "delivery" | "pickup";
  branch: string | null;
  address: {
    district: string;
    neighborhood: string;
    addressLine: string;
    building: string;
    floor: string;
    apartment: string;
    note: string;
  };
  date: string;
  timeSlot: string | null;
  orderNote: string;
};

export type DeliveryErrors = Partial<
  Record<"district" | "neighborhood" | "addressLine" | "branch" | "date" | "timeSlot", string>
>;

/**
 * The address fields the customer types here. District and neighbourhood are
 * NOT form state: they are the shared delivery context (header "Adres", home
 * page address bar, localStorage) — read from it and written back through it.
 */
export type AddressFields = Omit<CheckoutState["address"], "district" | "neighborhood">;
type FormState = Omit<CheckoutState, "address"> & { address: AddressFields };
export type DeliveryPatch = Partial<Pick<CheckoutState, "deliveryType" | "branch" | "date" | "timeSlot">>;

const EMPTY_ADDRESS: AddressFields = {
  addressLine: "",
  building: "",
  floor: "",
  apartment: "",
  note: "",
};

// Order used to scroll to / focus the first invalid field on submit.
const FIELD_ORDER = [
  "fullName",
  "phone",
  "email",
  "district",
  "neighborhood",
  "addressLine",
  "branch",
  "date",
  "timeSlot",
];

/** "10:00 – 11:00" -> "10:00" */
const slotStartOf = (label: string | null) => label?.match(/(\d{2}:\d{2})/)?.[1];

function initialState(items: CartItem[]): FormState {
  const first = items[0];
  return {
    contact: { fullName: "", phone: "", email: "" },
    deliveryType: first?.deliveryType === "pickup" ? "pickup" : "delivery",
    branch: first?.branch ?? null,
    address: { ...EMPTY_ADDRESS },
    date: first?.deliveryDate ?? "",
    timeSlot: first?.deliveryTime ?? null,
    orderNote: "",
  };
}

function Breadcrumb() {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 font-sans text-[12px] text-taupe">
      <Link href="/" className="hover:text-burgundy">
        Ana Sayfa
      </Link>
      <span>/</span>
      <Link href="/sepet" className="hover:text-burgundy">
        Sepet
      </Link>
      <span>/</span>
      <span className="text-warm-brown">Sipariş Bilgileri</span>
    </nav>
  );
}

export function CheckoutPage() {
  const router = useRouter();
  const items = useCart();

  const { context, isHydrated, setDeliveryAddress, setDeliveryDistrict } = useDelivery();
  const [state, setState] = useState<FormState>(() => initialState([]));
  const [seeded, setSeeded] = useState(false);
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});
  const [deliveryErrors, setDeliveryErrors] = useState<DeliveryErrors>({});
  const [minDate, setMinDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showErrorHint, setShowErrorHint] = useState(false);
  const [showNote, setShowNote] = useState(false);

  const requestIdRef = useRef("");

  // district + neighbourhood come from the shared context only — nothing here
  // writes them until the customer changes them, so the stored choice can't be
  // overwritten by an empty form before localStorage has been read
  const district = context.district ?? "";
  const neighborhood = context.neighborhood ?? "";
  const view: CheckoutState = { ...state, address: { ...state.address, district, neighborhood } };
  const [regionNotice, setRegionNotice] = useState<string | null>(null);

  // Seed the form from the cart once real items are available (render-phase adjust).
  if (!seeded && items.length > 0) {
    setSeeded(true);
    setState(initialState(items));
  }

  useEffect(() => {
    if (items.length === 0) return;
    // Depends on the viewer's wall clock -> client only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMinDate(earliestDeliveryDate(items));
  }, [items]);

  const patch = (p: DeliveryPatch) => {
    setState((s) => ({ ...s, ...p }));
    setDeliveryErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(p)) delete next[k as keyof DeliveryErrors];
      // Switching delivery type hides one field group — drop its stale errors.
      if ("deliveryType" in p) {
        delete next.district;
        delete next.neighborhood;
        delete next.addressLine;
        delete next.branch;
      }
      return next;
    });
  };

  const patchContact = (p: Partial<ContactInfo>) => {
    setState((s) => ({ ...s, contact: { ...s.contact, ...p } }));
    setContactErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(p)) delete next[k as keyof ContactInfo];
      return next;
    });
  };

  const clearRegionErrors = () =>
    setDeliveryErrors((e) => {
      const next = { ...e };
      delete next.district;
      delete next.neighborhood;
      return next;
    });

  // a new district clears the neighbourhood (shared-context rule)
  const changeDistrict = (d: string) => {
    setDeliveryDistrict(d || null);
    clearRegionErrors();
  };
  const changeNeighborhood = (n: string) => {
    if (n) setDeliveryAddress(district, n);
    else setDeliveryDistrict(district || null);
    clearRegionErrors();
  };

  /*
   * Region change (here, in the header or anywhere else) -> re-check the cart
   * for the new address: serving branch, products offered there, and whether
   * the chosen date / time still work. Whatever no longer works is cleared and
   * the customer is told why. The first read of the stored address is not a
   * change.
   */
  const latest = useRef({ state, items });
  useEffect(() => {
    latest.current = { state, items };
  });
  const regionKey = isHydrated ? `${district}|${neighborhood}` : null;
  const lastRegion = useRef<string | null>(null);
  const lastBranch = useRef<string | null>(null);

  useEffect(() => {
    if (regionKey === null) return;
    const prev = lastRegion.current;
    lastRegion.current = regionKey;
    const { state: s, items: cart } = latest.current;
    if (prev === null) {
      lastBranch.current = resolveZone(district, neighborhood)?.branchId ?? cart[0]?.branch ?? null;
      return;
    }
    if (prev === regionKey) return;
    // district changed and the neighbourhood is still empty, or the address isn't used (pickup)
    if (!district || !neighborhood || s.deliveryType !== "delivery" || cart.length === 0) {
      setRegionNotice(null);
      return;
    }

    const ctrl = new AbortController();
    const slotStart = slotStartOf(s.timeSlot);
    fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "cart",
        context: { fulfillmentType: "delivery", district, neighborhood, deliveryZoneId: null, branchId: null },
        items: cart.map((i) => ({ productId: i.productId, productSlug: i.slug, variantId: i.selectedVariant, quantity: i.quantity })),
        date: s.date || undefined,
        slotStart: s.date ? slotStart : undefined,
      }),
      signal: ctrl.signal,
    })
      .then((r) => r.json() as Promise<CartAvailabilityResult>)
      .then((res) => {
        const now = latest.current.state;
        // not served at all
        const noBranch = res.itemIssues.find((i) => i.productId === "*");
        if (noBranch || !res.branchId) {
          lastBranch.current = null;
          setRegionNotice(reasonMessage(noBranch?.reason ?? "DELIVERY_ZONE_NOT_FOUND"));
          return;
        }

        const parts: string[] = [];
        const before = lastBranch.current ?? latest.current.items[0]?.branch ?? null;
        if (res.branchId !== before && res.branchName) {
          parts.push(`Teslimat bölgeniz güncellendi; siparişiniz ${res.branchName} şubesinden hazırlanacak.`);
        }
        lastBranch.current = res.branchId;

        const notOffered = res.itemIssues.filter((i) => i.reason === "PRODUCT_DISABLED_AT_BRANCH").map((i) => i.productName);
        if (notOffered.length > 0) parts.push(`${notOffered.join(", ")} bu bölgede sunulmuyor.`);

        // only judge the choice the check was made for (the customer may have moved on meanwhile)
        if (now.date === s.date && now.timeSlot === s.timeSlot) {
          const dateOk =
            Boolean(s.date) && s.date === res.requestedDate && res.itemIssues.length === 0 && res.slots.some((x) => x.available);
          const slotOk = dateOk && (!s.timeSlot || Boolean(res.slots.find((x) => x.startTime === slotStart)?.available));
          if (s.date && !dateOk) {
            setState((st) => ({ ...st, date: "", timeSlot: null }));
            setDeliveryErrors((e) => ({ ...e, date: "Bu bölge için yeni bir teslimat tarihi seçin." }));
            parts.push("Seçtiğiniz teslimat tarihi bu bölgede uygun olmadığı için tarih ve saat temizlendi; lütfen yeniden seçin.");
          } else if (s.timeSlot && !slotOk) {
            setState((st) => ({ ...st, timeSlot: null }));
            setDeliveryErrors((e) => ({ ...e, timeSlot: "Bu bölge için yeni bir saat aralığı seçin." }));
            parts.push("Seçtiğiniz saat aralığı bu bölgede uygun olmadığı için temizlendi; lütfen yeni bir saat seçin.");
          }
        }
        setRegionNotice(parts.length > 0 ? parts.join(" ") : null);
      })
      .catch(() => {});
    return () => ctrl.abort();
    // runs on region changes only; form values are read through `latest`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionKey]);

  const patchAddress = (p: Partial<AddressFields>) => {
    setState((s) => ({ ...s, address: { ...s.address, ...p } }));
    setDeliveryErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(p)) delete next[k as keyof DeliveryErrors];
      return next;
    });
  };

  // Validate the whole form in one pass. Reuses the existing field-level helpers.
  const validateAll = () => {
    const c: ContactErrors = {};
    if (!isValidFullName(state.contact.fullName)) c.fullName = "Ad ve soyadınızı girin.";
    if (!isValidPhone(state.contact.phone)) c.phone = "Geçerli bir telefon numarası girin.";
    if (!isValidEmail(state.contact.email)) c.email = "Geçerli bir e-posta adresi girin.";

    const d: DeliveryErrors = {};
    if (state.deliveryType === "delivery") {
      if (!district) d.district = "İlçe seçin.";
      if (!neighborhood) d.neighborhood = "Mahalle seçin.";
      else if (!resolveZone(district, neighborhood)) d.neighborhood = reasonMessage("DELIVERY_ZONE_NOT_FOUND");
      if (state.address.addressLine.trim().length < 10) d.addressLine = "Açık adres girin.";
    } else if (!state.branch) {
      d.branch = "Bir mağaza seçin.";
    }
    if (!state.date) d.date = "Teslimat tarihi seçin.";
    else if (minDate && state.date < minDate)
      d.date = "Bu sipariş için daha erken bir tarih seçilemez.";
    if (!state.timeSlot) d.timeSlot = "Teslimat saati seçin.";

    setContactErrors(c);
    setDeliveryErrors(d);

    const merged = { ...c, ...d } as Record<string, string | undefined>;
    return { ok: Object.keys(merged).length === 0, merged };
  };

  const focusFirstError = (merged: Record<string, string | undefined>) => {
    const key = FIELD_ORDER.find((k) => merged[k]);
    if (!key) return;
    const el = document.getElementById(key);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (el instanceof HTMLElement) el.focus({ preventScroll: true });
  };

  // Checkout no longer creates the order directly — it validates, hands the
  // (non-sensitive) order request to the payment step and navigates to /hizli-siparis-odeme.
  // The /api/orders backend is untouched; order creation happens after payment.
  const proceedToPayment = () => {
    if (submitting) return;

    const { ok, merged } = validateAll();
    if (!ok) {
      setShowErrorHint(true);
      focusFirstError(merged);
      return;
    }
    setShowErrorHint(false);

    if (!requestIdRef.current) {
      requestIdRef.current =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }

    const earliest = minDate || earliestDeliveryDate(items);
    const deliveryDate = state.date && state.date >= earliest ? state.date : earliest;
    const deliveryTimeSlot = state.timeSlot ?? DELIVERY_TIME_SLOTS[0];

    // branch routing: pickup uses the chosen branch; delivery uses the zone of
    // the address shown here — the same resolution as the shared context
    const zone = state.deliveryType === "delivery" ? resolveZone(district, neighborhood) : null;
    const branchId = state.deliveryType === "pickup" ? state.branch : zone?.branchId ?? null;
    const slotStart = deliveryTimeSlot.match(/(\d{2}:\d{2})/)?.[1] ?? "10:00";

    const request: CreateOrderRequest = {
      clientRequestId: requestIdRef.current,
      customer: { ...state.contact },
      delivery: {
        type: state.deliveryType,
        branchSlug: branchId,
        date: deliveryDate,
        timeSlot: deliveryTimeSlot,
        address:
          state.deliveryType === "delivery"
            ? {
                district,
                neighborhood,
                addressLine: state.address.addressLine,
                building: state.address.building || undefined,
                floor: state.address.floor || undefined,
                apartment: state.address.apartment || undefined,
                note: state.address.note || undefined,
              }
            : null,
      },
      items: items.map((ci) => ({
        productId: ci.productId,
        productSlug: ci.slug,
        productName: ci.productName,
        variantId: ci.selectedVariant,
        variantLabel: ci.variantLabel,
        quantity: ci.quantity,
        unitPrice: ci.unitPrice,
        cakeMessage: ci.customization.message || undefined,
        extras: ci.customization.extras.length > 0 ? ci.customization.extras : undefined,
        note: ci.customization.note || undefined,
      })),
      orderNote: state.orderNote.trim() || undefined,
    };

    const addressText =
      state.deliveryType === "delivery"
        ? [neighborhood, state.address.addressLine, district].filter(Boolean).join(", ")
        : state.branch
          ? branchName(state.branch)
          : null;

    setSubmitting(true);
    setCheckoutHandoff({
      request,
      summary: {
        fullName: state.contact.fullName,
        phone: state.contact.phone,
        deliveryLabel: state.deliveryType === "pickup" ? "Mağazadan Teslim" : "Adrese Teslim",
        addressText,
        date: deliveryDate,
        timeSlot: deliveryTimeSlot,
      },
      reservation: branchId
        ? {
            branchId,
            deliveryZoneId: zone?.id ?? null,
            date: deliveryDate,
            slotStart,
            items: items.map((ci) => ({
              productId: ci.productId,
              variantId: ci.selectedVariant,
              quantity: ci.quantity,
            })),
          }
        : undefined,
    });
    router.push("/hizli-siparis-odeme");
  };

  if (items.length === 0) {
    return (
      <Container className="pt-24 pb-20 md:pt-28">
        <Breadcrumb />
        <EmptyCart />
      </Container>
    );
  }

  const hasErrors =
    Object.keys(contactErrors).length > 0 || Object.keys(deliveryErrors).length > 0;

  return (
    <Container className="pt-24 pb-16 md:pt-28 md:pb-16">
      <Breadcrumb />

      <h1 className="mt-5 font-serif text-[30px] md:text-[38px] font-semibold leading-[1.12] text-burgundy">
        Siparişinizi Tamamlayın
      </h1>
      <p className="mt-2 font-sans text-[14px] text-warm-brown">
        Teslimat ve iletişim bilgilerinizi tamamlayın, ardından ödeme adımına geçin.
      </p>

      {showErrorHint && hasErrors && (
        <p className="mt-4 font-sans text-[13px] text-chocolate-light">
          Lütfen işaretli alanları kontrol edin.
        </p>
      )}

      <div className="mt-7 grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14 lg:items-start">
        {/* Form */}
        <div>
          <ContactStep value={state.contact} errors={contactErrors} onChange={patchContact} />

          <div className="mt-8 border-t border-sand-light pt-8">
            <DeliveryStep
              value={view}
              errors={deliveryErrors}
              minDate={minDate}
              onChange={patch}
              onAddressChange={patchAddress}
              onDistrictChange={changeDistrict}
              onNeighborhoodChange={changeNeighborhood}
              regionNotice={state.deliveryType === "delivery" ? regionNotice : null}
            />
          </div>

          <div className="mt-6">
            {!showNote ? (
              <button
                type="button"
                onClick={() => setShowNote(true)}
                className="font-sans text-[13px] font-semibold text-burgundy transition-colors hover:text-chocolate-light"
              >
                + Sipariş notu ekle
              </button>
            ) : (
              <div>
                <label
                  htmlFor="orderNote"
                  className="block font-sans text-[13px] font-semibold text-espresso"
                >
                  Sipariş Notu
                </label>
                <div className="mt-1.5">
                  <TextAreaField
                    id="orderNote"
                    rows={3}
                    value={state.orderNote}
                    onChange={(v) => setState((s) => ({ ...s, orderNote: v }))}
                    placeholder="Siparişinizle ilgili eklemek istediğiniz bir not varsa yazabilirsiniz."
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-8">
            <Link
              href="/sepet"
              className="font-sans text-[13px] font-semibold text-burgundy transition-colors hover:text-chocolate-light"
            >
              ← Sepete Dön
            </Link>
          </div>
        </div>

        {/* Summary + CTA */}
        <div>
          <div className="lg:sticky lg:top-24">
            <CheckoutSummary
              items={items}
              submitting={submitting}
              submitError={null}
              onSubmit={proceedToPayment}
            />
          </div>
        </div>
      </div>
    </Container>
  );
}
