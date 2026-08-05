import type { ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  id?: string;
  className?: string;
  /** Zemin tonu — sayfa akışında ritim kurar. */
  tone?: "cream" | "cream-2" | "paper" | "bordo";
  spacing?: "default" | "tight" | "loose";
};

const tones = {
  cream: "bg-cream",
  "cream-2": "bg-cream-2",
  paper: "bg-cream surface-paper",
  bordo: "bg-bordo text-cream",
};

const spacings = {
  tight: "py-14 md:py-20",
  default: "py-20 md:py-28 lg:py-32",
  loose: "py-24 md:py-36 lg:py-44",
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
      className={`relative ${tones[tone]} ${spacings[spacing]} ${
        id ? "scroll-mt-36" : ""
      } ${className}`}
    >
      {children}
    </section>
  );
}
