import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductDetail } from "@/lib/data";
import { ProductDetail } from "@/components/product/ProductDetail";
import { applyPriceToDetail } from "@/lib/pricing/prices";
import { PricesProvider } from "@/lib/pricing/prices-context";
import { CatalogProvider } from "@/lib/catalog/catalog-context";
import { CATALOG_DISPLAY_MAX_AGE_MS, getStorefrontData, refreshCatalog } from "@/lib/catalog/server";

type Props = { params: Promise<{ slug: string }> };

// current prices (SUPABASE_PLAN.md, D5): read per request, never from the build
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  await refreshCatalog({ maxAgeMs: CATALOG_DISPLAY_MAX_AGE_MS });
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
  // prices and the published panel products (D45) first: a draft or unpublished product is not found
  const { prices, products, hidden } = await getStorefrontData();
  const product = getProductDetail(slug);
  if (!product) notFound();

  return (
    <CatalogProvider products={products} hidden={hidden}>
      <PricesProvider prices={prices}>
        <ProductDetail product={applyPriceToDetail(product, prices)} />
      </PricesProvider>
    </CatalogProvider>
  );
}
