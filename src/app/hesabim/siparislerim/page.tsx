import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountUnavailable } from "@/components/account/AccountUnavailable";
import { OrdersList } from "@/components/account/OrdersList";
import { requireMemberPageWith } from "@/lib/customer-auth/next";
import { getCustomerRepository } from "@/lib/customers/repository";

export const metadata: Metadata = {
  title: "Siparişlerim",
  robots: { index: false, follow: false },
};

/** Only orders placed while signed in to this account (D24); guest orders are never linked (D25). */
export default async function SiparislerimPage() {
  // the orders are read together with the profile
  const [member, read] = await requireMemberPageWith("/hesabim/siparislerim", (userId) =>
    getCustomerRepository().listOrders(userId),
  );
  if (member.kind !== "member" || !read) return <AccountUnavailable current="orders" title="Siparişlerim" />;
  if (!read.ok) {
    console.error("[hesabim] orders could not be read", { error: (read.error as Error).message });
    return <AccountUnavailable current="orders" title="Siparişlerim" />;
  }
  const orders = read.value;

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
