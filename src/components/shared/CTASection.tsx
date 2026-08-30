import Link from "next/link";
import { FadeIn } from "./FadeIn";

type CTASectionProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  variant?: "dark" | "gold" | "cream";
};

export function CTASection({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  variant = "dark",
}: CTASectionProps) {
  const bgStyle =
    variant === "dark"
      ? {
          background:
            "linear-gradient(140deg, #6E2230 0%, #5A1B27 55%, #3F1720 100%)",
        }
      : variant === "gold"
      ? {
          background:
            "linear-gradient(135deg, #8A6B3B 0%, #9A7B4B 50%, #86673B 100%)",
        }
      : undefined;

  const isLight = variant === "dark" || variant === "gold";

  return (
    <section
      className={`py-16 md:py-20 relative overflow-hidden ${variant === "cream" ? "bg-cream" : ""}`}
      style={bgStyle}
    >
      {variant !== "cream" && (
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 30% 50%, rgba(245, 240, 232, 0.2) 0%, transparent 60%)",
          }}
        />
      )}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {eyebrow && (
          <FadeIn>
            <p
              className={`font-sans text-[13px] tracking-[0.12em] uppercase mb-4 font-semibold ${
                isLight ? "text-gold-light" : "text-gold"
              }`}
            >
              {eyebrow}
            </p>
          </FadeIn>
        )}
        <FadeIn delay={100}>
          <h2
            className={`font-serif text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight mb-5 ${
              isLight ? "text-cream-light" : "text-burgundy"
            }`}
          >
            {title}
          </h2>
        </FadeIn>
        {subtitle && (
          <FadeIn delay={200}>
            <p
              className={`font-sans text-base md:text-lg leading-relaxed mb-8 max-w-2xl mx-auto ${
                isLight ? "text-cream/65" : "text-warm-brown"
              }`}
            >
              {subtitle}
            </p>
          </FadeIn>
        )}
        <FadeIn delay={300}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={primaryCta.href}
              className={`px-8 py-4 rounded-md font-sans font-semibold text-sm tracking-wide transition-colors duration-200 ${
                variant === "dark"
                  ? "bg-cream-light text-burgundy hover:bg-cream"
                  : variant === "gold"
                  ? "bg-espresso text-cream-light hover:bg-charcoal"
                  : "bg-burgundy text-cream-light hover:bg-chocolate-light"
              }`}
            >
              {primaryCta.label}
            </Link>
            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                className={`px-8 py-4 rounded-md font-sans font-semibold text-sm tracking-wide transition-colors duration-200 border ${
                  isLight
                    ? "border-cream-light/30 text-cream-light hover:bg-cream-light/10"
                    : "border-burgundy text-burgundy hover:bg-burgundy hover:text-cream-light"
                }`}
              >
                {secondaryCta.label}
              </Link>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
