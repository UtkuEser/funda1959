import { FadeIn } from "./FadeIn";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
  light?: boolean;
};

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  centered = true,
  light = false,
}: SectionHeaderProps) {
  return (
    <div className={`mb-12 ${centered ? "text-center" : ""}`}>
      {eyebrow && (
        <FadeIn>
          <p
            className={`font-sans text-xs font-semibold tracking-[0.2em] uppercase mb-3 ${
              light ? "text-gold-light" : "text-gold"
            }`}
          >
            {eyebrow}
          </p>
        </FadeIn>
      )}
      <FadeIn delay={100}>
        <h2
          className={`font-serif text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight ${
            light ? "text-cream-light" : "text-chocolate"
          }`}
        >
          {title}
        </h2>
      </FadeIn>
      {subtitle && (
        <FadeIn delay={200}>
          <p
            className={`mt-4 font-sans text-base md:text-lg leading-relaxed max-w-2xl ${
              centered ? "mx-auto" : ""
            } ${light ? "text-sand-light" : "text-warm-brown"}`}
          >
            {subtitle}
          </p>
        </FadeIn>
      )}
    </div>
  );
}
