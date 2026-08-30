import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountDashboard } from "@/components/account/AccountDashboard";

export const metadata: Metadata = {
  title: "Hesabım",
  robots: { index: false, follow: false },
};

export default function HesabimPage() {
  return (
    <AccountShell current="dashboard" title="Hesabım" subtitle="Hoş geldiniz.">
      <AccountDashboard />
    </AccountShell>
  );
}
