import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Figure } from "@/components/ui/Figure";
import { Reveal } from "@/components/ui/Reveal";
import { branches } from "@/content/branches";

/** Şubeler — masaüstünde üç büyük kart. */
export function Branches() {
  return (
    <Section tone="cream-2">
      <Container>
        <Heading
          label="Funda’da Buluşalım"
          title="Üç şube, aynı sıcaklık."
          lead="Şubelerimiz birbirinin kopyası değil; her biri bulunduğu mahallenin ritmine göre yaşıyor."
        />

        <div className="mt-16 grid gap-10 md:grid-cols-3 lg:mt-20 lg:gap-12">
          {branches.map((branch, index) => (
            <Reveal key={branch.id} delay={index * 90}>
              <article className="group flex h-full flex-col">
                <Figure
                  asset={branch.image}
                  sizes="(max-width: 768px) 100vw, 30vw"
                  zoom
                />

                <div className="flex flex-1 flex-col pt-6">
                  <h3 className="t-card font-serif text-ink">{branch.shortName}</h3>
                  <p className="mt-2 font-sans text-[16px] text-bordo/80">
                    {branch.atmosphere}
                  </p>
                  <p className="mt-4 flex-1 font-sans text-[16px] leading-[1.65] text-ink-soft">
                    {branch.address}
                  </p>

                  <a
                    href={branch.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-block w-fit border-b border-bordo/40 pb-1 font-sans text-[13px] uppercase tracking-[0.16em] text-bordo transition-colors hover:border-bordo"
                  >
                    Yol Tarifi
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
