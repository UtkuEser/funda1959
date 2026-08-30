import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { LandingVisual, type LandingVisualProps } from "./LandingVisual";

export type CtaLink = { label: string; href: string };

type LandingHeroProps = {
  eyebrow: string;
  title: ReactNode;
  description: string;
  primary: CtaLink;
  secondary?: CtaLink;
  tertiary?: ReactNode;
  visual: Pick<LandingVisualProps, "gradient" | "style" | "label">;
};

/**
 * Editorial two-column hero on a calm cream ground. Text left, large visual
 * placeholder right. No full-width burgundy block — burgundy stays on the
 * eyebrow, the emphasis word and the primary button.
 */
export function LandingHero({
  eyebrow,
  title,
  description,
  primary,
  secondary,
  tertiary,
  visual,
}: LandingHeroProps) {
  return (
    <section className="bg-cream-light pt-24 pb-14 md:pt-32 md:pb-20">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,48%)_minmax(0,52%)] lg:gap-14">
          <div>
            <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-burgundy/55">
              {eyebrow}
            </p>
            <h1 className="mt-4 font-serif text-[32px] font-semibold leading-[1.12] text-espresso sm:text-[40px] lg:text-[46px]">
              {title}
            </h1>
            <p className="mt-5 max-w-[30rem] font-sans text-[15px] leading-relaxed text-warm-brown md:text-[16px]">
              {description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={primary.href}
                className="inline-flex items-center justify-center rounded-md bg-burgundy px-7 py-3.5 font-sans text-[15px] font-semibold tracking-wide text-cream-light transition-colors duration-200 hover:bg-chocolate-light"
              >
                {primary.label}
              </Link>
              {secondary && (
                <Link
                  href={secondary.href}
                  className="inline-flex items-center justify-center rounded-md border border-burgundy/25 px-7 py-3.5 font-sans text-[15px] font-semibold tracking-wide text-burgundy transition-colors duration-200 hover:border-burgundy hover:bg-burgundy/[0.04]"
                >
                  {secondary.label}
                </Link>
              )}
            </div>

            {tertiary && (
              <p className="mt-5 font-sans text-[13px] leading-relaxed text-taupe">{tertiary}</p>
            )}
          </div>

          <div className="mx-auto w-full max-w-[420px] lg:mx-0 lg:max-w-none">
            <LandingVisual
              gradient={visual.gradient}
              style={visual.style}
              label={visual.label}
              ratio="aspect-[5/6]"
              className="lg:aspect-auto lg:h-[560px]"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
