import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountUnavailable } from "@/components/account/AccountUnavailable";
import { AddressesView } from "@/components/account/AddressesView";
import { requireMemberPage } from "@/lib/customer-auth/next";
import { getCustomerRepository } from "@/lib/customers/repository";

export const metadata: Metadata = {
  title: "Adreslerim",
  robots: { index: false, follow: false },
};

export default async function AdreslerimPage() {
  const member = await requireMemberPage("/hesabim/adreslerim");
  if (member.kind !== "member") return <AccountUnavailable current="addresses" title="Adreslerim" />;

  let addresses;
  try {
    addresses = await getCustomerRepository().listAddresses(member.userId);
  } catch (err) {
    console.error("[hesabim] addresses could not be read", { error: (err as Error).message });
    return <AccountUnavailable current="addresses" title="Adreslerim" />;
  }

  return (
    <AccountShell
      current="addresses"
      title="Adreslerim"
      subtitle="Siparişlerinizde kullanmak için teslimat adreslerinizi yönetin."
    >
      <AddressesView initialAddresses={addresses} />
    </AccountShell>
  );
}
