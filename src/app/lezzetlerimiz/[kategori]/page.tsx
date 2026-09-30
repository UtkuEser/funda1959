import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalogListingSlugs, resolveCatalogListing } from "@/lib/data";
import { CatalogView } from "@/components/catalog/CatalogView";

type Props = {
  params: Promise<{ kategori: string }>;
};

export async function generateStaticParams() {
  return catalogListingSlugs.map((kategori) => ({ kategori }));
}

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
  return <CatalogView slug={kategori} />;
}
