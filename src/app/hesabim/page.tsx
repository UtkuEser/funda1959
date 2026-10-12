import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountDashboard } from "@/components/account/AccountDashboard";
import { AccountUnavailable } from "@/components/account/AccountUnavailable";
import { requireMemberPage } from "@/lib/customer-auth/next";
import { getCustomerRepository } from "@/lib/customers/repository";

export const metadata: Metadata = {
  title: "Hesabım",
  robots: { index: false, follow: false },
};

export default async function HesabimPage() {
  const member = await requireMemberPage("/hesabim");
  if (member.kind !== "member") return <AccountUnavailable current="dashboard" title="Hesabım" />;

  const repo = getCustomerRepository();
  let data;
  try {
    const [addresses, orders] = await Promise.all([repo.listAddresses(member.userId), repo.listOrders(member.userId, 5)]);
    data = { profile: member.profile, addresses, orders };
  } catch (err) {
    console.error("[hesabim] account data could not be read", { error: (err as Error).message });
    return <AccountUnavailable current="dashboard" title="Hesabım" />;
  }

  return (
    <AccountShell current="dashboard" title="Hesabım" subtitle={`Hoş geldiniz, ${member.profile.fullName}.`}>
      <AccountDashboard data={data} />
    </AccountShell>
  );
}
