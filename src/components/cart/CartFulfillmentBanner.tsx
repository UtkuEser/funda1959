"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/use-cart";
import { useDelivery } from "@/lib/delivery/context";
import { DeliveryContextControl } from "@/components/delivery/DeliveryContextControl";
import { compactSlot, dayWord } from "@/lib/delivery/labels";
import { longDateTR } from "@/lib/time/istanbul";
import {
  revalidateCart,
  dropUnavailable,
  keepCartFulfillment,
  readCartFulfillment,
  stampCartFulfillment,
  type CartRevalidation,
} from "@/lib/cart-fulfillment";

/**
 * The cart's confirmed shipping time — a quiet two-line note (the problems
 * keep their own, louder notices): the date + window, the preparing branch.
 */
function CartShippingTime({
  label,
  date,
  slotLabel,
  branchName,
}: {
  label: string;
  date: string;
  slotLabel: string;
  branchName: string | null;
}) {
  return (
    <div role="status" className="flex items-start gap-2.5 rounded-lg border border-sand-light px-3.5 py-3 sm:px-4">
      <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.4} className="mt-[3px] h-4 w-4 shrink-0 text-burgundy/70">
        <circle cx="10" cy="10" r="7.5" />
        <path d="M10 6.25V10l2.5 1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="min-w-0 font-sans">
        <p className="text-[16px] leading-snug text-espresso">
          {label}:{" "}
          <span className="font-semibold text-burgundy">
            <span className="whitespace-nowrap">{longDateTR(date)}</span> ·{" "}
            <span className="whitespace-nowrap tabular-nums">{compactSlot(slotLabel)}</span>
          </span>
        </p>
        {branchName && <p className="mt-0.5 text-[13.5px] leading-snug text-warm-brown">Hazırlayan şube: {branchName}</p>}
      </div>
    </div>
  );
}

/**
 * Re-checks the whole cart against the session delivery context whenever the
 * resolved branch changes (section 24/25). Surfaces VALID / UPDATED /
 * UNAVAILABLE and lets the customer drop the items that no longer fit.
 */
export function CartFulfillmentBanner() {
  const items = useCart();
  const { context, isResolved, branchChangeToken } = useDelivery();
  const [result, setResult] = useState<CartRevalidation | null>(null);
  // the date/slot the customer chose that passed revalidation (null -> show the earliest)
  const [kept, setKept] = useState<{ date: string; slotLabel: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!isResolved || items.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResult(null);
      setKept(null);
      return;
    }
    const chosen = readCartFulfillment();
    revalidateCart(context).then((r) => {
      if (cancelled) return;
      setResult(r);
      setKept(null);
      if (r.status === "unavailable" || !r.availability.branchId) return;
      // the latest date/slot chosen on the product pages (the order's shipping time) still works ->
      // keep every line's choice (only the branch may change); a past date is not kept (the engine
      // answers for today then); otherwise move the lines to the earliest slot every item can share
      if (r.availability.available && chosen.date && chosen.slotLabel && r.availability.requestedDate === chosen.date) {
        keepCartFulfillment({ branchId: r.availability.branchId, deliveryType: context.fulfillmentType, date: chosen.date, slotLabel: chosen.slotLabel });
        setKept({ date: chosen.date, slotLabel: chosen.slotLabel });
      } else if (r.availability.earliestAvailableSlot) {
        stampCartFulfillment({
          branchId: r.availability.branchId,
          deliveryType: context.fulfillmentType,
          date: r.availability.earliestAvailableSlot.date,
          slotLabel: r.availability.earliestAvailableSlot.label,
        });
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResolved, branchChangeToken, items.length]);

  return (
    <div className="mt-6 space-y-3">
      <DeliveryContextControl />

      {result?.status === "updated" && result.message && (
        <div className="rounded-lg border border-burgundy/15 bg-burgundy/[0.03] px-4 py-3 font-sans text-[13px] leading-relaxed text-warm-brown">
          {result.message}
          {result.availability.earliestAvailableSlot && (
            <>
              {" "}
              En erken ortak teslimat:{" "}
              <span className="font-semibold text-burgundy">
                {dayWord(result.availability.earliestAvailableSlot.date)} {compactSlot(result.availability.earliestAvailableSlot.label)}
              </span>
              .
            </>
          )}
        </div>
      )}

      {result?.status === "unavailable" && (
        <div className="rounded-lg border border-chocolate-light/30 bg-chocolate-light/[0.05] px-4 py-3">
          <p className="font-sans text-[13px] leading-relaxed text-chocolate-light">
            {result.message}
          </p>
          {result.unavailableItemIds.length > 0 && (
            <button
              type="button"
              onClick={() => dropUnavailable(result.unavailableItemIds)}
              className="mt-2 font-sans text-[12.5px] font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-2 hover:decoration-burgundy"
            >
              Uygun olmayan ürünleri sepetten çıkar
            </button>
          )}
        </div>
      )}

      {/* only a time the server confirmed for this cart reads as fine; "updated" / "unavailable" keep their notices above */}
      {result?.status === "valid" && kept && (
        <CartShippingTime label="Gönderim zamanı" date={kept.date} slotLabel={kept.slotLabel} branchName={result.availability.branchName} />
      )}

      {result?.status === "valid" && !kept && result.availability.earliestAvailableSlot && (
        <CartShippingTime
          label="En erken gönderim"
          date={result.availability.earliestAvailableSlot.date}
          slotLabel={result.availability.earliestAvailableSlot.label}
          branchName={result.availability.branchName}
        />
      )}
    </div>
  );
}
