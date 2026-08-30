import { Container } from "@/components/shared/Container";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ProductGridCard } from "@/components/catalog/ProductGridCard";
import type { CatalogProduct } from "@/lib/data";

type FeaturedProductStripProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  products: CatalogProduct[];
  action: { label: string; href: string };
  background?: "cream" | "cream-light";
};

/**
 * A short row of catalog products, rendered through the shared
 * ProductGridCard so cart behaviour (quick-add vs. "Seçenekleri Gör") stays
 * exactly as everywhere else.
 */
export function FeaturedProductStrip({
  eyebrow,
  title,
  subtitle,
  products,
  action,
  background = "cream-light",
}: FeaturedProductStripProps) {
  return (
    <section className={`py-20 md:py-28 ${background === "cream" ? "bg-cream" : "bg-cream-light"}`}>
      <Container>
        <SectionHeader
          centered={false}
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          action={action}
        />
        <div className="grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-4">
          {products.map((product) => (
            <ProductGridCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </section>
  );
}
