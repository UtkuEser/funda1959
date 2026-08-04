import Link from "next/link";
import { categories } from "@/lib/data";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeIn } from "@/components/shared/FadeIn";

export function CategoryGrid() {
  return (
    <section className="py-20 md:py-28 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Ürün Kategorileri"
          title="Her damak zevkine bir lezzet"
          subtitle="Yaş pastalardan geleneksel tatlılara, el yapımı çikolatalardan hafif mini lezzetlere uzanan geniş yelpazemizle her anınıza uygun bir seçenek bulabilirsiniz."
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {categories.map((category, index) => (
            <FadeIn
              key={category.slug}
              delay={
                index < 4
                  ? ([0, 100, 200, 300][index] as 0 | 100 | 200 | 300)
                  : 0
              }
            >
              <Link
                href={`/lezzetlerimiz/${category.slug}`}
                className="group block rounded-2xl overflow-hidden bg-cream-light border border-sand-light hover:border-gold/40 hover:shadow-lg hover:shadow-sand/30 transition-all duration-300"
              >
                {/* Image area */}
                <div
                  className={`w-full aspect-square bg-gradient-to-br ${category.gradient} relative overflow-hidden`}
                >
                  {/* Decorative text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p
                      className="font-serif text-5xl font-bold opacity-10 select-none"
                      style={{ color: category.accentColor }}
                    >
                      {category.name.charAt(0)}
                    </p>
                  </div>

                  {/* Hover zoom overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-espresso/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-serif text-base font-semibold text-chocolate group-hover:text-warm-brown transition-colors leading-tight mb-1">
                    {category.name}
                  </h3>
                  <p className="font-sans text-xs text-mocha leading-relaxed line-clamp-2">
                    {category.shortDescription}
                  </p>
                  <p className="font-sans text-xs text-gold font-semibold mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Keşfet →
                  </p>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={400}>
          <div className="mt-12 text-center">
            <Link
              href="/lezzetlerimiz"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-chocolate text-chocolate rounded-xl font-sans font-semibold text-sm tracking-wide hover:bg-chocolate hover:text-cream-light transition-all duration-300"
            >
              Tüm Lezzetleri Gör
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
