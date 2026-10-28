"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { EmptyCart } from "@/components/cart/EmptyCart";
import type { CartItem } from "@/lib/cart";
import { useCart } from "@/lib/use-cart";
import { branchName, formatTL, subtotal } from "@/lib/cart-utils";
import { isValidEmail, isValidFullName, isValidPhone } from "@/lib/checkout-utils";
import type { CreateOrderRequest } from "@/lib/order";
import type { AccountAddress, CheckoutMember } from "@/lib/account-service";
import { isServiceArea } from "@/lib/customers/validation";
import { maxRedeemablePoints } from "@/lib/funda-points";
import { FundaPointsRedeem } from "./FundaPointsRedeem";
import { setCheckoutHandoff } from "@/lib/checkout-handoff";
import { cartDeliveryPlan } from "@/lib/cart-fulfillment";
import { resolveZone } from "@/lib/delivery/zones";
import { useDelivery } from "@/lib/delivery/context";
import { useDeliveryFee } from "@/lib/delivery/use-delivery-fee";
import {
  HORIZON_DAYS,
  reasonMessage,
  type CartAvailabilityResult,
  type DeliveryContext,
} from "@/lib/availability";
import { slotHasStarted } from "@/lib/delivery/slots";
import { addDaysISO, istanbulDateISO } from "@/lib/time/istanbul";
import { useNow } from "@/lib/time/use-now";
import { CheckoutSummary } from "./CheckoutSummary";
import { MIN_DELIVERY_ORDER_TL, deliveryMinimumShortfall } from "@/lib/order-rules";
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
  /** the cart's shipping time (`cartDeliveryPlan`) — not chosen on this page */
  date: string;
  timeSlot: string | null;
  orderNote: string;
};

export type DeliveryErrors = Partial<Record<"district" | "neighborhood" | "addressLine" | "branch", string>>;

/** The "Gönderim Zamanı" box: the cart's shipping time and whether the order can go out then. */
export type ShippingTime = {
  date: string | null;
  slotLabel: string | null;
  /** the products were chosen for different dates / windows */
  mixed: boolean;
  /** pending = waiting for the address / store; checking = waiting for the server */
  status: "ok" | "pending" | "checking" | "blocked";
  /** why the order can't go out at that time (blocked only) */
  problem: string | null;
  /** the fix is changing the chosen dates / windows in the cart */
  editInCart: boolean;
};

/**
 * The address fields the customer types here. District and neighbourhood are
 * NOT form state: they are the shared delivery context (header "Adres", home
 * page address bar, localStorage) — read from it and written back through it.
 */
export type AddressFields = Omit<CheckoutState["address"], "district" | "neighborhood">;
type FormState = Omit<CheckoutState, "address" | "date" | "timeSlot"> & { address: AddressFields };
export type DeliveryPatch = Partial<Pick<CheckoutState, "deliveryType" | "branch">>;

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
  "shipTime",
];

/** "10:00 – 11:00" -> "10:00" */
const slotStartOf = (label: string | null) => label?.match(/(\d{2}:\d{2})/)?.[1];

function initialState(items: CartItem[], member: CheckoutMember | null): FormState {
  const first = items[0];
  const p = member?.profile;
  return {
    // D24: a member's contact comes from the profile; editable for this order only
    contact: p ? { fullName: p.fullName, phone: p.phone, email: p.email } : { fullName: "", phone: "", email: "" },
    deliveryType: first?.deliveryType === "pickup" ? "pickup" : "delivery",
    branch: first?.branch ?? null,
    address: { ...EMPTY_ADDRESS },
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

export function CheckoutPage({ member = null }: { member?: CheckoutMember | null }) {
  const router = useRouter();
  const items = useCart();

  const { context, isHydrated, areasReady, setDeliveryAddress, setDeliveryDistrict } = useDelivery();
  const [state, setState] = useState<FormState>(() => initialState([], member));
  // the saved address the delivery fields currently hold (null once the customer edits them)
  const [savedAddressId, setSavedAddressId] = useState<string | null>(null);
  // Funda Puan to use — only when the server offered points (on + member, D41)
  const pointsInfo = member?.points ?? null;
  const [pointsWanted, setPointsWanted] = useState(0);
  const [seeded, setSeeded] = useState(false);
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});
  const [deliveryErrors, setDeliveryErrors] = useState<DeliveryErrors>({});
  // Europe/Istanbul "now", refreshed while the page is open: past dates and
  // windows that have started can't be chosen (D44); null before mount
  const now = useNow();
  const todayISO = now ? istanbulDateISO(now) : "";
  const [submitting, setSubmitting] = useState(false);
  const [showErrorHint, setShowErrorHint] = useState(false);
  const [showNote, setShowNote] = useState(false);

  const requestIdRef = useRef("");

  // district + neighbourhood come from the shared context only — nothing here
  // writes them until the customer changes them, so the stored choice can't be
  // overwritten by an empty form before localStorage has been read
  const district = context.district ?? "";
  const neighborhood = context.neighborhood ?? "";
  // the order's one shipping time: the latest date + window chosen for the cart's products
  const plan = cartDeliveryPlan(items);
  const view: CheckoutState = {
    ...state,
    address: { ...state.address, district, neighborhood },
    date: plan.date ?? "",
    timeSlot: plan.slotLabel,
  };
  const [regionNotice, setRegionNotice] = useState<string | null>(null);

  // Seed the form from the cart once real items are available (render-phase adjust).
  if (!seeded && items.length > 0) {
    setSeeded(true);
    setState(initialState(items, member));
  }

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
    setSavedAddressId(null);
    clearRegionErrors();
  };
  const changeNeighborhood = (n: string) => {
    if (n) setDeliveryAddress(district, n);
    else setDeliveryDistrict(district || null);
    setSavedAddressId(null);
    clearRegionErrors();
  };

  /** A member picks one of their saved addresses: its area goes to the shared context, the rest to the form. */
  const applySavedAddress = (a: AccountAddress) => {
    if (a.district !== district || a.neighborhood !== neighborhood) setDeliveryAddress(a.district, a.neighborhood);
    setState((s) => ({
      ...s,
      address: {
        addressLine: a.addressLine,
        building: a.building ?? "",
        floor: a.floor ?? "",
        apartment: a.apartment ?? "",
        note: a.note ?? "",
      },
    }));
    setSavedAddressId(a.id);
    setDeliveryErrors((e) => {
      const next = { ...e };
      delete next.district;
      delete next.neighborhood;
      delete next.addressLine;
      return next;
    });
  };
  const selectSavedAddress = (id: string) => {
    const a = member?.addresses.find((x) => x.id === id);
    if (a) applySavedAddress(a);
    else setSavedAddressId(null);
  };

  /*
   * D24: the member's default address may start selected — only when the form
   * has no address yet and the stored area is empty or already that address's
   * area (an area chosen in the header is never overridden). Once per visit.
   */
  const defaultApplied = useRef(false);
  useEffect(() => {
    if (defaultApplied.current || !member || !isHydrated || !seeded) return;
    defaultApplied.current = true;
    const def = member.addresses.find((a) => a.isDefault && isServiceArea(a.district, a.neighborhood));
    if (!def || state.deliveryType !== "delivery" || state.address.addressLine.trim()) return;
    const sameArea = (!district && !neighborhood) || (district === def.district && neighborhood === def.neighborhood);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time prefill after the stored area is read
    if (sameArea) applySavedAddress(def);
    // runs once, when the stored delivery context and the cart are both available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member, isHydrated, seeded]);

  /*
   * The stored address when the page opens, and every change of it (here, in
   * the header or anywhere else) or of the delivery type -> check the cart for
   * that address: serving branch, delivery fee (set / readable) and products
   * offered there; the customer is told what changed. The shipping time is
   * checked for the new address by the "Gönderim Zamanı" box below.
   */
  const latest = useRef({ state, items });
  useEffect(() => {
    latest.current = { state, items };
  });
  const regionKey = isHydrated && seeded ? `${state.deliveryType}|${district}|${neighborhood}` : null;
  const lastRegion = useRef<string | null>(null);
  const lastBranch = useRef<string | null>(null);

  useEffect(() => {
    if (regionKey === null) return;
    const prev = lastRegion.current;
    lastRegion.current = regionKey;
    const { state: s, items: cart } = latest.current;
    if (prev === null) {
      // first look at the stored address: checked like a change, without a "branch changed" note
      lastBranch.current = resolveZone(district, neighborhood)?.branchId ?? cart[0]?.branch ?? null;
    } else if (prev === regionKey) {
      return;
    }
    // district changed and the neighbourhood is still empty, or the address isn't used (pickup)
    if (!district || !neighborhood || s.deliveryType !== "delivery" || cart.length === 0) {
      setRegionNotice(null);
      return;
    }

    const ctrl = new AbortController();
    fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "cart",
        context: { fulfillmentType: "delivery", district, neighborhood, deliveryZoneId: null, branchId: null },
        items: cart.map((i) => ({ productId: i.productId, productSlug: i.slug, variantId: i.selectedVariant, quantity: i.quantity })),
      }),
      signal: ctrl.signal,
    })
      .then((r) => r.json() as Promise<CartAvailabilityResult>)
      .then((res) => {
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
        setRegionNotice(parts.length > 0 ? parts.join(" ") : null);
      })
      .catch(() => {});
    return () => ctrl.abort();
    // runs on the first read and on region / delivery-type changes; form values are read through `latest`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionKey]);

  /*
   * "Gönderim Zamanı": the whole order goes out at the latest date + window
   * chosen for its products (`plan`). It is checked with the server's own
   * rules — the engine POST /api/orders runs too: the branch serving this
   * address / store, its windows and hours, each product's stock that day
   * (D44) — and, by the Istanbul clock, a passed date, a started window and
   * the order horizon. A time that doesn't work is never moved here; the
   * customer changes it in the cart. Re-checked when the time, address /
   * store, cart or Istanbul day changes.
   */
  const slotContext: DeliveryContext | null =
    state.deliveryType === "pickup"
      ? state.branch
        ? { fulfillmentType: "pickup", district: null, neighborhood: null, deliveryZoneId: null, branchId: state.branch }
        : null
      : district && neighborhood
        ? { fulfillmentType: "delivery", district, neighborhood, deliveryZoneId: null, branchId: null }
        : null;
  const cartKey = items.map((i) => `${i.productId}:${i.slug}:${i.selectedVariant ?? ""}:${i.quantity}`).join(",");
  const planStart = slotStartOf(plan.slotLabel);
  const shipKey =
    isHydrated && seeded && todayISO && slotContext && plan.date && planStart && !plan.incomplete
      ? JSON.stringify([slotContext, plan.date, planStart, cartKey, todayISO])
      : null;
  // the server's answer for a key; result null = the check itself failed
  const [shipCheck, setShipCheck] = useState<{ key: string; result: CartAvailabilityResult | null } | null>(null);
  useEffect(() => {
    if (!shipKey) return;
    const [context, date, slotStart] = JSON.parse(shipKey) as [DeliveryContext, string, string];
    const ctrl = new AbortController();
    fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "cart",
        context,
        items: latest.current.items.map((i) => ({ productId: i.productId, productSlug: i.slug, variantId: i.selectedVariant, quantity: i.quantity })),
        date,
        slotStart,
      }),
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? (r.json() as Promise<CartAvailabilityResult>) : null))
      .then((result) => setShipCheck({ key: shipKey, result }))
      .catch(() => {
        if (!ctrl.signal.aborted) setShipCheck({ key: shipKey, result: null });
      });
    return () => ctrl.abort();
  }, [shipKey]);

  const shipping = ((): ShippingTime => {
    const base = { date: plan.date, slotLabel: plan.slotLabel, mixed: plan.mixed };
    const blocked = (problem: string, editInCart = true): ShippingTime => ({ ...base, status: "blocked", problem, editInCart });
    const waiting = (status: "pending" | "checking"): ShippingTime => ({ ...base, status, problem: null, editInCart: false });

    if (!plan.date || !planStart) return blocked("Sepetinizdeki ürünler için teslimat zamanı seçilmemiş.");
    if (plan.incomplete) return blocked("Sepetinizdeki bazı ürünler için teslimat zamanı seçilmemiş.");
    if (!now) return waiting("pending");
    if (plan.date < todayISO) return blocked("Seçilen teslimat tarihi geçti.");
    if (slotHasStarted(plan.date, planStart, now)) return blocked("Seçilen saat aralığı başladı.");
    if (plan.date > addDaysISO(todayISO, HORIZON_DAYS - 1)) return blocked("Seçilen teslimat tarihi için henüz sipariş alınmıyor.");
    // the address / store isn't known yet — those fields ask for it
    if (!shipKey) return waiting("pending");
    if (shipCheck?.key !== shipKey) return waiting("checking");

    const res = shipCheck.result;
    if (!res) return blocked("Gönderim zamanı şu an doğrulanamadı. Lütfen biraz sonra tekrar deneyin.", false);
    if (res.available && res.requestedDate === plan.date) return { ...base, status: "ok", problem: null, editInCart: false };
    // the address / store itself isn't served: fixed above, not in the cart
    const place = res.itemIssues.find((i) => i.productId === "*");
    if (place) return blocked(reasonMessage(place.reason), false);
    // same reading as POST /api/orders: a product first, then the window
    const issue = res.itemIssues[0];
    const slot = res.slots.find((s) => s.startTime === planStart);
    const why = issue
      ? `${issue.productName}: ${reasonMessage(issue.reason)}`
      : !slot
        ? "Seçilen saat aralığı bu şubenin teslimat saatleri arasında yok."
        : reasonMessage(slot.reason) || "Seçilen tarih ve saat bu sipariş için uygun değil.";
    return blocked(`Bu gönderim zamanı ${res.branchName ? `${res.branchName} şubesi` : "şube"} için uygun değil. ${why}`);
  })();

  const patchAddress = (p: Partial<AddressFields>) => {
    setState((s) => ({ ...s, address: { ...s.address, ...p } }));
    setSavedAddressId(null);
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
      // the map not loaded: no verdict here — the server resolves the address on the order anyway
      else if (areasReady && !resolveZone(district, neighborhood)) d.neighborhood = reasonMessage("DELIVERY_ZONE_NOT_FOUND");
      if (state.address.addressLine.trim().length < 10) d.addressLine = "Açık adres girin.";
    } else if (!state.branch) {
      d.branch = "Bir mağaza seçin.";
    }
    setContactErrors(c);
    setDeliveryErrors(d);

    // the shipping time's problem shows in its own box (it is changed in the cart)
    const merged = {
      ...c,
      ...d,
      ...(shipping.status === "blocked" ? { shipTime: shipping.problem ?? "" } : {}),
    } as Record<string, string | undefined>;
    return { ok: Object.keys(merged).length === 0 && shipping.status === "ok", merged };
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
  // D14: delivery minimum (products − discount; no discount logic yet, the
  // server re-checks with the real one); pickup is exempt
  const deliveryShortfall = deliveryMinimumShortfall(state.deliveryType, subtotal(items), 0);
  const minimumError =
    deliveryShortfall > 0
      ? `Adrese teslim için minimum sipariş tutarı ${formatTL(MIN_DELIVERY_ORDER_TL)} (teslimat ücreti hariç). ${formatTL(deliveryShortfall)} daha ekleyin veya "Mağazadan Teslim"i seçin.`
      : null;

  // D15: the zone's current fee from the server; no payment step without it
  // (not set / outside every zone / unreadable -> the reason shows in the summary)
  const fee = useDeliveryFee(state.deliveryType, district, neighborhood, isHydrated && seeded);
  const addressGiven = state.deliveryType === "delivery" && Boolean(district && neighborhood);
  const feeBlocked = addressGiven && (fee.status === "loading" || fee.status === "refused");
  const submitError =
    minimumError ??
    (addressGiven && fee.status === "loading"
      ? "Teslimat ücreti hesaplanıyor…"
      : shipping.status === "checking"
        ? "Gönderim zamanı kontrol ediliyor…"
        : null);

  // never more than the products (after discount) and the balance; the server checks again
  const pointsMax = pointsInfo ? maxRedeemablePoints({ subtotal: subtotal(items), discount: 0 }, pointsInfo.available) : 0;
  const pointsToRedeem = Math.min(pointsWanted, pointsMax);

  const proceedToPayment = () => {
    if (submitting || minimumError || feeBlocked || shipping.status === "checking") return;

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

    // validateAll above: the cart's shipping time, confirmed by the server — never replaced here;
    // the payment summary, the quote and the order all carry this one date + window
    const deliveryDate = plan.date ?? "";
    const deliveryTimeSlot = plan.slotLabel ?? "";

    // branch routing: pickup uses the chosen branch; delivery uses the zone of
    // the address shown here — the same resolution as the shared context
    const zone = state.deliveryType === "delivery" ? resolveZone(district, neighborhood) : null;
    const branchId = state.deliveryType === "pickup" ? state.branch : zone?.branchId ?? null;

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
      ...(pointsInfo && pointsToRedeem > 0 ? { pointsToRedeem } : {}),
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
      deliveryZoneId: zone?.id ?? null,
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
    Object.keys(contactErrors).length > 0 || Object.keys(deliveryErrors).length > 0 || shipping.status === "blocked";

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
          <ContactStep value={state.contact} errors={contactErrors} onChange={patchContact} isMember={Boolean(member)} />

          <div className="mt-8 border-t border-sand-light pt-8">
            <DeliveryStep
              value={view}
              errors={deliveryErrors}
              shipping={shipping}
              onChange={patch}
              onAddressChange={patchAddress}
              onDistrictChange={changeDistrict}
              onNeighborhoodChange={changeNeighborhood}
              regionNotice={state.deliveryType === "delivery" ? regionNotice : null}
              savedAddresses={member?.addresses ?? []}
              savedAddressId={savedAddressId}
              onSavedAddressChange={selectSavedAddress}
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
              fee={fee}
              submitting={submitting}
              submitError={submitError}
              onSubmit={proceedToPayment}
              pointsRedeemed={pointsToRedeem}
              pointsControl={
                pointsInfo ? (
                  <FundaPointsRedeem available={pointsInfo.available} max={pointsMax} value={pointsToRedeem} onChange={setPointsWanted} />
                ) : null
              }
            />
          </div>
        </div>
      </div>
    </Container>
  );
}
