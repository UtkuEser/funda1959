import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { ProfileView } from "@/components/account/ProfileView";
import { getAccountProfile } from "@/lib/account-service";

export const metadata: Metadata = {
  title: "Profil Bilgilerim",
  robots: { index: false, follow: false },
};

export default function ProfilPage() {
  return (
    <AccountShell
      current="profile"
      title="Profil Bilgilerim"
      subtitle="Hesap bilgilerinizi ve şifrenizi güncelleyin."
    >
      <ProfileView profile={getAccountProfile()} />
    </AccountShell>
  );
}
