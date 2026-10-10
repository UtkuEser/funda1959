import type { CartItem } from "@/lib/cart";
import { formatTL, subtotal } from "@/lib/cart-utils";
import type { DeliveryFeeView } from "@/lib/delivery/use-delivery-fee";
import { OrderTotals } from "@/components/cart/OrderTotals";

export function CheckoutSummary({
  items,
  fee,
  submitting,
  submitError,
  onSubmit,
}: {
  items: CartItem[];
  /** the server's fee for the address / pickup chosen on this page */
  fee: DeliveryFeeView;
  submitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
}) {
  const sub = subtotal(items);
  const count = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="rounded-lg border border-sand-light bg-cream-light p-5 md:p-6">
      <h2 className="font-serif text-[20px] font-semibold text-burgundy">Sipariş Özeti</h2>
      <p className="mt-1 font-sans text-[12px] text-taupe">{count} ürün</p>

      {/* Compact product list */}
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-sans text-[13px] font-medium text-espresso">
                {item.productName}
              </p>
              {item.variantLabel && (
                <p className="font-sans text-[12px] text-taupe">{item.variantLabel}</p>
              )}
            </div>
            <span className="shrink-0 font-sans text-[13px] text-espresso">
              {item.quantity} × {formatTL(item.unitPrice)}
            </span>
          </li>
        ))}
      </ul>

      <div className="my-4 border-t border-sand-light" />

      <OrderTotals subtotal={sub} fee={fee} />

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        aria-busy={submitting}
        className="mt-5 h-12 w-full rounded-md bg-burgundy font-sans text-[15px] font-semibold text-cream-light transition-colors hover:bg-chocolate-light disabled:cursor-not-allowed disabled:bg-burgundy/45"
      >
        {submitting ? "Yönlendiriliyor…" : "Ödeme Adımına Geç"}
      </button>

      {submitError && (
        <p role="alert" className="mt-3 font-sans text-[13px] leading-relaxed text-chocolate-light">
          {submitError}
        </p>
      )}

      <p className="mt-4 font-sans text-[12px] leading-relaxed text-taupe">
        Günlük üretim · özenli paketleme
      </p>
    </div>
  );
}
