import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { Figure } from "@/components/ui/Figure";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { giftBoxes, giftIntro } from "@/content/gifting";

/** Bir kutu mutluluk — ana unsur büyük paketleme görseli. */
export function GiftBox() {
  const options = giftBoxes.slice(0, 3);

  return (
    <Section tone="cream">
      <Container>
        <Reveal>
          <Figure
            asset={giftIntro.image}
            ratio="21 / 9"
            sizes="100vw"
            className="w-full"
          />
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="t-label font-sans text-bordo/80">{giftIntro.eyebrow}</p>
            <h2 className="t-h2 mt-5 max-w-[14ch] font-serif text-ink">
              {giftIntro.title}
            </h2>
          </div>

          <div className="lg:col-span-5">
            <p className="t-body measure text-ink-soft">{giftIntro.description}</p>
            <div className="mt-8">
              <Button href="/paket-hediye">Paket & Hediye</Button>
            </div>
          </div>
        </div>

        {/* En fazla üç seçenek */}
        <div className="mt-16 grid gap-10 sm:grid-cols-3 lg:mt-20">
          {options.map((box, index) => (
            <Reveal key={box.id} delay={index * 80}>
              <article>
                <Figure
                  asset={box.image}
                  ratio="4 / 5"
                  sizes="(max-width: 640px) 100vw, 30vw"
                />
                <h3 className="t-card mt-5 font-serif text-ink">{box.name}</h3>
                <p className="mt-3 max-w-[42ch] font-sans text-[16px] leading-[1.65] text-ink-soft">
                  {box.description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
