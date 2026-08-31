"use client";

import Link from "next/link";
import { useCart } from "@/lib/use-cart";
import { formatTL, itemTotal, quantityTotal, subtotal } from "@/lib/cart-utils";

export function QuickOrderCartSummary() {
  const items = useCart();
  const sub = subtotal(items);
  const count = quantityTotal(items);
  const empty = items.length === 0;

  return (
    <div className="rounded-lg border border-sand-light bg-cream-light p-5">
      <h2 className="font-serif text-[18px] font-semibold text-burgundy">Sepetim</h2>

      {empty ? (
        <div className="mt-3">
          <p className="font-sans text-[13.5px] text-warm-brown">Sepetiniz henüz boş.</p>
          <p className="mt-1 font-sans text-[12.5px] leading-relaxed text-taupe">
            Ürünleri seçtikçe burada görebilirsiniz.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-1 font-sans text-[12px] text-taupe">{count} ürün</p>
          <ul className="mt-3 space-y-2.5">
            {items.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate font-sans text-[13px] text-espresso">
                  {item.productName}
                  <span className="text-taupe"> × {item.quantity}</span>
                </span>
                <span className="shrink-0 font-sans text-[13px] text-espresso">
                  {formatTL(itemTotal(item))}
                </span>
              </li>
            ))}
          </ul>

          <div className="my-4 border-t border-sand-light" />

          <div className="flex items-baseline justify-between font-sans">
            <span className="text-[13px] text-warm-brown">Ara Toplam</span>
            <span className="text-[13px] text-espresso">{formatTL(sub)}</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between font-sans">
            <span className="text-[14px] font-semibold text-espresso">Toplam</span>
            <span className="text-[17px] font-semibold text-burgundy">{formatTL(sub)}</span>
          </div>
        </>
      )}

      <div className="mt-5 space-y-2.5">
        {empty ? (
          <span
            aria-disabled
            className="flex h-11 w-full items-center justify-center rounded-md bg-burgundy/40 font-sans text-[14px] font-semibold text-cream-light"
          >
            Siparişi Tamamla
          </span>
        ) : (
          <Link
            href="/checkout"
            className="flex h-11 w-full items-center justify-center rounded-md bg-burgundy font-sans text-[14px] font-semibold text-cream-light transition-colors hover:bg-chocolate-light"
          >
            Siparişi Tamamla
          </Link>
        )}
        <Link
          href="/sepet"
          className="flex h-11 w-full items-center justify-center rounded-md border border-burgundy/25 font-sans text-[14px] font-semibold text-burgundy transition-colors hover:border-burgundy hover:bg-burgundy/[0.04]"
        >
          Sepete Git
        </Link>
      </div>

      <p className="mt-4 font-sans text-[11.5px] leading-relaxed text-taupe">
        Teslimat ve ödeme adımlarını bir sonraki ekranda tamamlarsınız.
      </p>
    </div>
  );
}
