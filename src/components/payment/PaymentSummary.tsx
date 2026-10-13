import type { CartItem } from "@/lib/cart";
import type { OrderQuote } from "@/lib/order";
import { formatTL } from "@/lib/cart-utils";

/**
 * Where the figures come from: the server's quote (POST /api/orders/quote,
 * the same code that prices the order) — never the browser's own sums.
 */
export type QuoteState =
  | { status: "loading" }
  | { status: "ready"; quote: OrderQuote }
  | { status: "error"; error: string }
  /** no delivery details from the checkout step yet */
  | { status: "unavailable" };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="font-sans text-[14px] text-warm-brown">{label}</dt>
      <dd className="font-sans text-[14px] text-espresso">{value}</dd>
    </div>
  );
}

export function PaymentSummary({ items, quote }: { items: CartItem[]; quote: QuoteState }) {
  const q = quote.status === "ready" ? quote.quote : null;
  // the order's own lines once priced; the cart's until then
  const lines = q
    ? q.lines.map((l, i) => ({ key: `q${i}`, name: l.productName, variant: l.variantLabel, quantity: l.quantity, unitPrice: l.unitPrice }))
    : items.map((i) => ({ key: i.id, name: i.productName, variant: i.variantLabel, quantity: i.quantity, unitPrice: i.unitPrice }));
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);
  const pending = <span className="text-[13px] text-taupe">{quote.status === "loading" ? "Hesaplanıyor…" : "—"}</span>;

  return (
    <div className="rounded-lg border border-sand-light bg-cream-light p-5 md:p-6">
      <h2 className="font-serif text-[20px] font-semibold text-burgundy">Sipariş Özeti</h2>
      <p className="mt-1 font-sans text-[12px] text-taupe">{count} ürün</p>

      <ul className="mt-4 space-y-2.5">
        {lines.map((line) => (
          <li key={line.key} className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-sans text-[13px] font-medium text-espresso">
                {line.name}
              </p>
              {line.variant && (
                <p className="font-sans text-[12px] text-taupe">{line.variant}</p>
              )}
            </div>
            <span className="shrink-0 font-sans text-[13px] text-espresso">
              {line.quantity} × {formatTL(line.unitPrice)}
            </span>
          </li>
        ))}
      </ul>

      <div className="my-4 border-t border-sand-light" />

      <dl className="space-y-3">
        <Row label="Ürün Toplamı" value={q ? formatTL(q.subtotal) : pending} />
        <Row
          label="Teslimat Ücreti"
          value={
            q
              ? q.deliveryType === "pickup"
                ? "₺0 · Mağazadan teslim"
                : q.deliveryFeeState === "free"
                  ? "Ücretsiz"
                  : formatTL(q.deliveryFee)
              : pending
          }
        />
        <Row label="İndirim" value={q ? formatTL(q.discount) : pending} />
        {q && q.pointsRedeemed > 0 && <Row label="Funda Puan" value={`− ${formatTL(q.pointsRedeemed)}`} />}
      </dl>

      <div className="my-4 border-t border-sand-light" />

      <div className="flex items-baseline justify-between">
        <span className="font-sans text-[15px] font-semibold text-espresso">Toplam</span>
        <span className="font-sans text-[19px] font-semibold text-burgundy">{q ? formatTL(q.total) : pending}</span>
      </div>

      {quote.status === "error" && (
        <p role="alert" className="mt-3 font-sans text-[12.5px] leading-relaxed text-chocolate-light">
          {quote.error}
        </p>
      )}
      {quote.status === "unavailable" && (
        <p className="mt-3 font-sans text-[12.5px] leading-relaxed text-taupe">
          Tutar, teslimat bilgileri girildikten sonra hesaplanır.
        </p>
      )}
    </div>
  );
}
