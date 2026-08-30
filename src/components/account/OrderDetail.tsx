import Link from "next/link";
import type { AccountOrder } from "@/lib/account-service";
import { formatCartDate, formatTL } from "@/lib/cart-utils";
import { StatusBadge } from "./StatusBadge";
import { OrderTimeline } from "./OrderTimeline";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-sand-light pt-6">
      <h2 className="font-sans text-[15px] font-semibold text-espresso">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={`font-sans text-[13.5px] ${strong ? "font-semibold text-espresso" : "text-warm-brown"}`}>
        {label}
      </span>
      <span className={`font-sans text-[13.5px] ${strong ? "font-semibold text-burgundy" : "text-espresso"}`}>
        {value}
      </span>
    </div>
  );
}

export function OrderDetail({ order }: { order: AccountOrder }) {
  const { address } = order;
  const addressExtra = [
    address?.building,
    address?.floor && `Kat ${address.floor}`,
    address?.apartment && `Daire ${address.apartment}`,
  ].filter(Boolean);

  return (
    <div>
      <Link
        href="/hesabim/siparislerim"
        className="font-sans text-[13px] font-semibold text-burgundy hover:text-chocolate-light"
      >
        ← Siparişlerim
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="font-sans text-[17px] font-semibold text-espresso">{order.orderNumber}</p>
        <StatusBadge status={order.status} />
      </div>
      <p className="mt-1 font-sans text-[13px] text-taupe">
        Sipariş tarihi: {formatCartDate(order.createdAt)}
      </p>

      <div className="mt-6 space-y-6">
        <Section title="Sipariş Durumu">
          <OrderTimeline status={order.status} deliveryType={order.deliveryType} />
        </Section>

        <Section title="Ürünler">
          <ul className="divide-y divide-sand-light">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="font-sans text-[14px] font-medium text-espresso">{item.productName}</p>
                  {item.variantLabel && (
                    <p className="font-sans text-[12.5px] text-warm-brown">{item.variantLabel}</p>
                  )}
                  {item.cakeMessage && (
                    <p className="font-sans text-[12.5px] text-warm-brown">
                      Pasta yazısı: &ldquo;{item.cakeMessage}&rdquo;
                    </p>
                  )}
                  {item.extras && item.extras.length > 0 && (
                    <p className="font-sans text-[12.5px] text-warm-brown">Ek: {item.extras.join(", ")}</p>
                  )}
                  {item.note && (
                    <p className="font-sans text-[12.5px] text-taupe">Not: {item.note}</p>
                  )}
                  <p className="mt-0.5 font-sans text-[12.5px] text-taupe">{item.quantity} adet</p>
                </div>
                <span className="shrink-0 font-sans text-[14px] font-semibold text-burgundy">
                  {formatTL(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Teslimat">
          <div className="font-sans text-[13.5px] leading-relaxed text-warm-brown">
            {order.deliveryType === "pickup" ? (
              <>
                <p className="font-medium text-espresso">Mağazadan Teslim</p>
                {order.branchName && <p>{order.branchName}</p>}
              </>
            ) : (
              <>
                <p className="font-medium text-espresso">Adrese Teslim</p>
                {address && (
                  <>
                    <p>
                      {address.district} / {address.neighborhood}
                    </p>
                    <p>{address.addressLine}</p>
                    {addressExtra.length > 0 && <p>{addressExtra.join(" · ")}</p>}
                    {address.note && <p className="text-taupe">{address.note}</p>}
                  </>
                )}
              </>
            )}
            <p className="mt-1">
              {formatCartDate(order.deliveryDate)}
              {order.deliveryTimeSlot ? ` · ${order.deliveryTimeSlot}` : ""}
            </p>
          </div>
        </Section>

        {order.orderNote && (
          <Section title="Sipariş Notu">
            <p className="font-sans text-[13.5px] leading-relaxed text-warm-brown">{order.orderNote}</p>
          </Section>
        )}

        <Section title="Ödeme Özeti">
          <div className="space-y-2">
            <SummaryRow label="Ara Toplam" value={formatTL(order.subtotal)} />
            <SummaryRow
              label="Teslimat"
              value={order.deliveryFee > 0 ? formatTL(order.deliveryFee) : "—"}
            />
            {order.discount > 0 && (
              <SummaryRow label="İndirim" value={`- ${formatTL(order.discount)}`} />
            )}
            <div className="border-t border-sand-light pt-2">
              <SummaryRow label="Toplam" value={formatTL(order.total)} strong />
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
