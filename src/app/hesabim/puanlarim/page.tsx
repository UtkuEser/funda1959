import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountUnavailable } from "@/components/account/AccountUnavailable";
import { PointsView } from "@/components/account/PointsView";
import { requireMemberPage } from "@/lib/customer-auth/next";
import { isFundaPointsActive, type FundaPointsSummary } from "@/lib/funda-points";
import { FundaPointsNotReadyError } from "@/lib/funda-points/store";
import { getMemberPointsSummary } from "@/lib/funda-points/service";

export const metadata: Metadata = {
  title: "Funda Puan",
  robots: { index: false, follow: false },
};

/** The member's own points only — the id comes from the verified session. */
export default async function PuanlarimPage() {
  const member = await requireMemberPage("/hesabim/puanlarim");
  if (member.kind !== "member") return <AccountUnavailable current="points" title="Funda Puan" />;

  let summary: FundaPointsSummary;
  try {
    summary = await getMemberPointsSummary(member.userId);
  } catch (err) {
    // tables not set up yet while the programme is off: nothing can have been earned
    if (err instanceof FundaPointsNotReadyError && !isFundaPointsActive()) {
      summary = { available: 0, debt: 0, lots: [], transactions: [] };
    } else {
      console.error("[hesabim] points could not be read", { error: (err as Error).message });
      return <AccountUnavailable current="points" title="Funda Puan" />;
    }
  }

  return (
    <AccountShell current="points" title="Funda Puan" subtitle="Puan bakiyeniz, son kullanma tarihleri ve hareketleriniz.">
      <PointsView summary={summary} active={isFundaPointsActive()} />
    </AccountShell>
  );
}
