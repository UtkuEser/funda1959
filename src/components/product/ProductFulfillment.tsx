"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useDelivery } from "@/lib/delivery/context";
import { reasonMessage, type AvailabilityResult } from "@/lib/availability";
import { SampleDataNote } from "@/components/delivery/SampleDataNote";
import { NotServedNotice } from "@/components/delivery/AddressPicker";
import { PickupStorePicker } from "@/components/delivery/PickupStorePicker";
import { DeliveryPill } from "@/components/delivery/DeliveryPill";
import { compactSlot, deliverySummary, earliestLabel } from "@/lib/delivery/labels";
import { istanbulDateISO, addDaysISO, longDateTR, MONTHS_TR_SHORT, WEEKDAYS_TR_SHORT, weekdayOfISO } from "@/lib/time/istanbul";
import { DeliveryCalendar } from "./DeliveryCalendar";

export type FulfillmentSelection = {
  /** enough context is set + a valid slot is chosen */
  canAddToCart: boolean;
  branchId: string | null;
  branchName: string | null;
  deliveryType: "delivery" | "pickup";
  date: string | null;
  slotId: string | null;
  slotLabel: string | null;
  deliveryFee: number;
  /** earliest deliverable date at the branch — the top label uses it */
  earliestDate: string | null;
};

const EMPTY: FulfillmentSelection = {
  canAddToCart: false,
  branchId: null,
  branchName: null,
  deliveryType: "delivery",
  date: null,
  slotId: null,
  slotLabel: null,
  deliveryFee: 0,
  earliestDate: null,
};

const CARD_DAYS = 7;

export function ProductFulfillment({
  productId,
  productSlug,
  variantId,
  quantity,
  onChange,
}: {
  productId: string;
  productSlug: string;
  variantId: string | null;
  quantity: number;
  onChange: (sel: FulfillmentSelection) => void;
}) {
  const { context, isResolved, addressStatus, branch, setFulfillmentType, openSelector } = useDelivery();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const closeCalendar = useCallback(() => setCalendarOpen(false), []);

  const todayISO = istanbulDateISO();
  const tomorrowISO = addDaysISO(todayISO, 1);

  // One source: the server engine (branch status, preparation time, slots —
  // Europe/Istanbul). The top label, date cards, calendar and slots all read it.
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!isResolved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvailability(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const id = setTimeout(() => {
      fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "product", productId, productSlug, variantId, quantity, context, date: selectedDate ?? undefined }),
        signal: ctrl.signal,
      })
        .then((r) => r.json())
        .then((data: AvailabilityResult) => {
          setAvailability(data);
          setLoading(false);
        })
        .catch(() => {});
    }, 80);
    return () => {
      ctrl.abort();
      clearTimeout(id);
    };
  }, [isResolved, productId, productSlug, variantId, quantity, context, selectedDate]);

  // keep the choice valid: a date that is no longer bookable falls back to the
  // earliest one; a slot that is no longer open is cleared
  useEffect(() => {
    if (!availability) return;
    const day = availability.dates.find((d) => d.date === selectedDate);
    if (!selectedDate || !day?.available) {
      const next = availability.earliestAvailableDate;
      if (next !== selectedDate) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedDate(next);
        setSelectedSlotId(null);
      }
      return;
    }
    if (availability.requestedDate !== selectedDate) return; // slots for the new date still loading
    if (selectedSlotId && !availability.slots.some((s) => s.slotId === selectedSlotId && s.available)) {
      setSelectedSlotId(null);
    }
  }, [availability, selectedDate, selectedSlotId]);

  const current = availability && availability.requestedDate === selectedDate ? availability : null;
  const chosenSlot = current?.slots.find((s) => s.slotId === selectedSlotId && s.available) ?? null;

  // publish selection upward
  useEffect(() => {
    onChange(
      availability && current && chosenSlot
        ? {
            canAddToCart: current.available && Boolean(current.branchId),
            branchId: current.branchId,
            branchName: current.branchName,
            deliveryType: context.fulfillmentType,
            date: current.requestedDate,
            slotId: chosenSlot.slotId,
            slotLabel: chosenSlot.label,
            deliveryFee: current.deliveryFee,
            earliestDate: availability.earliestAvailableDate,
          }
        : {
            ...EMPTY,
            branchId: availability?.branchId ?? null,
            branchName: availability?.branchName ?? null,
            deliveryType: context.fulfillmentType,
            earliestDate: isResolved ? (availability?.earliestAvailableDate ?? null) : null,
          },
    );
  }, [availability, current, chosenSlot, context.fulfillmentType, isResolved, onChange]);

  const pickDate = (iso: string) => {
    if (iso === selectedDate) return;
    setSelectedDate(iso);
    setSelectedSlotId(null);
  };

  const cardDays = availability?.dates.slice(0, CARD_DAYS) ?? [];
  const selectedBeyondCards = Boolean(selectedDate && !cardDays.some((d) => d.date === selectedDate));
  const topLabel = availability?.earliestAvailableDate ? earliestLabel(availability.earliestAvailableDate) : null;

  return (
    <div className="rounded-lg border border-sand-light bg-cream-light p-4 md:p-5">
      <p className="font-sans text-[13px] font-semibold text-espresso">Teslimat</p>

      {/* fulfilment type */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(["delivery", "pickup"] as const).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={context.fulfillmentType === t}
            onClick={() => {
              if (t === context.fulfillmentType) return;
              setFulfillmentType(t);
              setSelectedSlotId(null);
            }}
            className={`rounded-md border px-3 py-2 font-sans text-[13px] font-medium transition-colors ${
              context.fulfillmentType === t
                ? "border-burgundy bg-burgundy/[0.05] text-burgundy"
                : "border-sand text-warm-brown hover:border-burgundy/40"
            }`}
          >
            {t === "delivery" ? "Adrese Teslim" : "Mağazadan Teslim"}
          </button>
        ))}
      </div>

      {/* where: delivery -> the address (branch follows from it); pickup -> the store */}
      <div className="mt-3">
        {context.fulfillmentType === "pickup" ? (
          <PickupStorePicker />
        ) : addressStatus === "none" ? (
          <button
            type="button"
            onClick={() => openSelector("stock")}
            className="inline-flex h-10 w-full items-center justify-between rounded-md border border-sand bg-cream-light px-3 font-sans text-[13.5px] text-warm-brown transition-colors hover:border-burgundy/40"
          >
            Adresinizi girin
            <span aria-hidden className="text-burgundy">→</span>
          </button>
        ) : (
          <>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-[13px] text-warm-brown">
              <span className="font-medium text-espresso">
                {context.district}, {context.neighborhood}
              </span>
              {branch && (
                <>
                  <span aria-hidden>·</span>
                  <span>{branch.shortName} şubesinden hazırlanır</span>
                </>
              )}
              <button
                type="button"
                onClick={() => openSelector()}
                className="font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-2 hover:decoration-burgundy"
              >
                Değiştir
              </button>
            </p>
            {addressStatus === "unserved" && <NotServedNotice className="mt-1.5" />}
          </>
        )}
      </div>

      {/* availability */}
      {!isResolved ? (
        <p className="mt-3 font-sans text-[12.5px] leading-relaxed text-taupe">
          {context.fulfillmentType === "pickup"
            ? "Teslim alma gününü görmek için bir mağaza seçin."
            : "Teslimat gününü ve saatini görmek için adresinizi girin."}
        </p>
      ) : !availability ? (
        <div aria-hidden className="mt-4 space-y-3">
          <div className="h-6 w-40 animate-pulse rounded-full bg-sand-light" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-[72px] w-16 animate-pulse rounded-lg bg-sand-light/70" />
            ))}
          </div>
        </div>
      ) : availability.reason === "PRODUCT_DISABLED_AT_BRANCH" ? (
        <div className="mt-3 rounded-md border border-sand bg-cream px-3 py-2.5">
          <p className="font-sans text-[13px] font-medium text-warm-brown">{reasonMessage(availability.reason)}</p>
          <Link href="/hizli-siparis" className="mt-1 inline-flex font-sans text-[12.5px] font-semibold text-burgundy hover:text-chocolate-light">
            Bu bölgede uygun ürünleri gör →
          </Link>
        </div>
      ) : !availability.earliestAvailableDate ? (
        <p className="mt-3 font-sans text-[13px] text-warm-brown">
          Önümüzdeki günlerde bu ürün için teslimat saati bulunmuyor. Lütfen şubemizle iletişime geçin.
        </p>
      ) : (
        <>
          {/* top label — same engine result as the cards, calendar and slots */}
          {topLabel && <DeliveryPill label={topLabel} className="mt-3" />}

          {/* day cards + calendar trigger */}
          <div className="relative mt-4">
            <div className="flex items-center justify-between gap-3">
              <p id="delivery-day-label" className="font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-burgundy/60">
                Teslimat günü
              </p>
              <button
                type="button"
                onClick={() => setCalendarOpen((v) => !v)}
                aria-expanded={calendarOpen}
                aria-haspopup="dialog"
                className="inline-flex items-center gap-1.5 rounded-md border border-sand px-2.5 py-1.5 font-sans text-[12.5px] font-semibold text-burgundy transition-colors hover:border-burgundy/40"
              >
                <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M7 3v3M17 3v3M4 9h16M5 5.5h14a1 1 0 011 1V19a1 1 0 01-1 1H5a1 1 0 01-1-1V6.5a1 1 0 011-1z" />
                </svg>
                Takvimden seç
              </button>
            </div>

            <div
              role="radiogroup"
              aria-labelledby="delivery-day-label"
              className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {cardDays.map((d) => {
                const on = d.date === selectedDate;
                const [, mm, dd] = d.date.split("-").map(Number);
                const rel = d.date === todayISO ? "Bugün" : d.date === tomorrowISO ? "Yarın" : "";
                return (
                  <button
                    key={d.date}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={!d.available}
                    aria-label={`${longDateTR(d.date)}${rel ? `, ${rel.toLowerCase()}` : ""}${d.available ? "" : ", seçilemez"}`}
                    onClick={() => pickDate(d.date)}
                    className={`flex min-h-[74px] w-[62px] shrink-0 flex-col sm:w-auto sm:min-w-[58px] sm:flex-1 items-center justify-center rounded-lg border px-1 py-2 font-sans transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/40 ${
                      on
                        ? "border-burgundy bg-burgundy text-cream-light"
                        : d.available
                          ? "border-sand bg-cream-light text-espresso hover:border-burgundy/45"
                          : "cursor-not-allowed border-sand-light bg-cream-light/60 text-taupe/45"
                    }`}
                  >
                    <span className={`text-[11px] font-medium uppercase tracking-[0.04em] ${on ? "text-cream-light/80" : ""}`}>
                      {WEEKDAYS_TR_SHORT[weekdayOfISO(d.date)]}
                    </span>
                    <span className="mt-0.5 text-[17px] font-semibold leading-none">{dd}</span>
                    <span className={`mt-0.5 text-[11px] ${on ? "text-cream-light/80" : "text-taupe"}`}>{MONTHS_TR_SHORT[mm - 1]}</span>
                    <span className={`mt-0.5 h-3.5 text-[10.5px] font-semibold ${on ? "text-cream-light" : "text-burgundy/75"}`}>{rel}</span>
                  </button>
                );
              })}
            </div>

            {selectedBeyondCards && selectedDate && (
              <p className="mt-2 inline-flex items-center gap-2 rounded-md border border-burgundy bg-burgundy/[0.05] px-2.5 py-1.5 font-sans text-[12.5px] font-semibold text-burgundy">
                Takvimden seçildi: {longDateTR(selectedDate)}
              </p>
            )}

            {calendarOpen && (
              <DeliveryCalendar
                todayISO={todayISO}
                dates={availability.dates}
                selected={selectedDate}
                onSelect={pickDate}
                onClose={closeCalendar}
              />
            )}
          </div>

          {/* one-hour slots */}
          <div className="mt-4">
            <p id="delivery-slot-label" className="font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-burgundy/60">
              Teslimat saati
            </p>
            {!current || loading ? (
              <div aria-hidden className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-md bg-sand-light/70" />
                ))}
              </div>
            ) : current.slots.length === 0 ? (
              <p className="mt-2 font-sans text-[12.5px] text-taupe">{reasonMessage(current.reason)}</p>
            ) : (
              <div role="radiogroup" aria-labelledby="delivery-slot-label" className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {current.slots.map((s) => {
                  const on = selectedSlotId === s.slotId && s.available;
                  return (
                    <button
                      key={s.slotId}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={!s.available}
                      title={s.available ? undefined : reasonMessage(s.reason)}
                      onClick={() => setSelectedSlotId(s.slotId)}
                      className={`h-10 rounded-md border px-1 font-sans text-[13px] font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/40 ${
                        on
                          ? "border-burgundy bg-burgundy text-cream-light"
                          : s.available
                            ? "border-sand bg-cream-light text-espresso hover:border-burgundy/45"
                            : "cursor-not-allowed border-sand-light text-taupe/45"
                      }`}
                    >
                      {compactSlot(s.label)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* summary */}
          {current && chosenSlot && (
            <p className="mt-4 rounded-md bg-cream px-3 py-2 font-sans text-[13.5px] font-semibold text-burgundy" aria-live="polite">
              {deliverySummary(current.requestedDate, chosenSlot.label)}
            </p>
          )}

          {availability.deliveryFee > 0 && (
            <p className="mt-3 font-sans text-[12px] text-taupe">Teslimat ücreti: ₺{availability.deliveryFee}</p>
          )}
          <SampleDataNote className="mt-2" />
        </>
      )}
    </div>
  );
}
