import Link from "next/link";
import { featuredProducts } from "@/lib/data";
import { ProductCard } from "@/components/shared/ProductCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeIn } from "@/components/shared/FadeIn";

export function FeaturedProducts() {
  return (
    <section className="py-20 md:py-28 bg-cream-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="En Sevilenler"
          title="Müşterilerimizin gözdesi"
          subtitle="Yılların birikimiyle öne çıkan lezzetlerimiz. Detaylı bilgi ve sipariş için şubelerimizle iletişime geçin."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
          {featuredProducts.map((product, index) => (
            <FadeIn
              key={product.id}
              delay={
                index < 4
                  ? ([0, 100, 200, 300][index] as 0 | 100 | 200 | 300)
                  : 0
              }
            >
              <ProductCard product={product} />
            </FadeIn>
          ))}
        </div>

        {/* Info note */}
        <FadeIn delay={200}>
          <div className="mt-10 flex items-start gap-3 max-w-xl mx-auto bg-cream border border-sand-light rounded-xl px-5 py-4">
            <svg
              className="w-5 h-5 text-gold mt-0.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="font-sans text-sm text-mocha">
              Fiyat bilgisi ve sipariş için şubelerimizle iletişime geçin veya{" "}
              <Link href="/iletisim" className="text-chocolate font-semibold underline decoration-gold underline-offset-2">
                iletişim formunu
              </Link>{" "}
              kullanın.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={300}>
          <div className="mt-10 text-center">
            <Link
              href="/lezzetlerimiz"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-chocolate text-chocolate rounded-xl font-sans font-semibold text-sm tracking-wide hover:bg-chocolate hover:text-cream-light transition-all duration-300 group"
            >
              Tüm Ürünleri Keşfet
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
