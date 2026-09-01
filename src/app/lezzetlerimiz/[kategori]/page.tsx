import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { catalogProducts, categories, getCategoryBySlug } from "@/lib/data";
import { ProductCard } from "@/components/shared/ProductCard";
import { FadeIn } from "@/components/shared/FadeIn";
import { CTASection } from "@/components/shared/CTASection";

type Props = {
  params: Promise<{ kategori: string }>;
};

export async function generateStaticParams() {
  return categories.map((cat) => ({ kategori: cat.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kategori } = await params;
  const category = getCategoryBySlug(kategori);

  if (!category) return { title: "Kategori Bulunamadı" };

  return {
    title: category.name,
    description: category.description,
    keywords: [
      `Ankara ${category.name}`,
      `Ankara pastane ${category.name}`,
      `${category.name} siparişi`,
    ],
    openGraph: {
      title: `${category.name} | Funda 1959`,
      description: category.description,
    },
  };
}

export default async function KategoriPage({ params }: Props) {
  const { kategori } = await params;
  const category = getCategoryBySlug(kategori);

  if (!category) notFound();

  const categoryProducts = catalogProducts.filter((p) => p.categorySlug === kategori);
  const otherCategories = categories.filter((c) => c.slug !== kategori).slice(0, 6);

  return (
    <>
      {/* Hero */}
      <section
        className={`relative pt-32 pb-16 md:pt-44 md:pb-20 bg-gradient-to-br ${category.gradient} overflow-hidden`}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at 70% 30%, rgba(245, 240, 232, 0.4) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <FadeIn>
            <nav className="flex items-center gap-2 text-sm font-sans text-espresso/50 mb-8">
              <Link href="/" className="hover:text-espresso transition-colors">
                Anasayfa
              </Link>
              <span>/</span>
              <Link
                href="/lezzetlerimiz"
                className="hover:text-espresso transition-colors"
              >
                Lezzetlerimiz
              </Link>
              <span>/</span>
              <span className="text-espresso font-semibold">{category.name}</span>
            </nav>
          </FadeIn>
          <FadeIn delay={100}>
            <p className="font-sans text-xs tracking-[0.25em] uppercase text-warm-brown mb-3 font-semibold">
              Kategori
            </p>
          </FadeIn>
          <FadeIn delay={200}>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold text-espresso leading-tight mb-5">
              {category.name}
            </h1>
          </FadeIn>
          <FadeIn delay={300}>
            <p className="font-sans text-base md:text-lg text-espresso/70 max-w-2xl leading-relaxed">
              {category.shortDescription}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Description */}
      <section className="py-10 bg-cream-light border-b border-sand-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="font-sans text-base text-mocha leading-relaxed text-center">
              {category.description}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Products */}
      <section className="py-14 md:py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {categoryProducts.length > 0 ? (
            <>
              <FadeIn>
                <h2 className="font-serif text-2xl md:text-3xl font-semibold text-chocolate mb-8">
                  {category.name} Çeşitlerimiz
                </h2>
              </FadeIn>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 sm:gap-5 md:gap-6">
                {categoryProducts.map((product, index) => (
                  <FadeIn
                    key={product.id}
                    delay={index < 4 ? ([0, 100, 200, 300][index] as 0 | 100 | 200 | 300) : 0}
                  >
                    <ProductCard product={product} image={product.image} />
                  </FadeIn>
                ))}
              </div>
            </>
          ) : (
            <FadeIn>
              <div className="text-center py-20">
                <p className="font-serif text-2xl text-chocolate mb-3">
                  Bu kategoride yakında yeni lezzetler
                </p>
                <p className="font-sans text-base text-mocha mb-8">
                  Güncel çeşitlerimiz için şubelerimizi ziyaret edin veya iletişime geçin.
                </p>
                <Link
                  href="/iletisim"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-chocolate text-cream-light rounded-xl font-sans font-semibold text-sm hover:bg-chocolate-light transition-colors"
                >
                  İletişime Geç
                </Link>
              </div>
            </FadeIn>
          )}

          {/* Pricing note */}
          <FadeIn delay={300}>
            <div className="mt-10 flex items-start gap-3 max-w-xl bg-cream-light border border-sand-light rounded-xl px-5 py-4">
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
                Fiyat bilgisi ve güncel çeşitler için lütfen şubelerimizle iletişime geçin. Siparişler en az 24 saat öncesinden alınmaktadır.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Other categories */}
      <section className="py-12 md:py-16 bg-cream-light border-t border-sand-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h3 className="font-serif text-xl font-semibold text-chocolate mb-6 text-center">
              Diğer Kategoriler
            </h3>
          </FadeIn>
          <div className="flex flex-wrap justify-center gap-3">
            {otherCategories.map((cat) => (
              <FadeIn key={cat.slug}>
                <Link
                  href={`/lezzetlerimiz/${cat.slug}`}
                  className="px-5 py-2.5 bg-cream border border-sand-light text-warm-brown font-sans text-sm font-medium rounded-xl hover:border-gold/50 hover:text-chocolate hover:bg-cream-dark transition-all duration-200"
                >
                  {cat.name}
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        eyebrow="Sipariş"
        title="Özel bir gününüz için"
        subtitle="Pasta siparişleriniz için en az 24 saat öncesinden, özel tasarım siparişleri için daha uzun süre öncesinden iletişime geçmenizi öneririz."
        primaryCta={{ label: "Sipariş İçin Ara", href: "/iletisim" }}
        secondaryCta={{ label: "WhatsApp ile Sor", href: "/iletisim" }}
        variant="dark"
      />
    </>
  );
}
