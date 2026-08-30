import Link from "next/link";
import { FadeIn } from "./FadeIn";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
  light?: boolean;
  action?: { label: string; href: string };
};

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  centered = true,
  light = false,
  action,
}: SectionHeaderProps) {
  return (
    <div
      className={`mb-8 md:mb-10 ${
        centered
          ? "text-center"
          : "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      }`}
    >
      <div className={centered ? "" : "max-w-xl"}>
        {eyebrow && (
          <FadeIn>
            <p
              className={`font-sans text-[12px] font-semibold tracking-[0.14em] uppercase mb-2.5 ${
                light ? "text-cream/60" : "text-burgundy/50"
              }`}
            >
              {eyebrow}
            </p>
          </FadeIn>
        )}
        <FadeIn delay={100}>
          <h2
            className={`font-serif text-[26px] md:text-[32px] lg:text-[36px] font-medium leading-[1.12] ${
              light ? "text-cream-light" : "text-burgundy"
            }`}
          >
            {title}
          </h2>
        </FadeIn>
        {subtitle && (
          <FadeIn delay={200}>
            <p
              className={`mt-3 font-sans text-[15px] leading-relaxed max-w-xl ${
                centered ? "mx-auto" : ""
              } ${light ? "text-cream/70" : "text-warm-brown"}`}
            >
              {subtitle}
            </p>
          </FadeIn>
        )}
      </div>

      {action && !centered && (
        <FadeIn delay={150}>
          <Link
            href={action.href}
            className={`group inline-flex shrink-0 items-center gap-1.5 font-sans text-[14px] font-semibold pb-0.5 border-b transition-colors ${
              light
                ? "text-cream-light border-cream-light/30 hover:border-cream-light"
                : "text-burgundy border-burgundy/20 hover:border-burgundy"
            }`}
          >
            {action.label}
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </FadeIn>
      )}
    </div>
  );
}
