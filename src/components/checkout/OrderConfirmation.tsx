import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { formatCartDate, formatTL } from "@/lib/cart-utils";
import type { OrderSummary } from "@/lib/order";

export function OrderConfirmation({ order }: { order: OrderSummary | null }) {
  if (!order) {
    return (
      <Container size="narrow" className="pt-28 pb-24 md:pt-32 text-center">
        <h1 className="font-serif text-[28px] md:text-[32px] font-semibold text-burgundy">
          Sipariş bilgisi bulunamadı.
        </h1>
        <p className="mx-auto mt-3 max-w-md font-sans text-[15px] leading-relaxed text-warm-brown">
          Bu sayfa yalnızca tamamlanmış bir siparişten sonra görüntülenebilir.
        </p>
        <Link
          href="/lezzetlerimiz"
          className="mt-7 inline-flex rounded-md bg-burgundy px-6 py-3 font-sans text-[14px] font-semibold text-cream-light hover:bg-chocolate-light"
        >
          Lezzetleri Keşfet
        </Link>
      </Container>
    );
  }

  const trackHref = `/siparis-takip?order=${encodeURIComponent(order.orderNumber)}`;

  return (
    <Container size="narrow" className="pt-24 pb-20 md:pt-28">
      <h1 className="font-serif text-[30px] md:text-[38px] font-semibold leading-[1.12] text-burgundy">
        Siparişiniz alındı.
      </h1>
      <p className="mt-3 max-w-lg font-sans text-[15px] leading-relaxed text-warm-brown">
        Teşekkür ederiz. Siparişinizi hazırlamaya başlamak için gerekli bilgiler tarafımıza ulaştı.
      </p>

      <div className="mt-8 space-y-5 rounded-lg border border-sand-light bg-cream-light p-5 md:p-6">
        <Row label="Sipariş No" value={<span className="font-semibold text-espresso">{order.orderNumber}</span>} />
        <Row
          label="Teslimat"
          value={
            <>
              {formatCartDate(order.deliveryDate)}
              {order.deliveryTimeSlot ? ` · ${order.deliveryTimeSlot}` : ""}
            </>
          }
        />
        {order.deliveryType === "pickup" ? (
          <Row label="Mağaza" value={order.branchName ?? "—"} />
        ) : (
          <Row label="Teslimat Türü" value="Adrese Teslim" />
        )}
        <div className="border-t border-sand-light pt-4">
          <Row
            label="Toplam"
            value={<span className="font-semibold text-burgundy">{formatTL(order.total)}</span>}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href={trackHref}
          className="inline-flex h-12 items-center justify-center rounded-md bg-burgundy px-7 font-sans text-[15px] font-semibold text-cream-light transition-colors hover:bg-chocolate-light"
        >
          Siparişimi Takip Et
        </Link>
        <Link
          href="/lezzetlerimiz"
          className="inline-flex items-center justify-center font-sans text-[14px] font-semibold text-burgundy transition-colors hover:text-chocolate-light"
        >
          Alışverişe Dön
        </Link>
      </div>
    </Container>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <span className="font-sans text-[13px] font-semibold text-espresso">{label}</span>
      <span className="font-sans text-[14px] text-warm-brown">{value}</span>
    </div>
  );
}
