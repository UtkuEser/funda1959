import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Figure } from "@/components/ui/Figure";
import { Divider } from "@/components/ui/Ornament";
import { Reveal } from "@/components/ui/Reveal";
import { giftBoxes, giftIntro, giftMoments } from "@/content/gifting";

export function GiftSection() {
  return (
    <Section tone="paper">
      <Container>
        <div className="grid items-start gap-14 lg:grid-cols-12 lg:gap-16">
          {/* Metin */}
          <div className="lg:col-span-5 lg:sticky lg:top-36">
            <p className="font-sans text-[12px] uppercase tracking-[0.32em] text-bordo/80">
              {giftIntro.eyebrow}
            </p>
            <h2 className="mt-5 font-serif text-[2.3rem] leading-[1.12] text-ink sm:text-[2.8rem] lg:text-[3.1rem]">
              {giftIntro.title}
            </h2>
            <Divider className="mt-7 justify-start" />
            <p className="mt-7 max-w-md font-sans text-[17px] leading-[1.75] text-ink-soft">
              {giftIntro.description}
            </p>

            <ul className="mt-8 space-y-3">
              {giftMoments.map((moment) => (
                <li
                  key={moment}
                  className="flex items-center gap-3 font-sans text-[15px] text-ink-soft"
                >
                  <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
                  {moment}
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <Button href="/paket-hediye">Paket & Hediye</Button>
            </div>
          </div>

          {/* Kutular */}
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:col-span-7">
            {giftBoxes.map((box, index) => (
              <Reveal
                key={box.id}
                delay={index * 90}
                className={`h-full ${index % 2 === 1 ? "sm:mt-14" : ""}`}
              >
                <article className="flex h-full flex-col">
                  <Figure
        asset={box.image}
                    ratio="aspect-[4/5]"
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 28vw"
                    framed
                  />
                  <div className="flex flex-1 flex-col pt-6">
                    <p className="font-sans text-[11px] uppercase tracking-[0.26em] text-gold">
                      {box.audience}
                    </p>
                    <h3 className="mt-3 font-serif text-[1.5rem] text-ink">{box.name}</h3>
                    <p className="mt-3 flex-1 font-sans text-[15px] leading-[1.7] text-ink-soft">
                      {box.description}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
