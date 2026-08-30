import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Şifremi Unuttum",
  robots: { index: false, follow: true },
};

export default function SifremiUnuttumPage() {
  return (
    <AuthShell
      title="Şifrenizi Sıfırlayın"
      subtitle="Hesabınıza kayıtlı e-posta adresini girin. Şifre sıfırlama bağlantısını size gönderelim."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
