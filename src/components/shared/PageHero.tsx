import type { CSSProperties } from "react";
import { Container } from "@/components/ui/Container";
import { Divider } from "@/components/ui/Ornament";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

/** Alt sayfaların ortak üst bloğu — sabit header yüksekliğini de karşılar. */
export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-cream-2 surface-paper pt-36 pb-16 md:pt-44 md:pb-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="animate-rise font-sans text-[12px] uppercase tracking-[0.32em] text-bordo/75">
            {eyebrow}
          </p>
          <h1
            className="animate-rise mt-5 font-serif text-[2.4rem] leading-[1.1] text-ink sm:text-5xl lg:text-[3.4rem]"
            style={{ "--rise-delay": "90ms" } as CSSProperties}
          >
            {title}
          </h1>
          <Divider className="mt-7" />
          {description ? (
            <p
              className="animate-rise mx-auto mt-6 max-w-xl font-sans text-[16px] leading-[1.75] text-ink-soft sm:text-[17px]"
              style={{ "--rise-delay": "180ms" } as CSSProperties}
            >
              {description}
            </p>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
