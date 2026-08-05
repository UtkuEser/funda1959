import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/shared/PageHero";
import { CtaBand } from "@/components/shared/CtaBand";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { Figure } from "@/components/ui/Figure";

import { Reveal } from "@/components/ui/Reveal";
import { collections, getCategoriesByCollection } from "@/content/menu";

export const metadata: Metadata = {
  title: "Lezzetler",
  description:
    "Kahvenin yanına, eve götürmelik ve özel günler için: Funda 1959’un kuru pastalardan yaş pastalara uzanan ürün dünyası.",
};

export default function MenuPage() {
  return (
    <>
      <PageHero
        eyebrow="Lezzetler"
        title="Günün hangi anındaysanız."
        description="Vitrinimizi, günün akışına göre üç bölüme ayırdık. Kahve molası, eve götürmelik ve kutlama; her biri için ayrı bir raf."
      />

      {collections
        .filter((collection) => getCategoriesByCollection(collection.slug).length > 0)
        .map((collection, collectionIndex) => {
          const categories = getCategoriesByCollection(collection.slug);

          return (
            <Section
              key={collection.slug}
              id={collection.slug}
              tone={collectionIndex % 2 === 0 ? "cream" : "cream-2"}
            >
              <Container>
                <div className="flex flex-col gap-6 border-b border-stone/30 pb-10 md:flex-row md:items-end md:justify-between">
                  <div className="max-w-xl">
                    <p className="font-sans text-[13px] uppercase tracking-[0.3em] text-gold">
                      {collection.lead}
                    </p>
                    <h2 className="mt-4 font-serif text-[2rem] leading-tight text-ink sm:text-4xl">
                      {collection.title}
                    </h2>
                    <p className="mt-5 font-sans text-[16px] leading-relaxed text-ink-soft">
                      {collection.description}
                    </p>
                  </div>
                </div>

                <div className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map((category, index) => (
                    <Reveal key={category.slug} delay={index * 80} className="h-full">
                      <Link
                        href={`/lezzetler/${category.slug}`}
                        className="group flex h-full flex-col"
                      >
                        <Figure
        asset={category.image}
                          ratio="4 / 3"
                          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
                        />
                        <div className="flex flex-1 flex-col pt-6">
                          <h3 className="font-serif text-2xl text-ink transition-colors group-hover:text-bordo">
                            {category.name}
                          </h3>
                          <p className="mt-2 font-sans text-[13px] uppercase tracking-[0.14em] text-bordo/80">
                            {category.tagline}
                          </p>
                          <p className="mt-4 flex-1 font-sans text-[16px] leading-relaxed text-ink-soft">
                            {category.description}
                          </p>
                          <span className="mt-6 inline-flex w-fit border-b border-bordo/30 pb-1 font-sans text-[13px] uppercase tracking-[0.18em] text-bordo transition-colors group-hover:border-bordo">
                            İncele
                          </span>
                        </div>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </Container>
            </Section>
          );
        })}

      <CtaBand
        title="Vitrini görmeden de sipariş verebilirsiniz."
        description="Özel gün pastaları ve toplu siparişler için bizi arayın; çeşidi ve teslim gününü birlikte belirleyelim."
        primary={{ href: "/iletisim", label: "Sipariş Ver" }}
        secondary={{ href: "/imza-lezzetler", label: "İmza Lezzetler" }}
      />
    </>
  );
}
