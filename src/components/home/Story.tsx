import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import { Figure } from "@/components/ui/Figure";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { storyChapters, storyTeaser } from "@/content/story";

/** Hikaye — tek güçlü görsel, kısa metin, en fazla üç kilometre taşı. */
export function Story() {
  const milestones = [storyChapters[0], storyChapters[2], storyChapters[4]];

  return (
    <Section tone="cream">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-6">
            <p className="t-label font-sans text-bordo/80">{storyTeaser.eyebrow}</p>

            <h2 className="t-h2 mt-6 max-w-[15ch] font-serif text-ink">
              {storyTeaser.title}
            </h2>

            <p className="t-body measure mt-7 text-ink-soft">{storyTeaser.description}</p>

            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-stone/40 pt-8">
              {milestones.map((chapter) => (
                <div key={chapter.year}>
                  <dt className="font-serif text-[26px] leading-none text-bordo">
                    {chapter.year}
                  </dt>
                  <dd className="mt-3 font-sans text-[15px] leading-[1.5] text-ink-soft">
                    {chapter.title}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-10">
              <Button href={storyTeaser.cta.href} variant="outline">
                {storyTeaser.cta.label}
              </Button>
            </div>
          </div>

          <Reveal className="lg:col-span-6">
            <Figure asset={storyTeaser.image} sizes="(max-width: 1024px) 100vw, 46vw" />
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
