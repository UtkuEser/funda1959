import type { Metadata } from "next";
import Link from "next/link";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountUnavailable } from "@/components/account/AccountUnavailable";
import { OrderDetail } from "@/components/account/OrderDetail";
import { requireMemberPage } from "@/lib/customer-auth/next";
import { getCustomerRepository } from "@/lib/customers/repository";

export const metadata: Metadata = {
  title: "Sipariş Detayı",
  robots: { index: false, follow: false },
};

/** Another member's order number answers "not found" — never their data. */
export default async function SiparisDetayPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const number = decodeURIComponent(orderNumber);
  const member = await requireMemberPage(`/hesabim/siparislerim/${encodeURIComponent(number)}`);
  if (member.kind !== "member") return <AccountUnavailable current="orders" title="Sipariş Detayı" />;

  let order;
  try {
    order = /^FND-[0-9A-Z-]{6,24}$/.test(number) ? await getCustomerRepository().getOrder(member.userId, number) : null;
  } catch (err) {
    console.error("[hesabim] order could not be read", { error: (err as Error).message });
    return <AccountUnavailable current="orders" title="Sipariş Detayı" />;
  }

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
