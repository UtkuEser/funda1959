import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { OrdersList } from "@/components/account/OrdersList";
import { getAccountOrders } from "@/lib/account-service";

export const metadata: Metadata = {
  title: "Siparişlerim",
  robots: { index: false, follow: false },
};

export default function SiparislerimPage() {
  return (
    <AccountShell
      current="orders"
      title="Siparişlerim"
      subtitle="Geçmiş ve devam eden siparişlerinizi görüntüleyin."
    >
      <OrdersList orders={getAccountOrders()} />
    </AccountShell>
  );
}
