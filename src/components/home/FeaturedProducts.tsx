import { signatureProducts } from "@/lib/data";
import { ProductCard } from "@/components/shared/ProductCard";
import { Container } from "@/components/shared/Container";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeIn } from "@/components/shared/FadeIn";

export function FeaturedProducts() {
  return (
    <section className="bg-cream py-16 md:py-24">
      <Container>
        <SectionHeader
          centered={false}
          title="Funda'nın İmza Lezzetleri"
          subtitle="Yıllardır vitrinimizin değişmeyen favorileri."
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-9 md:gap-x-7">
          {signatureProducts.map((product, index) => (
            <FadeIn
              key={product.id}
              delay={([0, 100, 200, 300] as const)[index] ?? 0}
            >
              <ProductCard product={product} />
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={200}>
          <p className="mt-8 font-sans text-[12px] text-taupe">
            Fiyatlar bilgi amaçlıdır; güncel fiyat ve sipariş için mağazalarımızla iletişime geçin.
          </p>
        </FadeIn>
      </Container>
    </section>
  );
}
