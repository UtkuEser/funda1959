import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthNotice } from "@/components/auth/fields";
import { CompleteMembershipForm } from "@/components/auth/CompleteMembershipForm";
import { LogoutButton } from "@/components/account/LogoutButton";
import { safeNextPath } from "@/lib/auth";
import { isSignupOpen, membershipTerms } from "@/lib/customer-auth/config";
import { getMemberState } from "@/lib/customer-auth/next";

export const metadata: Metadata = {
  title: "Üyeliği Tamamla",
  robots: { index: false, follow: false },
};

/** A signed-in account without a profile completes it here before using Hesabım or member checkout. */
export default async function UyelikTamamlaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const next = safeNextPath((await searchParams).next);
  const state = await getMemberState();
  if (state.kind === "signed_out") redirect(`/giris?next=${encodeURIComponent(next)}`);
  if (state.kind === "member") redirect(next);

  return (
    <AuthShell title="Üyeliğinizi Tamamlayın" subtitle="Siparişlerinizde kullanılacak iletişim bilgilerinizi ekleyin.">
      {state.kind === "unavailable" ? (
        <AuthNotice>Üyelik servisi şu an kullanılamıyor. Siparişinizi üye olmadan verebilirsiniz.</AuthNotice>
      ) : !isSignupOpen() ? (
        <div className="space-y-4">
          <AuthNotice>Üyelik henüz açılmadı. Siparişinizi üye olmadan verebilirsiniz.</AuthNotice>
          <LogoutButton className="font-sans text-[13.5px] font-semibold text-burgundy hover:text-chocolate-light" />
        </div>
      ) : (
        <CompleteMembershipForm email={state.email} initialName="" terms={membershipTerms()} next={next} />
      )}
    </AuthShell>
  );
}
