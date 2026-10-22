import type { Metadata } from "next";
import { search } from "@/lib/search";
import { SearchResultsView } from "@/components/search/SearchResultsView";
import { PricesProvider } from "@/lib/pricing/prices-context";
import { CatalogProvider } from "@/lib/catalog/catalog-context";
import { getStorefrontData } from "@/lib/catalog/server";

export const metadata: Metadata = {
  title: "Arama",
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  // `search()` is pure + deterministic, so running it on the server avoids
  // any hydration mismatch. The client view only filters/sorts the result.
  const { prices, products, hidden } = await getStorefrontData();
  const results = search(q);
  return (
    <CatalogProvider products={products} hidden={hidden}>
      <PricesProvider prices={prices}>
        <SearchResultsView results={results} query={q} />
      </PricesProvider>
    </CatalogProvider>
  );
}
