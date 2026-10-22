import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveCatalogListing } from "@/lib/data";
import { CatalogView } from "@/components/catalog/CatalogView";
import { PricesProvider } from "@/lib/pricing/prices-context";
import { CatalogProvider } from "@/lib/catalog/catalog-context";
import { getStorefrontData } from "@/lib/catalog/server";

type Props = {
  params: Promise<{ kategori: string }>;
};

// current prices (SUPABASE_PLAN.md, D5): read per request, never from the build
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kategori } = await params;
  const listing = resolveCatalogListing(kategori);
  if (!listing || kategori === "tumu") return { title: "Kategori Bulunamadı" };

  return {
    title: listing.title,
    description: listing.description,
    keywords: [`Ankara ${listing.title}`, `Ankara pastane ${listing.title}`, `${listing.title} siparişi`],
    openGraph: {
      title: `${listing.title} | Funda 1959`,
      description: listing.description,
    },
  };
}

export default async function KategoriPage({ params }: Props) {
  const { kategori } = await params;
  if (kategori === "tumu" || !resolveCatalogListing(kategori)) notFound();
  const { prices, products, hidden } = await getStorefrontData();
  return (
    <CatalogProvider products={products} hidden={hidden}>
      <PricesProvider prices={prices}>
        <CatalogView slug={kategori} />
      </PricesProvider>
    </CatalogProvider>
  );
}
