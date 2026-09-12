import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { getPublicOrder } from "@/lib/orders";
import { formatCartDate, formatTL } from "@/lib/cart-utils";

export const metadata: Metadata = {
  title: "Sipariş Takibi",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ order?: string }> };

export default async function OrderTrackingPage({ searchParams }: Props) {
  const { order: orderNumber } = await searchParams;
  const summary = orderNumber ? await getPublicOrder(orderNumber).catch(() => null) : null;

  return (
    <Container size="narrow" className="pt-28 pb-24 md:pt-32">
      <h1 className="font-serif text-[28px] md:text-[32px] font-semibold leading-[1.12] text-burgundy">
        Sipariş Takibi
      </h1>

      {!summary ? (
        <>
          <p className="mt-3 max-w-md font-sans text-[15px] leading-relaxed text-warm-brown">
            {orderNumber
              ? "Bu sipariş numarasına ait bir kayıt bulunamadı."
              : "Sipariş durumunuzu görmek için sipariş onay sayfanızdaki bağlantıyı kullanın."}
          </p>
          <Link
            href="/lezzetlerimiz"
            className="mt-7 inline-flex font-sans text-[14px] font-semibold text-burgundy transition-colors hover:text-chocolate-light"
          >
            ← Alışverişe Dön
          </Link>
        </>
      ) : (
        <>
          <p className="mt-2 font-sans text-[14px] text-warm-brown">
            Sipariş No: <span className="font-semibold text-espresso">{summary.orderNumber}</span>
          </p>

          <div className="mt-7 space-y-5 rounded-lg border border-sand-light bg-cream-light p-5 md:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="font-sans text-[13px] font-semibold text-espresso">Teslimat</span>
              <span className="font-sans text-[14px] text-warm-brown">
                {formatCartDate(summary.deliveryDate)}
                {summary.deliveryTimeSlot ? ` · ${summary.deliveryTimeSlot}` : ""}
              </span>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="font-sans text-[13px] font-semibold text-espresso">
                {summary.deliveryType === "pickup" ? "Mağaza" : "Teslimat Türü"}
              </span>
              <span className="font-sans text-[14px] text-warm-brown">
                {summary.deliveryType === "pickup"
                  ? summary.branchName ?? "—"
                  : `Adrese Teslim${summary.branchName ? ` · ${summary.branchName}` : ""}`}
              </span>
            </div>
            <div className="border-t border-sand-light pt-4">
              <div className="flex items-baseline justify-between">
                <span className="font-sans text-[13px] font-semibold text-espresso">Toplam</span>
                <span className="font-sans text-[14px] font-semibold text-burgundy">
                  {formatTL(summary.total)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="font-serif text-[18px] font-medium text-burgundy">Sipariş Durumu</h2>
            <div className="mt-4">
              <OrderTimeline status={summary.status} deliveryType={summary.deliveryType} />
            </div>
          </div>

          <Link
            href="/lezzetlerimiz"
            className="mt-9 inline-flex font-sans text-[14px] font-semibold text-burgundy transition-colors hover:text-chocolate-light"
          >
            ← Alışverişe Dön
          </Link>
        </>
      )}
    </Container>
  );
}
