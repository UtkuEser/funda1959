"use client";

import Link from "next/link";
import type { CartItem } from "@/lib/cart";
import { hasPickup, subtotal } from "@/lib/cart-utils";
import { useDelivery } from "@/lib/delivery/context";
import { useDeliveryFee } from "@/lib/delivery/use-delivery-fee";
import { DeliveryMinimumNotice, useDeliveryMinimum } from "./DeliveryMinimumNotice";
import { OrderTotals } from "./OrderTotals";

export function CartSummary({ items }: { items: CartItem[] }) {
  const sub = subtotal(items);
  const minimum = useDeliveryMinimum(sub);
  const { context, isHydrated } = useDelivery();
  const fee = useDeliveryFee(context.fulfillmentType, context.district, context.neighborhood, isHydrated);

  return (
    <div className="rounded-lg border border-sand-light bg-cream-light p-5 md:p-6">
      <h2 className="font-serif text-[20px] font-semibold text-burgundy">Sipariş Özeti</h2>

      <div className="mt-5">
        <OrderTotals subtotal={sub} fee={fee} />
      </div>

      <DeliveryMinimumNotice shortfall={minimum.shortfall} onPickup={minimum.switchToPickup} />

      {minimum.blocked ? (
        <span
          aria-disabled
          className="mt-5 flex h-12 w-full cursor-not-allowed items-center justify-center rounded-md bg-burgundy/40 font-sans text-[15px] font-semibold text-cream-light"
        >
          Siparişi Tamamla
        </span>
      ) : (
        <Link
          href="/checkout"
          className="mt-5 flex h-12 w-full items-center justify-center rounded-md bg-burgundy font-sans text-[15px] font-semibold text-cream-light transition-colors hover:bg-chocolate-light"
        >
          Siparişi Tamamla
        </Link>
      )}

      <p className="mt-4 font-sans text-[12px] leading-relaxed text-taupe">
        Teslimat ücreti seçili adresin bölgesine göredir; ödeme adımında yeniden doğrulanır.
      </p>
      {hasPickup(items) && (
        <p className="mt-1 font-sans text-[12px] text-taupe">
          Sepetinizde mağazadan teslim seçili ürün bulunuyor.
        </p>
      )}

      <div className="mt-5 space-y-1 border-t border-sand-light pt-4 font-sans text-[12px] leading-relaxed text-taupe">
        <p>Günlük üretim</p>
        <p>Özenli paketleme</p>
        <p>Teslimat seçiminizi bir sonraki adımda tamamlayabilirsiniz.</p>
      </div>
    </div>
  );
}
