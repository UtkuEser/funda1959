import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/CatalogView";
import { PricesProvider } from "@/lib/pricing/prices-context";
import { getDisplayPriceMap } from "@/lib/pricing/prices-server";

export const metadata: Metadata = {
  title: "Lezzetlerimiz",
  description:
    "Yaş pastalar, adet pastalar, tatlılar, börekler, kuru pastalar, el yapımı çikolatalar ve hediyelikler. Funda 1959'un tüm lezzetlerini keşfedin, filtreleyin ve sipariş verin.",
  keywords: [
    "Ankara yaş pasta",
    "Ankara pastane ürünleri",
    "Ankara el yapımı çikolata",
    "Ankara doğum günü pastası",
    "aynı gün pasta teslimat Ankara",
  ],
};

// current prices (SUPABASE_PLAN.md, D5): read per request, never from the build
export const dynamic = "force-dynamic";

export default async function LezzetlerimizPage() {
  return (
    <PricesProvider prices={await getDisplayPriceMap()}>
      <CatalogView />
    </PricesProvider>
  );
}
