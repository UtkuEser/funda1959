import type { ReactNode } from "react";
import { Divider } from "./Ornament";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  tone?: "dark" | "light";
  withDivider?: boolean;
  className?: string;
  children?: ReactNode;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "dark",
  withDivider = true,
  className = "",
  children,
}: SectionHeadingProps) {
  const isCenter = align === "center";
  const isLight = tone === "light";

  return (
    <div
      className={`${isCenter ? "mx-auto max-w-2xl text-center" : "max-w-xl text-left"} ${className}`}
    >
      {eyebrow ? (
        <p
          className={`font-sans text-[12px] uppercase tracking-[0.32em] ${
            isLight ? "text-gold-soft" : "text-bordo/75"
          }`}
        >
          {eyebrow}
        </p>
      ) : null}

      <h2
        className={`mt-4 font-serif text-[2rem] leading-[1.15] sm:text-4xl lg:text-[2.9rem] ${
          isLight ? "text-cream" : "text-ink"
        }`}
      >
        {title}
      </h2>

      {withDivider ? (
        <Divider
          tone={isLight ? "cream" : "gold"}
          className={`mt-6 ${isCenter ? "" : "justify-start"}`}
        />
      ) : null}

      {description ? (
        <p
          className={`mt-6 font-sans text-[16px] leading-[1.75] sm:text-[17px] ${
            isLight ? "text-cream/80" : "text-ink-soft"
          }`}
        >
          {description}
        </p>
      ) : null}

      {children}
    </div>
  );
}
