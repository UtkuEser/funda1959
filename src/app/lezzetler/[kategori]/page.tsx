import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/shared/PageHero";
import { CtaBand } from "@/components/shared/CtaBand";
import { ProductCard } from "@/components/shared/ProductCard";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { categories, getCategory, getProductsByCategory } from "@/content/menu";
import { breadcrumbSchema } from "@/lib/schema";

type CategoryPageProps = {
  params: Promise<{ kategori: string }>;
};

export function generateStaticParams() {
  return categories.map((category) => ({ kategori: category.slug }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { kategori } = await params;
  const category = getCategory(kategori);

  if (!category) return { title: "Lezzetler" };

  return {
    title: category.name,
    description: category.description,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { kategori } = await params;
  const category = getCategory(kategori);

  if (!category) notFound();

  const products = getProductsByCategory(category.slug);
  const others = categories.filter((item) => item.slug !== category.slug).slice(0, 4);

  const schema = breadcrumbSchema([
    { name: "Ana Sayfa", url: "/" },
    { name: "Lezzetler", url: "/lezzetler" },
    { name: category.name, url: `/lezzetler/${category.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <PageHero
        eyebrow={category.tagline}
        title={category.name}
        description={category.description}
      />

      <Section tone="cream">
        <Container>
          {products.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, index) => (
                <Reveal key={product.id} delay={index * 80} className="h-full">
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
          ) : (
            <p className="mx-auto max-w-lg text-center font-sans text-sm leading-relaxed text-ink-soft">
              Bu kategorinin çeşitleri şubelerimizde günlük olarak değişiyor. Güncel
              vitrin için bizi arayabilirsiniz.
            </p>
          )}

          {/* Diğer kategoriler */}
          <div className="mt-20 border-t border-stone/30 pt-10">
            <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-ink-mute">
              Diğer Kategoriler
            </p>
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
              {others.map((item) => (
                <Link
                  key={item.slug}
                  href={`/lezzetler/${item.slug}`}
                  className="font-serif text-xl text-ink transition-colors hover:text-bordo"
                >
                  {item.name}
                </Link>
              ))}
              <Link
                href="/lezzetler"
                className="font-sans text-[11px] uppercase tracking-[0.18em] text-bordo underline-offset-8 hover:underline"
              >
                Tümü
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      <CtaBand
        title="Bu kategoriden sipariş vermek ister misiniz?"
        description="Adet, çeşit ve teslim günü için bize yazın; hazırlığı planlayalım."
        primary={{ href: "/iletisim", label: "Sipariş Ver" }}
        secondary={{ href: "/subeler", label: "Şubelerimizi Gör" }}
      />
    </>
  );
}
