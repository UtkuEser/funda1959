import type { Metadata } from "next";
import { QuickOrderPage } from "@/components/quick-order/QuickOrderPage";

export const metadata: Metadata = {
  title: "Hızlı Sipariş",
  description:
    "Funda 1959'un günlük lezzetlerini hızlıca seçin, adedini belirleyin ve tek adımda sepete ekleyin. Giriş yapmadan pratik sipariş.",
  alternates: { canonical: "/hizli-siparis" },
};

export default function HizliSiparisPage() {
  return <QuickOrderPage />;
}
