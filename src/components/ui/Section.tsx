import type { ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  id?: string;
  className?: string;
  tone?: "cream" | "cream-2" | "sand" | "bordo";
  spacing?: "default" | "tight";
};

const tones = {
  cream: "bg-cream",
  "cream-2": "bg-cream-2",
  sand: "bg-cream-3",
  bordo: "bg-bordo text-cream",
};

const spacings = {
  /* 96 → 140px */
  default: "py-24 md:py-28 lg:py-[8.75rem]",
  tight: "py-16 md:py-20 lg:py-24",
};

export function Section({
  children,
  id,
  className = "",
  tone = "cream",
  spacing = "default",
}: SectionProps) {
  return (
    <section
      id={id}
      className={`${tones[tone]} ${spacings[spacing]} ${id ? "scroll-mt-24" : ""} ${className}`}
    >
      {children}
    </section>
  );
}
