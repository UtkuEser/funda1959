import type { Metadata } from "next";
import { QuickOrderPage } from "@/components/quick-order/QuickOrderPage";
import { PricesProvider } from "@/lib/pricing/prices-context";
import { CatalogProvider } from "@/lib/catalog/catalog-context";
import { getStorefrontData } from "@/lib/catalog/server";

export const metadata: Metadata = {
  title: "Hızlı Sipariş",
  description:
    "Funda 1959'un günlük lezzetlerini hızlıca seçin, adedini belirleyin ve tek adımda sepete ekleyin. Giriş yapmadan pratik sipariş.",
  alternates: { canonical: "/hizli-siparis" },
};

// current prices (SUPABASE_PLAN.md, D5): read per request, never from the build
export const dynamic = "force-dynamic";

export default async function HizliSiparisPage() {
  const { prices, products, hidden } = await getStorefrontData();
  return (
    <CatalogProvider products={products} hidden={hidden}>
      <PricesProvider prices={prices}>
        <QuickOrderPage />
      </PricesProvider>
    </CatalogProvider>
  );
}
