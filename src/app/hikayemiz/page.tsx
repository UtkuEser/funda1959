import type { Metadata } from "next";
import { PageHero } from "@/components/shared/PageHero";
import { CtaBand } from "@/components/shared/CtaBand";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Figure } from "@/components/ui/Figure";
import { Reveal } from "@/components/ui/Reveal";
import { Monogram } from "@/components/ui/Marks";
import { storyChapters, storyIntro, storyTeaser, storyValues } from "@/content/story";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Hikayemiz",
  description:
    "1959’da küçük bir vitrinle başlayan Funda’nın hikayesi: değişen tarifler, değişmeyen alışkanlıklar ve bir şehrin tatlı hafızası.",
};

export default function StoryPage() {
  return (
    <>
      <PageHero
        eyebrow={storyTeaser.eyebrow}
        title={storyTeaser.title}
        description={storyTeaser.description}
      />

      {/* Giriş */}
      <Section tone="cream">
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <Figure
        asset={storyTeaser.image}
                ratio="4 / 5"
                sizes="(max-width: 1024px) 90vw, 40vw"
              />
            </Reveal>

            <div className="lg:col-span-7">
              <h2 className="font-serif text-[1.9rem] leading-snug text-ink sm:text-[2.4rem]">
                {storyIntro.lead}
              </h2>
              <div className="mt-8 space-y-6">
                {storyIntro.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 24)}
                    className="font-sans text-[15px] leading-[1.85] text-ink-soft sm:text-base"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="mt-10 flex items-center gap-5 border-t border-stone/30 pt-8">
                <Monogram className="h-12 w-12 text-bordo" />
                <p className="font-serif text-xl text-bordo">{site.positioning}</p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Dönemler */}
      <Section tone="cream-2">
        <Container>
          <Heading
            label="Dönemler"
            title="Altmış yılı aşan bir vitrin."
            lead="Ustalar değişti, çeşitler arttı, şehir büyüdü. Vitrinin arkasındaki özen aynı kaldı."
          />

          <ol className="mx-auto mt-16 max-w-3xl">
            {storyChapters.map((chapter, index) => (
              <Reveal key={chapter.year} delay={index * 80}>
                <li className="grid gap-4 border-b border-stone/30 py-8 sm:grid-cols-[140px_1fr] sm:gap-10">
                  <p className="font-serif text-2xl text-bordo">{chapter.year}</p>
                  <div>
                    <h3 className="font-serif text-xl text-ink">{chapter.title}</h3>
                    <p className="mt-3 font-sans text-sm leading-relaxed text-ink-soft">
                      {chapter.description}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </Container>
      </Section>

      {/* Değerler */}
      <Section tone="cream">
        <Container>
          <Heading
            label="Nasıl Çalışıyoruz"
            title="Alışkanlıklarımız tarif kadar önemli."
          />

          <div className="mt-14 grid gap-px border border-stone/30 bg-stone/30 sm:grid-cols-2 lg:grid-cols-4">
            {storyValues.map((value, index) => (
              <Reveal key={value.title} delay={index * 80} className="bg-cream">
                <div className="h-full px-7 py-9">
                  <p className="font-serif text-3xl text-gold">0{index + 1}</p>
                  <h3 className="mt-5 font-serif text-xl text-ink">{value.title}</h3>
                  <p className="mt-3 font-sans text-sm leading-relaxed text-ink-soft">
                    {value.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <CtaBand
        title="Hikayenin devamı şubelerimizde."
        description="Bir kahve, bir tatlı ve acele etmeyen bir sohbet için sizi bekliyoruz."
        primary={{ href: "/subeler", label: "Şubelerimizi Gör" }}
        secondary={{ href: "/lezzetler", label: "Lezzetleri Keşfet" }}
      />
    </>
  );
}
