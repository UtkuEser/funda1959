import type { Metadata } from "next";
import { BranchLoginForm } from "@/components/admin/BranchLoginForm";

export const metadata: Metadata = {
  title: "Yönetim Paneli Girişi — Funda 1959",
  robots: { index: false, follow: false },
};

/**
 * Branch manager login. Only GOP / Panora / İncek ever appear here —
 * Merkez Yönetim (SUPER_ADMIN) has its own separate, unlinked page at
 * /merkez-giris and must never be reachable or hinted at from this one.
 */
export default function AdminGirisPage() {
  return <BranchLoginForm />;
}
