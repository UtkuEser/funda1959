import { formatTL } from "@/lib/cart-utils";
import { roundMoney } from "@/lib/order-rules";
import { feeAmount, type DeliveryFeeView } from "@/lib/delivery/use-delivery-fee";

/**
 * Products, delivery fee and total as separate lines — the cart, quick order
 * and checkout use the fee the server gave for the selected address
 * (`useDeliveryFee`), the same rows the payment step shows from its quote.
 * Without a known fee there is no total: "—" plus the reason.
 */
function Row({ label, value, compact }: { label: string; value: React.ReactNode; compact: boolean }) {
  const text = compact ? "text-[13px]" : "text-[14px]";
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={`font-sans ${text} text-warm-brown`}>{label}</dt>
      <dd className={`font-sans ${text} text-espresso`}>{value}</dd>
    </div>
  );
}

export function OrderTotals({ subtotal, fee, compact = false }: { subtotal: number; fee: DeliveryFeeView; compact?: boolean }) {
  const amount = feeAmount(fee);
  const muted = (t: string) => <span className="text-[13px] text-taupe">{t}</span>;
  const feeValue =
    fee.status === "pickup"
      ? "₺0 · Mağazadan teslim"
      : fee.status === "ready"
        ? fee.state === "free"
          ? "Ücretsiz"
          : formatTL(fee.fee)
        : fee.status === "loading"
          ? muted("Hesaplanıyor…")
          : fee.status === "no_address"
            ? muted("Adres seçilince hesaplanır")
            : muted(fee.reason === "DELIVERY_FEE_NOT_SET" ? "Belirlenmedi" : "—");

  return (
    <div data-order-totals>
      <dl className={compact ? "space-y-2" : "space-y-3"}>
        <Row compact={compact} label="Ürün Toplamı" value={formatTL(subtotal)} />
        <Row compact={compact} label="Teslimat Ücreti" value={feeValue} />
        <Row compact={compact} label="İndirim" value="₺0" />
      </dl>

      <div className={`${compact ? "my-3" : "my-4"} border-t border-sand-light`} />

      <div className="flex items-baseline justify-between">
        <span className={`font-sans ${compact ? "text-[14px]" : "text-[15px]"} font-semibold text-espresso`}>Toplam</span>
        <span className={`font-sans ${compact ? "text-[17px]" : "text-[19px]"} font-semibold text-burgundy`}>
          {amount === null ? muted(fee.status === "loading" ? "Hesaplanıyor…" : "—") : formatTL(roundMoney(subtotal + amount))}
        </span>
      </div>

      {fee.status === "refused" && (
        <p role="alert" className="mt-3 font-sans text-[12.5px] leading-relaxed text-chocolate-light">
          {fee.message}
        </p>
      )}
      {fee.status === "no_address" && (
        <p className="mt-3 font-sans text-[12px] leading-relaxed text-taupe">
          Teslimat ücreti ve toplam, teslimat adresinizi seçtiğinizde gösterilir.
        </p>
      )}
    </div>
  );
}
