import type { ReactNode } from "react";
import { Container } from "@/components/shared/Container";

export type EditorialStep = {
  index: string;
  title: string;
  description?: string;
};

type EditorialStepsProps = {
  eyebrow?: string;
  title: ReactNode;
  intro?: string;
  steps: EditorialStep[];
  background?: "cream" | "cream-light";
};

/**
 * Thin-rule numbered list — used both for the personalisation options and the
 * order-flow timeline. Not cards: each item is just a hairline, a numeral and
 * one line of copy.
 */
export function EditorialSteps({
  eyebrow,
  title,
  intro,
  steps,
  background = "cream",
}: EditorialStepsProps) {
  const cols =
    steps.length >= 5
      ? "lg:grid-cols-5"
      : steps.length === 4
        ? "lg:grid-cols-4"
        : steps.length === 3
          ? "lg:grid-cols-3"
          : "lg:grid-cols-2";

  return (
    <section className={`py-20 md:py-28 ${background === "cream" ? "bg-cream" : "bg-cream-light"}`}>
      <Container>
        <div className="mb-9 max-w-xl md:mb-11">
          {eyebrow && (
            <p className="mb-2.5 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-burgundy/50">
              {eyebrow}
            </p>
          )}
          <h2 className="font-serif text-[26px] font-medium leading-[1.14] text-burgundy md:text-[32px]">
            {title}
          </h2>
          {intro && (
            <p className="mt-3 font-sans text-[15px] leading-relaxed text-warm-brown">{intro}</p>
          )}
        </div>

        <div className={`grid gap-x-8 gap-y-9 sm:grid-cols-2 ${cols}`}>
          {steps.map((step) => (
            <div key={step.index} className="border-t border-sand pt-4">
              <span className="font-serif text-[15px] font-semibold tabular-nums text-burgundy/70">
                {step.index}
              </span>
              <h3 className="mt-1.5 font-sans text-[14.5px] font-semibold text-espresso">
                {step.title}
              </h3>
              {step.description && (
                <p className="mt-1 font-sans text-[13px] leading-relaxed text-warm-brown">
                  {step.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
