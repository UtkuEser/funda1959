import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Üye Ol",
  robots: { index: false, follow: true },
};

export default function UyeOlPage() {
  return (
    <AuthShell
      title="Funda Hesabınızı Oluşturun"
      subtitle="Birkaç adımda hesabınızı oluşturun."
      altPrompt={
        <>
          Zaten hesabınız var mı?{" "}
          <Link
            href="/giris"
            className="font-semibold text-burgundy hover:text-chocolate-light"
          >
            Giriş Yap →
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
