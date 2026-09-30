"use client";

import { useEffect, useRef } from "react";
import { useDelivery, type SelectorReason } from "@/lib/delivery/context";
import { AddressPicker } from "./AddressPicker";
import { SampleDataNote } from "./SampleDataNote";

const LEAD: Record<SelectorReason | "default", string> = {
  default: "Size uygun ürünleri ve teslimat seçeneklerini adresinize göre gösterelim.",
  cart: "Sepete eklemeden önce teslimat adresinizi seçin; uygunluğu adresinize göre kontrol edelim.",
  stock: "Teslimat tarihlerini görmek için adresinizi seçin.",
};

/**
 * Site-wide host for the address picker — opened via `openSelector()` from
 * the header's "Adres" item and from any page that needs a location first.
 */
export function AddressSelectorDialog() {
  const { selector, closeSelector, context, addressStatus } = useDelivery();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selector.open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("select")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSelector();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [selector.open, closeSelector]);

  if (!selector.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div aria-hidden className="absolute inset-0 bg-espresso/45 backdrop-blur-[2px]" onClick={closeSelector} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-selector-title"
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-cream-light px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 shadow-[0_-20px_60px_-20px_rgba(42,35,32,0.35)] sm:max-w-md sm:rounded-2xl sm:px-8 sm:pb-8 sm:pt-7"
      >
        <button
          type="button"
          onClick={closeSelector}
          aria-label="Kapat"
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-warm-brown transition-colors hover:bg-cream hover:text-burgundy"
        >
          <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeWidth={1.7} d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <h2 id="address-selector-title" className="pr-10 font-serif text-[25px] font-semibold leading-tight text-burgundy sm:text-[27px]">
          Adresinizi girin
        </h2>
        <p className="mt-2 font-sans text-[14px] leading-relaxed text-warm-brown">{LEAD[selector.reason ?? "default"]}</p>

        {addressStatus !== "none" && (
          <p className="mt-4 rounded-lg bg-cream px-3 py-2 font-sans text-[13px] text-warm-brown">
            Kayıtlı adresiniz: <span className="font-semibold text-espresso">{context.district}, {context.neighborhood}</span>
          </p>
        )}

        <div className="mt-5">
          <AddressPicker idPrefix="dialog" onDone={closeSelector} />
        </div>
        <p className="mt-3 font-sans text-[12.5px] leading-snug text-taupe">
          Açık adresinizi sipariş adımında alacağız.
        </p>

        <SampleDataNote className="mt-4" about="teslimat bölgeleri ve teslimat bilgileri" />
      </div>
    </div>
  );
}
