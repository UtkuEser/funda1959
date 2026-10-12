import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { membershipAvailable } from "@/lib/customer-auth/next";

export const metadata: Metadata = {
  title: "Şifremi Unuttum",
  robots: { index: false, follow: true },
};

export default async function SifremiUnuttumPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { baglanti } = await searchParams;
  const notice =
    baglanti === "gecersiz"
      ? "Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş. Lütfen yeni bir bağlantı isteyin."
      : null;
  return (
    <AuthShell
      title="Şifrenizi Sıfırlayın"
      subtitle="Hesabınıza kayıtlı e-posta adresini girin. Şifre sıfırlama bağlantısını size gönderelim."
    >
      <ForgotPasswordForm available={await membershipAvailable()} notice={notice} />
    </AuthShell>
  );
}
