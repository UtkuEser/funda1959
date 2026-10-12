import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { safeNextPath } from "@/lib/auth";
import { getMemberState, membershipAvailable, signInNotice } from "@/lib/customer-auth/next";
import { availableSocialProviders } from "@/lib/customer-auth/providers";

export const metadata: Metadata = {
  title: "Giriş Yap",
  robots: { index: false, follow: true },
};

export default async function GirisPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);

  const state = await getMemberState();
  if (state.kind === "member") redirect(next);
  if (state.kind === "needs_profile") redirect(`/uyelik-tamamla?next=${encodeURIComponent(next)}`);

  const [available, providers] = await Promise.all([membershipAvailable(), availableSocialProviders()]);

  return (
    <AuthShell
      title="Hesabınıza Giriş Yapın"
      subtitle="Siparişlerinizi, adreslerinizi ve hesap bilgilerinizi tek yerden yönetin."
      altPrompt={
        <>
          Hesabınız yok mu?{" "}
          <Link
            href={next === "/hesabim" ? "/uye-ol" : `/uye-ol?next=${encodeURIComponent(next)}`}
            className="font-semibold text-burgundy hover:text-chocolate-light"
          >
            Üye Ol →
          </Link>
        </>
      }
    >
      <LoginForm available={available} providers={providers} next={next} notice={signInNotice(params.hata)} />
    </AuthShell>
  );
}
