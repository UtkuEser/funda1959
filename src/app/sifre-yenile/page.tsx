import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthNotice } from "@/components/auth/fields";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { getMemberState } from "@/lib/customer-auth/next";

export const metadata: Metadata = {
  title: "Yeni Şifre",
  robots: { index: false, follow: false },
};

/** Reached from the reset e-mail through /auth/confirm, which opened a short session. */
export default async function SifreYenilePage() {
  const state = await getMemberState();
  const signedIn = state.kind === "member" || state.kind === "needs_profile";

  return (
    <AuthShell title="Yeni Şifrenizi Belirleyin" subtitle="Hesabınız için yeni bir şifre seçin.">
      {signedIn ? (
        <ResetPasswordForm />
      ) : (
        <div className="space-y-4">
          <AuthNotice>
            {state.kind === "unavailable"
              ? "Üyelik servisi şu an kullanılamıyor. Lütfen biraz sonra tekrar deneyin."
              : "Şifre yenileme bağlantısı geçersiz veya süresi dolmuş. Lütfen yeni bir bağlantı isteyin."}
          </AuthNotice>
          <Link href="/sifremi-unuttum" className="inline-flex font-sans text-[13.5px] font-semibold text-burgundy hover:text-chocolate-light">
            Yeni bağlantı iste →
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
