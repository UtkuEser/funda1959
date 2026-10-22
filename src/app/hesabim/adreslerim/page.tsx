import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountUnavailable } from "@/components/account/AccountUnavailable";
import { AddressesView } from "@/components/account/AddressesView";
import { requireMemberPageWith } from "@/lib/customer-auth/next";
import { getCustomerRepository } from "@/lib/customers/repository";

export const metadata: Metadata = {
  title: "Adreslerim",
  robots: { index: false, follow: false },
};

export default async function AdreslerimPage() {
  // the addresses are read together with the profile
  const [member, read] = await requireMemberPageWith("/hesabim/adreslerim", (userId) =>
    getCustomerRepository().listAddresses(userId),
  );
  if (member.kind !== "member" || !read) return <AccountUnavailable current="addresses" title="Adreslerim" />;
  if (!read.ok) {
    console.error("[hesabim] addresses could not be read", { error: (read.error as Error).message });
    return <AccountUnavailable current="addresses" title="Adreslerim" />;
  }
  const addresses = read.value;

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
