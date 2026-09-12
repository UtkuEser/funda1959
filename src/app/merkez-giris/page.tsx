import type { Metadata } from "next";
import { CentralLoginForm } from "@/components/admin/CentralLoginForm";

export const metadata: Metadata = {
  title: "Merkez Yönetim Girişi — Funda 1959",
  robots: { index: false, follow: false },
};

/**
 * Central (SUPER_ADMIN) login. Deliberately not linked from anywhere —
 * not the public site, not /admin-giris, not the Header/Footer. Reached
 * only by someone who already knows this exact URL.
 */
export default function MerkezGirisPage() {
  return <CentralLoginForm />;
}
