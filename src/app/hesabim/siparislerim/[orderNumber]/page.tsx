import type { Metadata } from "next";
import Link from "next/link";
import { AccountShell } from "@/components/account/AccountShell";
import { OrderDetail } from "@/components/account/OrderDetail";
import { getAccountOrder } from "@/lib/account-service";

export const metadata: Metadata = {
  title: "Sipariş Detayı",
  robots: { index: false, follow: false },
};

export default async function SiparisDetayPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = getAccountOrder(decodeURIComponent(orderNumber));

  if (!order) {
    return (
      <AccountShell current="orders" title="Sipariş Bulunamadı">
        <div className="rounded-lg border border-sand-light p-6 md:p-10">
          <p className="font-sans text-[14px] leading-relaxed text-warm-brown">
            Bu sipariş numarasına ait bir kayıt bulunamadı.
          </p>
          <Link
            href="/hesabim/siparislerim"
            className="mt-4 inline-flex font-sans text-[13px] font-semibold text-burgundy hover:text-chocolate-light"
          >
            ← Siparişlerim
          </Link>
        </div>
      </AccountShell>
    );
  }

  return (
    <AccountShell current="orders" title="Sipariş Detayı">
      <OrderDetail order={order} />
    </AccountShell>
  );
}
