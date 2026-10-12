import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductDetail } from "@/lib/data";
import { ProductDetail } from "@/components/product/ProductDetail";
import { applyPriceToDetail } from "@/lib/pricing/prices";
import { PricesProvider } from "@/lib/pricing/prices-context";
import { getDisplayPriceMap } from "@/lib/pricing/prices-server";

type Props = { params: Promise<{ slug: string }> };

// current prices (SUPABASE_PLAN.md, D5): read per request, never from the build
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductDetail(slug);
  if (!product) return { title: "Ürün Bulunamadı" };
  return {
    title: product.name,
    description: product.shortDescription,
    openGraph: {
      title: `${product.name} | Funda 1959`,
      description: product.shortDescription,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductDetail(slug);
  if (!product) notFound();

  const prices = await getDisplayPriceMap();
  return (
    <PricesProvider prices={prices}>
      <ProductDetail product={applyPriceToDetail(product, prices)} />
    </PricesProvider>
  );
}
