"use client";

import { useDelivery } from "@/lib/delivery/context";
import { markCartForPickup } from "@/lib/cart-fulfillment";
import { formatTL } from "@/lib/cart-utils";
import { MIN_DELIVERY_ORDER_TL, deliveryMinimumShortfall } from "@/lib/order-rules";

/**
 * Delivery minimum in the cart and the quick-order summary (SUPABASE_PLAN.md,
 * D14): 500 TL on products − discount, delivery fee excluded, pickup exempt.
 * Below it the way to checkout is closed for delivery; switching to pickup
 * stays open. The server checks the same rule again (quote + order).
 */
export function useDeliveryMinimum(subtotal: number) {
  const { context, isHydrated, setFulfillmentType, openSelector } = useDelivery();
  // no discount logic exists yet (campaigns are content only); the server
  // applies the real discount when it checks the same rule
  const shortfall = isHydrated ? deliveryMinimumShortfall(context.fulfillmentType, subtotal, 0) : 0;
  const switchToPickup = () => {
    markCartForPickup();
    setFulfillmentType("pickup");
    if (!context.branchId) openSelector("cart");
  };
  return { shortfall, blocked: shortfall > 0, switchToPickup };
}

export function DeliveryMinimumNotice({ shortfall, onPickup }: { shortfall: number; onPickup: () => void }) {
  if (shortfall <= 0) return null;
  return (
    <div
      role="status"
      className="mt-4 rounded-md border border-burgundy/20 bg-burgundy/[0.04] px-3.5 py-3 font-sans text-[12.5px] leading-relaxed text-warm-brown"
    >
      <p>
        <span className="font-semibold text-burgundy">
          Adrese teslim için minimum sipariş tutarı {formatTL(MIN_DELIVERY_ORDER_TL)}.
        </span>{" "}
        Sepetinize {formatTL(shortfall)} daha ekleyin. Teslimat ücreti bu tutara dahil değildir.
      </p>
      <button
        type="button"
        onClick={onPickup}
        className="mt-2 font-semibold text-burgundy underline decoration-burgundy/40 underline-offset-4 transition-colors hover:text-chocolate-light"
      >
        Mağazadan teslim al (minimum tutar yok)
      </button>
    </div>
  );
}
