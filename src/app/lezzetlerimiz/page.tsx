import type { Metadata } from "next";
import Link from "next/link";
import { categories, products } from "@/lib/data";
import { ProductCard } from "@/components/shared/ProductCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeIn } from "@/components/shared/FadeIn";
import { CTASection } from "@/components/shared/CTASection";

export const metadata: Metadata = {
  title: "Lezzetlerimiz",
  description:
    "Yaş pastalar, kuru pastalar, el yapımı çikolatalar, şerbetli tatlılar ve daha fazlası. Funda 1959'un tüm lezzet kategorilerini keşfedin.",
  keywords: [
    "Ankara yaş pasta",
    "Ankara el yapımı çikolata",
    "Ankara baklava",
    "Ankara pastane ürünleri",
  ],
};

export default function LezzetlerimizPage() {
  return (
    <>
      {/* Hero */}
      <section
        className="relative pt-32 pb-16 md:pt-44 md:pb-20"
        style={{
          background:
            "linear-gradient(160deg, #EDE5D8 0%, #F5F0E8 50%, #FAF8F3 100%)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <p className="font-sans text-xs tracking-[0.25em] uppercase text-gold mb-4 font-semibold">
              Ürün Kataloğu
            </p>
          </FadeIn>
          <FadeIn delay={100}>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold text-chocolate leading-tight mb-5">
              Lezzetlerimiz
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="font-sans text-base md:text-lg text-warm-brown max-w-2xl mx-auto leading-relaxed">
              Yaş pastalardan geleneksel tatlılara, el yapımı çikolatalardan hafif mini lezzetlere uzanan geniş yelpazemizle her damak zevkine bir şeyler sunuyoruz.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Categories */}
      <section className="py-14 md:py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Kategoriler"
            title="Tüm kategorileri keşfet"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {categories.map((category, index) => (
              <FadeIn
                key={category.slug}
                delay={index < 4 ? ([0, 100, 200, 300][index] as 0 | 100 | 200 | 300) : 0}
              >
                <Link
                  href={`/lezzetlerimiz/${category.slug}`}
                  className="group flex items-center gap-3 bg-cream-light border border-sand-light rounded-xl px-4 py-3.5 hover:border-gold/40 hover:shadow-md transition-all duration-300"
                >
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.gradient} shrink-0 flex items-center justify-center`}
                  >
                    <span className="font-serif text-lg font-bold text-espresso/30">
                      {category.name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-serif text-sm font-semibold text-chocolate group-hover:text-warm-brown transition-colors truncate">
                      {category.name}
                    </p>
                    <p className="font-sans text-xs text-mocha truncate">
                      {category.shortDescription}
                    </p>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="py-14 md:py-20 bg-cream-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Öne Çıkanlar"
            title="Müşterilerin gözdesi"
            subtitle="Seçkin lezzetlerimizden bir derleme. Her biri için şubelerimizle iletişime geçebilirsiniz."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((product, index) => (
              <FadeIn
                key={product.id}
                delay={index < 4 ? ([0, 100, 200, 300][index] as 0 | 100 | 200 | 300) : 0}
              >
                <ProductCard product={product} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        eyebrow="Özel Gün"
        title="Özel bir gününüz mü var?"
        subtitle="Doğum günü, nişan, düğün veya kurumsal etkinlikleriniz için kişiselleştirilmiş pasta ve lezzet tasarımları."
        primaryCta={{ label: "Özel Gün Pastalarını İncele", href: "/ozel-gun" }}
        secondaryCta={{ label: "Sipariş İçin Ara", href: "/iletisim" }}
        variant="dark"
      />
    </>
  );
}
