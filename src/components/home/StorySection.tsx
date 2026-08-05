import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Figure } from "@/components/ui/Figure";
import { Divider } from "@/components/ui/Ornament";
import { Reveal } from "@/components/ui/Reveal";
import { storyChapters, storyTeaser } from "@/content/story";

/** Hikaye bloğu — kurumsal tarihçe değil, kısa bir marka hafızası. */
export function StorySection() {
  return (
    <section className="relative overflow-hidden bg-cream surface-paper py-20 md:py-28 lg:py-32">
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-20">
          <Reveal className="order-2 lg:order-1 lg:col-span-6">
            <Figure
        asset={storyTeaser.image}
              ratio="aspect-[5/4] lg:aspect-[4/3]"
              sizes="(max-width: 1024px) 92vw, 46vw"
              framed
            />
          </Reveal>

          <div className="order-1 lg:order-2 lg:col-span-6">
            <p className="font-sans text-[12px] uppercase tracking-[0.32em] text-bordo/80">
              {storyTeaser.eyebrow}
            </p>
            <h2 className="mt-5 font-serif text-[2.3rem] leading-[1.12] text-ink sm:text-[2.8rem] lg:text-[3.1rem]">
              {storyTeaser.title}
            </h2>
            <Divider className="mt-7 justify-start" />
            <p className="mt-7 max-w-lg font-sans text-[17px] leading-[1.8] text-ink-soft">
              {storyTeaser.description}
            </p>
            <p className="mt-5 max-w-lg font-serif text-[1.35rem] leading-relaxed text-bordo">
              Bir pastane yalnızca ürün satmaz; bir mahallenin hafızasını taşır.
            </p>

            <div className="mt-10">
              <Button href={storyTeaser.cta.href} variant="outline">
                {storyTeaser.cta.label}
              </Button>
            </div>
          </div>
        </div>

        {/* Zaman şeridi */}
        <ol className="mt-16 grid gap-px border border-stone/30 bg-stone/30 sm:grid-cols-3 lg:mt-20 lg:grid-cols-5">
          {storyChapters.map((chapter, index) => (
            <Reveal key={chapter.year} delay={index * 70} className="bg-cream">
              <li className="h-full px-6 py-7">
                <p className="font-serif text-2xl text-gold">{chapter.year}</p>
                <p className="mt-3 font-sans text-[13px] uppercase tracking-[0.14em] text-ink">
                  {chapter.title}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
