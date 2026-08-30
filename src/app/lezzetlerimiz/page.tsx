import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/CatalogView";

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

export default function LezzetlerimizPage() {
  return <CatalogView />;
}
