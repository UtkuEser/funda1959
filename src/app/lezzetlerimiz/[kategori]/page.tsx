import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveCatalogListing } from "@/lib/data";
import { CatalogView } from "@/components/catalog/CatalogView";
import { PricesProvider } from "@/lib/pricing/prices-context";
import { getDisplayPriceMap } from "@/lib/pricing/prices-server";

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
  return (
    <PricesProvider prices={await getDisplayPriceMap()}>
      <CatalogView slug={kategori} />
    </PricesProvider>
  );
}
