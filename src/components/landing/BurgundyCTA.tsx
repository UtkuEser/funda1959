import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/shared/Container";
import type { CtaLink } from "./LandingHero";

type BurgundyCTAProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  primary: CtaLink;
  secondary?: CtaLink;
  note?: ReactNode;
};

/** The one deliberate full burgundy band, near the foot of the page. */
export function BurgundyCTA({
  eyebrow,
  title,
  description,
  primary,
  secondary,
  note,
}: BurgundyCTAProps) {
  return (
    <section className="bg-burgundy py-20 md:py-28">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow && (
            <p className="mb-4 font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-cream-light/55">
              {eyebrow}
            </p>
          )}
          <h2 className="font-serif text-[28px] font-semibold leading-[1.15] text-cream-light md:text-[38px]">
            {title}
          </h2>
          {description && (
            <p className="mx-auto mt-4 max-w-lg font-sans text-[15px] leading-relaxed text-cream-light/70 md:text-[16px]">
              {description}
            </p>
          )}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={primary.href}
              className="inline-flex items-center justify-center rounded-md bg-cream-light px-7 py-3.5 font-sans text-[15px] font-semibold tracking-wide text-burgundy transition-colors duration-200 hover:bg-cream"
            >
              {primary.label}
            </Link>
            {secondary && (
              <Link
                href={secondary.href}
                className="inline-flex items-center justify-center rounded-md border border-cream-light/30 px-7 py-3.5 font-sans text-[15px] font-semibold tracking-wide text-cream-light transition-colors duration-200 hover:bg-cream-light/10"
              >
                {secondary.label}
              </Link>
            )}
          </div>

          {note && (
            <p className="mt-6 font-sans text-[13px] text-cream-light/55">{note}</p>
          )}
        </div>
      </Container>
    </section>
  );
}
