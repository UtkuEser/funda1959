import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountDashboard } from "@/components/account/AccountDashboard";
import { AccountUnavailable } from "@/components/account/AccountUnavailable";
import { requireMemberPageWith } from "@/lib/customer-auth/next";
import { getCustomerRepository } from "@/lib/customers/repository";

export const metadata: Metadata = {
  title: "Hesabım",
  robots: { index: false, follow: false },
};

export default async function HesabimPage() {
  const repo = getCustomerRepository();
  // addresses and recent orders are read together with the profile
  const [member, read] = await requireMemberPageWith("/hesabim", (userId) =>
    Promise.all([repo.listAddresses(userId), repo.listOrders(userId, 5)]),
  );
  if (member.kind !== "member" || !read) return <AccountUnavailable current="dashboard" title="Hesabım" />;
  if (!read.ok) {
    console.error("[hesabim] account data could not be read", { error: (read.error as Error).message });
    return <AccountUnavailable current="dashboard" title="Hesabım" />;
  }
  const [addresses, orders] = read.value;
  const data = { profile: member.profile, addresses, orders };

  return (
    <AccountShell current="dashboard" title="Hesabım" subtitle={`Hoş geldiniz, ${member.profile.fullName}.`}>
      <AccountDashboard data={data} />
    </AccountShell>
  );
}
