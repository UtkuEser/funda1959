"use client";

import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { removeItem, updateQuantity } from "@/lib/cart";
import { useCart } from "@/lib/use-cart";
import { hasMixedDelivery } from "@/lib/cart-utils";
import { CartItemRow } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { EmptyCart } from "./EmptyCart";

function Breadcrumb() {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 font-sans text-[12px] text-taupe">
      <Link href="/" className="hover:text-burgundy">
        Ana Sayfa
      </Link>
      <span>/</span>
      <span className="text-warm-brown">Sepet</span>
    </nav>
  );
}

export function CartPage() {
  const items = useCart();

  if (items.length === 0) {
    return (
      <Container className="pt-24 pb-20 md:pt-28">
        <Breadcrumb />
        <EmptyCart />
      </Container>
    );
  }

  const mixedDelivery = hasMixedDelivery(items);

  return (
    <Container className="pt-24 pb-16 md:pt-28 md:pb-20">
      <Breadcrumb />

      <h1 className="mt-5 font-serif text-[30px] md:text-[38px] font-semibold leading-[1.12] text-burgundy">
        Sepetim
      </h1>
      <p className="mt-2 font-sans text-[14px] text-warm-brown">
        Siparişinizi tamamlamadan önce ürünlerinizi ve seçimlerinizi kontrol edin.
      </p>

      {mixedDelivery && (
        <p className="mt-6 rounded-lg border border-sand bg-cream-light px-4 py-3 font-sans text-[13px] leading-relaxed text-warm-brown">
          Sepetinizde farklı teslimat seçimlerine sahip ürünler bulunuyor. Sipariş adımında
          teslimat planınızı kontrol edebilirsiniz.
        </p>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
        {/* Items */}
        <div>
          <div className="border-t border-sand-light">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onQuantity={(next) => updateQuantity(item.id, next)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </div>

          <div className="mt-8">
            <Link
              href="/lezzetlerimiz"
              className="font-sans text-[14px] font-semibold text-burgundy transition-colors hover:text-chocolate-light"
            >
              ← Alışverişe Devam Et
            </Link>
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="lg:sticky lg:top-24">
            <CartSummary items={items} />
          </div>
        </div>
      </div>
    </Container>
  );
}
