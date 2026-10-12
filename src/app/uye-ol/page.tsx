import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm, type RegisterStatus } from "@/components/auth/RegisterForm";
import { safeNextPath } from "@/lib/auth";
import { isSignupOpen, membershipTerms } from "@/lib/customer-auth/config";
import { getMemberState, membershipAvailable } from "@/lib/customer-auth/next";
import { availableSocialProviders } from "@/lib/customer-auth/providers";

export const metadata: Metadata = {
  title: "Üye Ol",
  robots: { index: false, follow: true },
};

export default async function UyeOlPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const next = safeNextPath((await searchParams).next);

  const state = await getMemberState();
  if (state.kind === "member") redirect(next);
  if (state.kind === "needs_profile") redirect(`/uyelik-tamamla?next=${encodeURIComponent(next)}`);

  // test data only (local + Preview); Production waits for the texts + approval (D26)
  const open = isSignupOpen();
  const available = open && (await membershipAvailable());
  const status: RegisterStatus = !open ? "closed" : available ? "open" : "unavailable";
  const providers = status === "open" ? await availableSocialProviders() : [];

  return (
    <AuthShell
      title="Funda Hesabınızı Oluşturun"
      subtitle="Birkaç adımda hesabınızı oluşturun."
      altPrompt={
        <>
          Zaten hesabınız var mı?{" "}
          <Link href="/giris" className="font-semibold text-burgundy hover:text-chocolate-light">
            Giriş Yap →
          </Link>
        </>
      }
    >
      <RegisterForm status={status} terms={membershipTerms()} providers={providers} next={next} />
    </AuthShell>
  );
}
