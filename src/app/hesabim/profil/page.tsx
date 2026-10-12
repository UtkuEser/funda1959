import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountUnavailable } from "@/components/account/AccountUnavailable";
import { ProfileView } from "@/components/account/ProfileView";
import { requireMemberPage } from "@/lib/customer-auth/next";

export const metadata: Metadata = {
  title: "Profil Bilgilerim",
  robots: { index: false, follow: false },
};

export default async function ProfilPage() {
  const member = await requireMemberPage("/hesabim/profil");
  if (member.kind !== "member") return <AccountUnavailable current="profile" title="Profil Bilgilerim" />;

  return (
    <AccountShell current="profile" title="Profil Bilgilerim" subtitle="Hesap bilgilerinizi ve şifrenizi güncelleyin.">
      <ProfileView profile={member.profile} />
    </AccountShell>
  );
}
