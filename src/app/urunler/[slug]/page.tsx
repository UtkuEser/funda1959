import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalogProducts, getProductDetail } from "@/lib/data";
import { ProductDetail } from "@/components/product/ProductDetail";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return catalogProducts.map((p) => ({ slug: p.slug }));
}

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

  return <ProductDetail product={product} />;
}
