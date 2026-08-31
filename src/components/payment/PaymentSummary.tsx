import type { CartItem } from "@/lib/cart";
import { formatTL, quantityTotal, subtotal } from "@/lib/cart-utils";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="font-sans text-[14px] text-warm-brown">{label}</dt>
      <dd className="font-sans text-[14px] text-espresso">{value}</dd>
    </div>
  );
}

export function PaymentSummary({ items }: { items: CartItem[] }) {
  const sub = subtotal(items);
  const count = quantityTotal(items);

  return (
    <div className="rounded-lg border border-sand-light bg-cream-light p-5 md:p-6">
      <h2 className="font-serif text-[20px] font-semibold text-burgundy">Sipariş Özeti</h2>
      <p className="mt-1 font-sans text-[12px] text-taupe">{count} ürün</p>

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

      <dl className="space-y-3">
        <Row label="Ara Toplam" value={formatTL(sub)} />
        <Row
          label="Teslimat"
          value={<span className="text-[13px] text-taupe">Teslimat bölgesine göre hesaplanır</span>}
        />
        <Row label="İndirim" value="₺0" />
      </dl>

      <div className="my-4 border-t border-sand-light" />

      <div className="flex items-baseline justify-between">
        <span className="font-sans text-[15px] font-semibold text-espresso">Toplam</span>
        <span className="font-sans text-[19px] font-semibold text-burgundy">{formatTL(sub)}</span>
      </div>
    </div>
  );
}
