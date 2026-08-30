import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { LandingVisual, type LandingVisualProps } from "./LandingVisual";
import type { CtaLink } from "./LandingHero";

type SplitFeature = { title: string; description?: string };

type EditorialSplitProps = {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  body: string | string[];
  cta?: CtaLink;
  features?: SplitFeature[];
  visual: Pick<LandingVisualProps, "gradient" | "style" | "label">;
  visualSide?: "left" | "right";
  background?: "cream" | "cream-light";
};

/**
 * Two-column editorial band: copy on one side, a visual placeholder on the
 * other. Backs the brand-story and corporate-gifts sections.
 */
export function EditorialSplit({
  id,
  eyebrow,
  title,
  body,
  cta,
  features,
  visual,
  visualSide = "right",
  background = "cream",
}: EditorialSplitProps) {
  const paragraphs = Array.isArray(body) ? body : [body];

  return (
    <section
      id={id}
      className={`scroll-mt-24 py-20 md:py-28 ${background === "cream" ? "bg-cream" : "bg-cream-light"}`}
    >
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className={visualSide === "left" ? "lg:order-2" : ""}>
            {eyebrow && (
              <p className="mb-2.5 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-burgundy/50">
                {eyebrow}
              </p>
            )}
            <h2 className="font-serif text-[24px] font-medium leading-[1.16] text-burgundy md:text-[30px]">
              {title}
            </h2>
            <div className="mt-4 space-y-3">
              {paragraphs.map((p, i) => (
                <p key={i} className="font-sans text-[15px] leading-relaxed text-warm-brown">
                  {p}
                </p>
              ))}
            </div>

            {features && features.length > 0 && (
              <div className="mt-7 grid gap-x-6 gap-y-4 sm:grid-cols-3">
                {features.map((f) => (
                  <div key={f.title} className="border-t border-sand pt-3">
                    <p className="font-sans text-[13.5px] font-semibold text-espresso">{f.title}</p>
                    {f.description && (
                      <p className="mt-1 font-sans text-[12.5px] leading-relaxed text-warm-brown">
                        {f.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {cta && (
              <Link
                href={cta.href}
                className="mt-7 inline-flex items-center gap-1.5 border-b border-burgundy/20 pb-0.5 font-sans text-[14px] font-semibold text-burgundy transition-colors hover:border-burgundy"
              >
                {cta.label}
                <span aria-hidden>→</span>
              </Link>
            )}
          </div>

          <div className={visualSide === "left" ? "lg:order-1" : ""}>
            <LandingVisual
              gradient={visual.gradient}
              style={visual.style}
              label={visual.label}
              ratio="aspect-[4/5]"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
