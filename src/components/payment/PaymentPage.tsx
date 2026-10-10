"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/shared/Container";
import { EmptyCart } from "@/components/cart/EmptyCart";
import { clearCart } from "@/lib/cart";
import { useCart } from "@/lib/use-cart";
import { formatCartDate } from "@/lib/cart-utils";
import { getCheckoutHandoff, type CheckoutHandoff } from "@/lib/checkout-handoff";
import type { CreateOrderResult, OrderQuoteResult } from "@/lib/order";
import {
  PaymentForm,
  validateCard,
  EMPTY_CARD,
  type CardFormValue,
  type CardFormErrors,
} from "./PaymentForm";
import { PaymentSummary, type QuoteState } from "./PaymentSummary";

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

/** `demoOrdersEnabled` is decided on the server: local + Vercel Preview only. */
export function PaymentPage({ demoOrdersEnabled }: { demoOrdersEnabled: boolean }) {
  const router = useRouter();
  const items = useCart();
  const [handoff] = useState<CheckoutHandoff | null>(() => getCheckoutHandoff());

  // The summary shows the server's figures for exactly the request this page
  // submits, so the total on screen is the order's total (delivery fee included).
  const [quote, setQuote] = useState<QuoteState>(() => (handoff ? { status: "loading" } : { status: "unavailable" }));
  useEffect(() => {
    if (!handoff) return;
    const ctrl = new AbortController();
    const failed = "Tutar şu an hesaplanamadı. Lütfen sayfayı yenileyin.";
    fetch("/api/orders/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(handoff.request),
      signal: ctrl.signal,
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as OrderQuoteResult | null;
        setQuote(data?.ok ? { status: "ready", quote: data.quote } : { status: "error", error: (data && !data.ok && data.error) || failed });
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setQuote({ status: "error", error: failed });
      });
    return () => ctrl.abort();
  }, [handoff]);

  const [card, setCard] = useState<CardFormValue>(EMPTY_CARD);
  const [errors, setErrors] = useState<CardFormErrors>({});
  const [pending, setPending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // No capacity hold here: there is no hourly order limit (SUPABASE_PLAN.md,
  // D11), so the order is simply re-validated when it is created.
  const [orderError, setOrderError] = useState<string | null>(null);

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

  // Local + Preview only: run the funnel end to end — no payment is taken, the order stays "pending" (D8).
  const demoComplete = async () => {
    if (!handoff || submitting || quote.status !== "ready") return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...handoff.request,
          deliveryZoneId: handoff.deliveryZoneId,
        }),
      });
      const data = (await res.json().catch(() => null)) as CreateOrderResult | null;
      if (res.ok && data && data.ok) {
        clearCart();
        router.push(`/siparis-basarili?order=${encodeURIComponent(data.order.orderNumber)}`);
        return;
      }
      // never move on to the success page for an order that wasn't created
      setOrderError(data && !data.ok && data.error ? data.error : "Siparişiniz oluşturulamadı. Lütfen tekrar deneyin.");
    } catch {
      setOrderError("Siparişiniz oluşturulamadı. Lütfen tekrar deneyin.");
    }
    setSubmitting(false);
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

          {orderError && (
            <p role="alert" className="mt-4 rounded-md border border-chocolate-light/30 bg-chocolate-light/[0.05] px-3 py-2 font-sans text-[12.5px] text-chocolate-light">
              {orderError}
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

                {demoOrdersEnabled && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={demoComplete}
                      // only for a valid server quote: not while it loads, not after an error
                      disabled={!handoff || submitting || quote.status !== "ready"}
                      className="font-sans text-[12.5px] font-semibold text-taupe underline decoration-taupe/40 underline-offset-4 transition-colors hover:text-burgundy disabled:opacity-50"
                    >
                      {submitting ? "Demo akışı çalışıyor…" : "Demo Akışı Tamamla (test siparişi, ödeme alınmaz)"}
                    </button>
                    {handoff && quote.status !== "ready" && (
                      <p className="mt-1 font-sans text-[11.5px] text-taupe">
                        {quote.status === "loading"
                          ? "Tutar hesaplanıyor…"
                          : "Geçerli bir tutar hesaplanmadan demo sipariş oluşturulamaz."}
                      </p>
                    )}
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
                <PaymentSummary items={items} quote={quote} />
              </div>
            </div>
          </div>
        </>
      )}
    </Container>
  );
}
