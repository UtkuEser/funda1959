import Link from "next/link";
import type { CartItem } from "@/lib/cart";
import { formatTL, hasPickup, subtotal } from "@/lib/cart-utils";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="font-sans text-[14px] text-warm-brown">{label}</dt>
      <dd className="font-sans text-[14px] text-espresso">{value}</dd>
    </div>
  );
}

export function CartSummary({ items }: { items: CartItem[] }) {
  const sub = subtotal(items);

  return (
    <div className="rounded-lg border border-sand-light bg-cream-light p-5 md:p-6">
      <h2 className="font-serif text-[20px] font-semibold text-burgundy">Sipariş Özeti</h2>

      <dl className="mt-5 space-y-3">
        <Row label="Ara Toplam" value={formatTL(sub)} />
        <Row
          label="Teslimat"
          value={<span className="text-[13px] text-taupe">Checkout&apos;ta hesaplanacak</span>}
        />
        <Row label="İndirim" value="₺0" />
      </dl>

      <div className="my-4 border-t border-sand-light" />

      <div className="flex items-baseline justify-between">
        <span className="font-sans text-[15px] font-semibold text-espresso">Toplam</span>
        <span className="font-sans text-[19px] font-semibold text-burgundy">{formatTL(sub)}</span>
      </div>

      <Link
        href="/checkout"
        className="mt-5 flex h-12 w-full items-center justify-center rounded-md bg-burgundy font-sans text-[15px] font-semibold text-cream-light transition-colors hover:bg-chocolate-light"
      >
        Siparişi Tamamla
      </Link>

      <p className="mt-4 font-sans text-[12px] leading-relaxed text-taupe">
        Teslimat ücreti adres ve teslimat seçiminize göre bir sonraki adımda hesaplanacaktır.
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
