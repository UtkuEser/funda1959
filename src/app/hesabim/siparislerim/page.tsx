import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountUnavailable } from "@/components/account/AccountUnavailable";
import { OrdersList } from "@/components/account/OrdersList";
import { requireMemberPage } from "@/lib/customer-auth/next";
import { getCustomerRepository } from "@/lib/customers/repository";

export const metadata: Metadata = {
  title: "Siparişlerim",
  robots: { index: false, follow: false },
};

/** Only orders placed while signed in to this account (D24); guest orders are never linked (D25). */
export default async function SiparislerimPage() {
  const member = await requireMemberPage("/hesabim/siparislerim");
  if (member.kind !== "member") return <AccountUnavailable current="orders" title="Siparişlerim" />;

  let orders;
  try {
    orders = await getCustomerRepository().listOrders(member.userId);
  } catch (err) {
    console.error("[hesabim] orders could not be read", { error: (err as Error).message });
    return <AccountUnavailable current="orders" title="Siparişlerim" />;
  }

  return (
    <AccountShell
      current="orders"
      title="Siparişlerim"
      subtitle="Bu hesapla giriş yapmışken verdiğiniz siparişler."
    >
      <OrdersList orders={orders} />
    </AccountShell>
  );
}
