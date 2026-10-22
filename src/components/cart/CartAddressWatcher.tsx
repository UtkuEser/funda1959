"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/use-cart";
import { useDelivery } from "@/lib/delivery/context";
import { revalidateCart } from "@/lib/cart-fulfillment";

/** these pages check the cart against the address themselves (banner / checkout notice) */
const SELF_CHECKING = ["/sepet", "/checkout", "/hizli-siparis-odeme", "/admin", "/merkez-giris"];

/**
 * When the serving branch changes on any other page — a new address, or
 * Merkez moved the address to another branch (D49) — and the cart has
 * items, the cart is checked for the new branch and the customer is told
 * what changed: no delivery to the address, the products not available
 * there, or the branch that now prepares the order. Nothing is removed here;
 * the cart page offers that.
 */
export function CartAddressWatcher() {
  const items = useCart();
  const pathname = usePathname() ?? "";
  const { context, addressStatus, branchChangeToken, isHydrated } = useDelivery();
  const [notice, setNotice] = useState<string | null>(null);
  const seen = useRef<number | null>(null);
  const latest = useRef({ items, context, addressStatus, pathname });
  useEffect(() => {
    latest.current = { items, context, addressStatus, pathname };
  });

  useEffect(() => {
    if (!isHydrated) return;
    if (seen.current === null) {
      seen.current = branchChangeToken; // the stored choice on load is not a change
      return;
    }
    if (seen.current === branchChangeToken) return;
    seen.current = branchChangeToken;
    const { items: cart, context: ctx, addressStatus: status, pathname: path } = latest.current;
    if (cart.length === 0 || SELF_CHECKING.some((p) => path.startsWith(p))) return;

    if (ctx.fulfillmentType === "delivery" && status === "unserved") {
      setNotice("Seçtiğiniz adrese teslimat yapamıyoruz; sepetinizdeki ürünler bu adrese gönderilemez. Mağazadan teslim alabilir veya başka bir adres seçebilirsiniz.");
      return;
    }
    if (!ctx.branchId) return;
    let cancelled = false;
    revalidateCart(ctx, cart).then((r) => {
      if (cancelled) return;
      setNotice(r.status === "valid" ? null : r.message);
    });
    return () => {
      cancelled = true;
    };
  }, [branchChangeToken, isHydrated]);

  if (!notice) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto flex w-full max-w-xl items-start gap-3 rounded-xl border border-burgundy/20 bg-cream-light px-4 py-3 shadow-[0_12px_40px_-12px_rgba(42,35,32,0.35)]"
      >
        <p className="min-w-0 flex-1 font-sans text-[13.5px] leading-relaxed text-warm-brown">
          {notice}{" "}
          <Link
            href="/sepet"
            onClick={() => setNotice(null)}
            className="font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-2 hover:decoration-burgundy"
          >
            Sepete git
          </Link>
        </p>
        <button
          type="button"
          onClick={() => setNotice(null)}
          aria-label="Bildirimi kapat"
          className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-warm-brown transition-colors hover:bg-cream hover:text-burgundy"
        >
          <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeWidth={1.8} d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
