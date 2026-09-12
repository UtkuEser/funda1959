"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/shared/Container";
import { EmptyCart } from "@/components/cart/EmptyCart";
import { clearCart } from "@/lib/cart";
import { useCart } from "@/lib/use-cart";
import { formatCartDate } from "@/lib/cart-utils";
import { getCheckoutHandoff, type CheckoutHandoff } from "@/lib/checkout-handoff";
import { reasonMessage, type ReasonCode } from "@/lib/availability";
import type { CreateOrderResult } from "@/lib/order";
import {
  PaymentForm,
  validateCard,
  EMPTY_CARD,
  type CardFormValue,
  type CardFormErrors,
} from "./PaymentForm";
import { PaymentSummary } from "./PaymentSummary";

const IS_DEV = process.env.NODE_ENV !== "production";

function PaymentSteps() {
  const steps = ["Sepet", "Teslimat", "Ödeme"];
  return (
    <ol className="mt-5 flex flex-wrap items-center gap-2 font-sans text-[12.5px]" aria-label="Sipariş adımları">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span
            className={i === steps.length - 1 ? "font-semibold text-burgundy" : "text-taupe"}
            aria-current={i === steps.length - 1 ? "step" : undefined}
          >
            {s}
          </span>
          {i < steps.length - 1 && <span aria-hidden className="text-taupe/50">→</span>}
        </li>
      ))}
    </ol>
  );
}

function DeliverySummary({ handoff }: { handoff: CheckoutHandoff | null }) {
  return (
    <div className="rounded-lg border border-sand-light bg-cream-light p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-[18px] font-semibold text-burgundy">Teslimat Bilgileri</h2>
        <Link
          href="/checkout"
          className="font-sans text-[13px] font-semibold text-burgundy transition-colors hover:text-chocolate-light"
        >
          Düzenle →
        </Link>
      </div>

      {handoff ? (
        <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          <Line label="Ad Soyad" value={handoff.summary.fullName} />
          <Line label="Telefon" value={handoff.summary.phone} />
          <Line label="Teslimat Şekli" value={handoff.summary.deliveryLabel} />
          <Line
            label={handoff.summary.deliveryLabel === "Mağazadan Teslim" ? "Mağaza" : "Adres"}
            value={handoff.summary.addressText ?? "—"}
          />
          <Line label="Tarih" value={formatCartDate(handoff.summary.date)} />
          <Line label="Saat" value={handoff.summary.timeSlot ?? "—"} />
        </dl>
      ) : (
        <p className="mt-3 font-sans text-[13px] leading-relaxed text-warm-brown">
          Teslimat bilgileri bu adımda görüntülenemiyor. Bilgilerinizi girmek veya güncellemek için
          sipariş bilgileri adımına dönün.
        </p>
      )}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-sans text-[12px] text-taupe">{label}</dt>
      <dd className="font-sans text-[13.5px] text-espresso">{value}</dd>
    </div>
  );
}

function mmss(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function PaymentPage() {
  const router = useRouter();
  const items = useCart();
  const [handoff] = useState<CheckoutHandoff | null>(() => getCheckoutHandoff());

  const [card, setCard] = useState<CardFormValue>(EMPTY_CARD);
  const [errors, setErrors] = useState<CardFormErrors>({});
  const [pending, setPending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [reservationId, setReservationId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [holdError, setHoldError] = useState<string | null>(null);
  const reservedRef = useRef(false);

  // place the capacity hold once, on arrival
  useEffect(() => {
    const draft = handoff?.reservation;
    if (!draft || reservedRef.current) return;
    reservedRef.current = true;

    (async () => {
      try {
        const res = await fetch("/api/reservations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            context: {
              fulfillmentType: handoff?.summary.deliveryLabel === "Mağazadan Teslim" ? "pickup" : "delivery",
              branchId: draft.branchId,
              deliveryZoneId: draft.deliveryZoneId,
              district: null,
              neighborhood: null,
            },
            date: draft.date,
            slotStart: draft.slotStart,
            items: draft.items,
          }),
        });
        const data = (await res.json().catch(() => null)) as
          | { ok?: boolean; reservationId?: string; expiresAt?: number; reason?: ReasonCode }
          | null;
        if (res.ok && data?.ok && data.reservationId) {
          setReservationId(data.reservationId);
          setExpiresAt(data.expiresAt ?? Date.now() + 10 * 60_000);
        } else {
          setHoldError(reasonMessage(data?.reason ?? "DELIVERY_SLOT_FULL"));
        }
      } catch {
        /* non-fatal for the demo — order route still re-checks */
      }
    })();
  }, [handoff]);

  // countdown
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setRemainingMs(Math.max(0, expiresAt - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  const holdExpired = remainingMs !== null && remainingMs <= 0;

  const patchCard = (patch: Partial<CardFormValue>) => {
    setCard((c) => ({ ...c, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(patch)) delete next[k as keyof CardFormErrors];
      return next;
    });
    setPending(false);
  };

  const blurField = (field: keyof CardFormValue) => {
    const fieldError = validateCard(card)[field];
    setErrors((e) => ({ ...e, [field]: fieldError }));
  };

  const completePayment = () => {
    const found = validateCard(card);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setPending(false);
      return;
    }
    setPending(true);
  };

  // Dev-only: run the funnel end to end — payment success -> confirm hold -> order.
  const demoComplete = async () => {
    if (!handoff || submitting || holdExpired) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...handoff.request,
          reservationId,
          deliveryZoneId: handoff.reservation?.deliveryZoneId ?? null,
        }),
      });
      const data = (await res.json().catch(() => null)) as CreateOrderResult | null;
      if (res.ok && data && data.ok) {
        clearCart();
        router.push(`/siparis-basarili?order=${encodeURIComponent(data.order.orderNumber)}`);
        return;
      }
      if (res.status === 409) {
        setHoldError(data && !data.ok ? data.error : "Ayırdığınız kapasitenin süresi doldu.");
      }
    } catch {
      /* fall through */
    }
    setSubmitting(false);
    if (!holdError) router.push("/siparis-basarili");
  };

  return (
    <Container className="pt-24 pb-20 md:pt-28">
      {items.length === 0 ? (
        <>
          <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-burgundy/55">
            Güvenli Ödeme
          </p>
          <EmptyCart />
        </>
      ) : (
        <>
          <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-burgundy/55">
            Güvenli Ödeme
          </p>
          <h1 className="mt-2 font-serif text-[28px] font-semibold leading-[1.12] text-burgundy md:text-[36px]">
            Siparişinizi tamamlayın.
          </h1>
          <p className="mt-2 font-sans text-[14px] leading-relaxed text-warm-brown">
            Ödeme yönteminizi seçin ve siparişinizi tamamlayın.
          </p>

          <PaymentSteps />

          {reservationId && !holdExpired && remainingMs !== null && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-md border border-burgundy/15 bg-burgundy/[0.03] px-3 py-1.5 font-sans text-[12.5px] text-warm-brown">
              Teslimat kapasiteniz ayrıldı · kalan süre
              <span className="font-semibold tabular-nums text-burgundy">{mmss(remainingMs)}</span>
            </p>
          )}
          {holdExpired && (
            <p className="mt-4 rounded-md border border-chocolate-light/30 bg-chocolate-light/[0.05] px-3 py-2 font-sans text-[12.5px] text-chocolate-light">
              Ayırdığınız teslimat kapasitesinin süresi doldu.{" "}
              <Link href="/checkout" className="font-semibold underline">
                Teslimat saatini yeniden seçin.
              </Link>
            </p>
          )}
          {holdError && !holdExpired && (
            <p className="mt-4 rounded-md border border-chocolate-light/30 bg-chocolate-light/[0.05] px-3 py-2 font-sans text-[12.5px] text-chocolate-light">
              {holdError}
            </p>
          )}

          <div className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14 lg:items-start">
            <div>
              <DeliverySummary handoff={handoff} />

              <div className="mt-8 border-t border-sand-light pt-8">
                <PaymentForm value={card} errors={errors} onChange={patchCard} onBlurField={blurField} />
              </div>

              <div className="mt-7">
                <button
                  type="button"
                  onClick={completePayment}
                  disabled={holdExpired}
                  className="h-12 w-full rounded-md bg-burgundy font-sans text-[15px] font-semibold text-cream-light transition-colors hover:bg-chocolate-light disabled:cursor-not-allowed disabled:bg-burgundy/40 sm:w-auto sm:px-10"
                >
                  Ödemeyi Tamamla
                </button>

                {pending && (
                  <p
                    role="status"
                    className="mt-3 rounded-md border border-burgundy/15 bg-burgundy/[0.03] px-4 py-3 font-sans text-[13px] leading-relaxed text-warm-brown"
                  >
                    Ödeme altyapısı entegrasyon aşamasında. Bu ekran şu an yalnızca önizleme
                    amaçlıdır; kartınızdan herhangi bir çekim yapılmaz.
                  </p>
                )}

                {IS_DEV && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={demoComplete}
                      disabled={!handoff || submitting || holdExpired}
                      className="font-sans text-[12.5px] font-semibold text-taupe underline decoration-taupe/40 underline-offset-4 transition-colors hover:text-burgundy disabled:opacity-50"
                    >
                      {submitting ? "Demo akışı çalışıyor…" : "Demo Akışı Tamamla (yalnızca geliştirme)"}
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <Link
                  href="/checkout"
                  className="font-sans text-[13px] font-semibold text-burgundy transition-colors hover:text-chocolate-light"
                >
                  ← Sipariş bilgilerine dön
                </Link>
              </div>
            </div>

            <div>
              <div className="lg:sticky lg:top-24">
                <PaymentSummary items={items} />
              </div>
            </div>
          </div>
        </>
      )}
    </Container>
  );
}
