import type { Metadata } from "next";
import { PageHero } from "@/components/shared/PageHero";
import { CtaBand } from "@/components/shared/CtaBand";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Figure } from "@/components/ui/Figure";
import { Reveal } from "@/components/ui/Reveal";
import { giftBoxes, giftIntro, giftMoments, giftRitual } from "@/content/gifting";
import { giftProducts } from "@/content/menu";

export const metadata: Metadata = {
  title: "Paket & Hediye",
  description:
    "Funda 1959 hediye kutuları: misafirlik, ofis ikramı ve özel gün kutuları. Bordo kurdele, el yazısı kart ve günlük hazırlanan içerik.",
};

export default function GiftPage() {
  return (
    <>
      <PageHero
        eyebrow={giftIntro.eyebrow}
        title="Elde taşınan küçük bir jest."
        description={giftIntro.description}
      />

      {/* Kutular */}
      <Section tone="cream">
        <Container>
          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {giftBoxes.map((box, index) => (
              <Reveal key={box.id} delay={index * 90} className="h-full">
                <article className="flex h-full flex-col">
                  <Figure
        asset={box.image}
                    ratio="aspect-[3/4]"
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 24vw"
                    framed
                  />
                  <div className="flex flex-1 flex-col pt-6">
                    <p className="font-sans text-[10px] uppercase tracking-[0.26em] text-gold">
                      {box.audience}
                    </p>
                    <h3 className="mt-3 font-serif text-2xl text-ink">{box.name}</h3>
                    <p className="mt-3 flex-1 font-sans text-sm leading-relaxed text-ink-soft">
                      {box.description}
                    </p>
                    <ul className="mt-6 space-y-2 border-t border-stone/30 pt-5">
                      {box.contents.map((content) => (
                        <li
                          key={content}
                          className="font-sans text-[12px] uppercase tracking-[0.12em] text-ink-mute"
                        >
                          {content}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Ritüel */}
      <Section tone="cream-2">
        <Container>
          <SectionHeading
            eyebrow="Paketleme Ritüeli"
            title="Kutu, açılmadan önce de bir jesttir."
            description="Hediye kutuları sipariş alındıktan sonra hazırlanır; içerik, tazelik ve sunum birlikte düşünülür."
          />

          <div className="mt-16 grid gap-px border border-stone/30 bg-stone/30 sm:grid-cols-2 lg:grid-cols-4">
            {giftRitual.map((step, index) => (
              <Reveal key={step.step} delay={index * 80} className="bg-cream-2">
                <div className="h-full px-7 py-9">
                  <p className="font-serif text-3xl text-bordo/70">{step.step}</p>
                  <h3 className="mt-5 font-serif text-xl text-ink">{step.title}</h3>
                  <p className="mt-3 font-sans text-sm leading-relaxed text-ink-soft">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Kutuya giren ürünler */}
      <Section tone="paper" spacing="tight">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHeading
                align="left"
                eyebrow="İçerik"
                title="Kutuya en çok girenler."
                description="Kutunun içeriğini birlikte belirliyoruz; aşağıdaki ürünler en sık tercih edilenler."
              />
            </div>

            <div className="lg:col-span-7">
              <ul className="divide-y divide-stone/30 border-y border-stone/30">
                {giftProducts.map((product, index) => (
                  <Reveal key={product.id} delay={index * 70}>
                    <li className="flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
                      <span className="font-serif text-xl text-ink">{product.name}</span>
                      <span className="font-sans text-[12px] uppercase tracking-[0.14em] text-ink-mute">
                        {product.short}
                      </span>
                    </li>
                  </Reveal>
                ))}
              </ul>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
                {giftMoments.map((moment) => (
                  <li
                    key={moment}
                    className="font-sans text-[11px] uppercase tracking-[0.16em] text-bordo/70"
                  >
                    {moment}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <CtaBand
        eyebrow="Hediye Siparişi"
        title="Kutunuzu birlikte hazırlayalım."
        description="Kime gittiğini söyleyin; içeriği, boyutu ve teslim gününü buna göre planlayalım."
        primary={{ href: "/iletisim", label: "Sipariş Ver" }}
        secondary={{ href: "/kurumsal", label: "Toplu Sipariş" }}
      />
    </>
  );
}
