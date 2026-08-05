import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { ArchiveFrame } from "@/components/story/ArchiveFrame";
import { storyTeaser } from "@/content/story";

/** Hikaye — tek güçlü arşiv görseli, kısa metin, sade 1959 vurgusu. */
export function Story() {
  return (
    <Section tone="cream">
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-6">
            <p className="t-label font-sans text-bordo/80">{storyTeaser.eyebrow}</p>

            <p className="mt-6 font-serif text-[clamp(4.5rem,9vw,8rem)] leading-[0.85] tracking-[-0.02em] text-bordo">
              1959
            </p>

            <h2 className="t-h2 mt-8 max-w-[15ch] font-serif text-ink">
              {storyTeaser.title}
            </h2>

            <p className="t-body measure mt-7 text-ink-soft">{storyTeaser.description}</p>

            <div className="mt-10">
              <Button href={storyTeaser.cta.href} variant="outline">
                {storyTeaser.cta.label}
              </Button>
            </div>
          </div>

          <Reveal className="lg:col-span-6">
            <ArchiveFrame
              image={storyTeaser.image}
              sizes="(max-width: 1024px) 92vw, 560px"
              caption="Funda 1959 arşivinden"
            />
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
