"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/use-cart";
import { useDelivery } from "@/lib/delivery/context";
import { DeliveryContextControl } from "@/components/delivery/DeliveryContextControl";
import { compactSlot, dateSlotText, dayWord } from "@/lib/delivery/labels";
import {
  revalidateCart,
  dropUnavailable,
  readCartFulfillment,
  stampCartFulfillment,
  type CartRevalidation,
} from "@/lib/cart-fulfillment";

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
      // the date/slot chosen on the product page still works -> keep it (only the branch may change);
      // otherwise move the lines to the earliest slot every item can share
      if (r.availability.available && chosen.date && chosen.slotLabel) {
        stampCartFulfillment({ branchId: r.availability.branchId, deliveryType: context.fulfillmentType, date: chosen.date, slotLabel: chosen.slotLabel });
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

      {result?.status === "valid" && kept && (
        <p className="font-sans text-[12.5px] text-warm-brown">
          Teslimat seçiminiz uygun:{" "}
          <span className="font-semibold text-burgundy">{dateSlotText(kept.date, kept.slotLabel)}</span>
          {result.availability.branchName && <> · {result.availability.branchName}</>}
        </p>
      )}

      {result?.status === "valid" && !kept && result.availability.earliestAvailableSlot && (
        <p className="font-sans text-[12.5px] text-warm-brown">
          {result.availability.branchName} şubesinden en erken{" "}
          <span className="font-semibold text-burgundy">
            {dayWord(result.availability.earliestAvailableSlot.date)} {compactSlot(result.availability.earliestAvailableSlot.label)}
          </span>{" "}
          teslim edilebilir.
        </p>
      )}
    </div>
  );
}
