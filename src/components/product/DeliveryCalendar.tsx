"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DateAvailability } from "@/lib/availability";
import { addDaysISO, MONTHS_TR, weekdayOfISO, longDateTR } from "@/lib/time/istanbul";

const WEEK_HEAD = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const monthKey = (iso: string) => iso.slice(0, 7);
function shiftMonth(key: string, n: number): string {
  const [y, m] = key.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Compact month calendar for the delivery date. Every day's state comes from
 * the engine's `dates` (the same result as the date cards and the top label):
 * past days and days the engine can't serve are faded and disabled.
 * Desktop: a popover under its trigger. Phones: a bottom sheet.
 */
export function DeliveryCalendar({
  todayISO,
  dates,
  selected,
  onSelect,
  onClose,
}: {
  todayISO: string;
  dates: DateAvailability[];
  selected: string | null;
  onSelect: (iso: string) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const byDate = useMemo(() => new Map(dates.map((d) => [d.date, d])), [dates]);
  const lastISO = dates[dates.length - 1]?.date ?? todayISO;
  const [month, setMonth] = useState(monthKey(selected ?? todayISO));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPointer = (e: PointerEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    (panelRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]') ??
      panelRef.current?.querySelector<HTMLElement>("button:not([disabled])[data-day]"))?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [onClose]);

  const first = `${month}-01`;
  const lead = (weekdayOfISO(first) + 6) % 7; // Monday-first offset
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => addDaysISO(first, i)),
  ];

  const canPrev = month > monthKey(todayISO);
  const canNext = month < monthKey(lastISO);

  return (
    <>
      <div aria-hidden className="fixed inset-0 z-40 bg-espresso/40 sm:hidden" />
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Teslimat tarihi seçin"
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border border-sand-light bg-cream-light px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-18px_48px_-20px_rgba(42,35,32,0.35)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[320px] sm:rounded-xl sm:px-4 sm:pb-4 sm:shadow-[0_18px_40px_-24px_rgba(42,35,32,0.45)]"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-sand sm:hidden" aria-hidden />
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonth((k) => shiftMonth(k, -1))}
            disabled={!canPrev}
            aria-label="Önceki ay"
            className="flex h-10 w-10 items-center justify-center rounded-full text-burgundy transition-colors hover:bg-cream disabled:opacity-30 sm:h-8 sm:w-8"
          >
            <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <p className="font-serif text-[17px] font-semibold text-burgundy" aria-live="polite">
            {MONTHS_TR[m - 1]} {y}
          </p>
          <button
            type="button"
            onClick={() => setMonth((k) => shiftMonth(k, 1))}
            disabled={!canNext}
            aria-label="Sonraki ay"
            className="flex h-10 w-10 items-center justify-center rounded-full text-burgundy transition-colors hover:bg-cream disabled:opacity-30 sm:h-8 sm:w-8"
          >
            <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center">
          {WEEK_HEAD.map((w) => (
            <span key={w} className="pb-1 font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-taupe">
              {w}
            </span>
          ))}
          {cells.map((iso, i) => {
            if (!iso) return <span key={`blank-${i}`} />;
            const info = byDate.get(iso);
            const selectable = Boolean(info?.available);
            const isSelected = iso === selected;
            const isToday = iso === todayISO;
            return (
              <button
                key={iso}
                type="button"
                data-day
                disabled={!selectable}
                aria-pressed={isSelected}
                aria-label={`${longDateTR(iso)}${selectable ? "" : ", seçilemez"}`}
                onClick={() => {
                  onSelect(iso);
                  onClose();
                }}
                className={`relative mx-auto flex h-11 w-11 items-center justify-center rounded-full font-sans text-[14px] transition-colors sm:h-9 sm:w-9 sm:text-[13.5px] ${
                  isSelected
                    ? "bg-burgundy font-semibold text-cream-light"
                    : selectable
                      ? "text-espresso hover:bg-burgundy/[0.07] focus-visible:bg-burgundy/[0.07]"
                      : "cursor-not-allowed text-taupe/40"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/40`}
              >
                {Number(iso.slice(8))}
                {isToday && !isSelected && (
                  <span aria-hidden className="absolute bottom-1 h-1 w-1 rounded-full bg-burgundy/60" />
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-3 font-sans text-[11.5px] text-taupe">Soluk günler bu ürün için seçilemez.</p>
      </div>
    </>
  );
}
