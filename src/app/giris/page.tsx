import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Giriş Yap",
  robots: { index: false, follow: true },
};

export default function GirisPage() {
  return (
    <AuthShell
      title="Hesabınıza Giriş Yapın"
      subtitle="Siparişlerinizi, adreslerinizi ve hesap bilgilerinizi tek yerden yönetin."
      altPrompt={
        <>
          Hesabınız yok mu?{" "}
          <Link
            href="/uye-ol"
            className="font-semibold text-burgundy hover:text-chocolate-light"
          >
            Üye Ol →
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
