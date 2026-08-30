import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { AddressesView } from "@/components/account/AddressesView";
import { getAccountAddresses } from "@/lib/account-service";

export const metadata: Metadata = {
  title: "Adreslerim",
  robots: { index: false, follow: false },
};

export default function AdreslerimPage() {
  return (
    <AccountShell
      current="addresses"
      title="Adreslerim"
      subtitle="Siparişlerinizde kullanmak için teslimat adreslerinizi yönetin."
    >
      <AddressesView initialAddresses={getAccountAddresses()} />
    </AccountShell>
  );
}
