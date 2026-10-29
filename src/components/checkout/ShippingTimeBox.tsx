import Link from "next/link";
import { ShippingTimeCard } from "@/components/delivery/ShippingTimeCard";
import type { ShippingTime } from "./CheckoutPage";

/**
 * "Gönderim Zamanı" at the top of checkout: the time the whole order goes
 * out — the latest date and window chosen for the cart's products. Shown,
 * not chosen, here; a time that doesn't work is changed in the cart.
 */
export function ShippingTimeBox({ value }: { value: ShippingTime }) {
  const blocked = value.status === "blocked";
  return (
    <ShippingTimeCard id="shipTime" focusable date={value.date} slotLabel={value.slotLabel} problem={blocked}>
      <div aria-live="polite">
        {blocked ? (
          <>
            <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-chocolate-light">{value.problem}</p>
            {value.editInCart && (
              <Link
                href="/sepet"
                className="mt-2 inline-block font-sans text-[13px] font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-2 hover:decoration-burgundy"
              >
                Sepette teslimat zamanlarını düzenle
              </Link>
            )}
          </>
        ) : (
          value.date && (
            <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-warm-brown">
              {value.mixed
                ? "Sepetinizde farklı teslimat zamanları bulunan ürünler var. Tüm ürünleriniz en geç seçilen zamana göre birlikte gönderilecektir."
                : "Tüm ürünleriniz birlikte gönderilecektir."}
            </p>
          )
        )}
      </div>
    </ShippingTimeCard>
  );
}
