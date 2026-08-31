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

const EMPTY_ADDRESS: CheckoutState["address"] = {
  district: "",
  neighborhood: "",
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

function initialState(items: CartItem[]): CheckoutState {
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

  const [state, setState] = useState<CheckoutState>(() => initialState([]));
  const [seeded, setSeeded] = useState(false);
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});
  const [deliveryErrors, setDeliveryErrors] = useState<DeliveryErrors>({});
  const [minDate, setMinDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showErrorHint, setShowErrorHint] = useState(false);
  const [showNote, setShowNote] = useState(false);

  const requestIdRef = useRef("");

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

  const patch = (p: Partial<CheckoutState>) => {
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

  const patchAddress = (p: Partial<CheckoutState["address"]>) => {
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
      if (!state.address.district) d.district = "İlçe seçin.";
      if (!state.address.neighborhood.trim()) d.neighborhood = "Mahalle girin.";
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

    const request: CreateOrderRequest = {
      clientRequestId: requestIdRef.current,
      customer: { ...state.contact },
      delivery: {
        type: state.deliveryType,
        branchSlug: state.deliveryType === "pickup" ? state.branch : null,
        date: deliveryDate,
        timeSlot: deliveryTimeSlot,
        address:
          state.deliveryType === "delivery"
            ? {
                district: state.address.district,
                neighborhood: state.address.neighborhood,
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

    const addr = state.address;
    const addressText =
      state.deliveryType === "delivery"
        ? [addr.neighborhood, addr.addressLine, addr.district].filter(Boolean).join(", ")
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
              value={state}
              errors={deliveryErrors}
              minDate={minDate}
              onChange={patch}
              onAddressChange={patchAddress}
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
