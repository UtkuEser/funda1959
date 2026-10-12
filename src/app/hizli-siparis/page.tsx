import type { Metadata } from "next";
import { QuickOrderPage } from "@/components/quick-order/QuickOrderPage";
import { PricesProvider } from "@/lib/pricing/prices-context";
import { getDisplayPriceMap } from "@/lib/pricing/prices-server";

export const metadata: Metadata = {
  title: "Hızlı Sipariş",
  description:
    "Funda 1959'un günlük lezzetlerini hızlıca seçin, adedini belirleyin ve tek adımda sepete ekleyin. Giriş yapmadan pratik sipariş.",
  alternates: { canonical: "/hizli-siparis" },
};

// current prices (SUPABASE_PLAN.md, D5): read per request, never from the build
export const dynamic = "force-dynamic";

export default async function HizliSiparisPage() {
  return (
    <PricesProvider prices={await getDisplayPriceMap()}>
      <QuickOrderPage />
    </PricesProvider>
  );
}
