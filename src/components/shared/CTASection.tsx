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
            "linear-gradient(135deg, #2C1A17 0%, #3D2015 50%, #1C1008 100%)",
        }
      : variant === "gold"
      ? {
          background:
            "linear-gradient(135deg, #A87B2F 0%, #C4962A 50%, #B8873A 100%)",
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
              className={`font-sans text-xs tracking-[0.2em] uppercase mb-4 font-semibold ${
                isLight ? "text-gold" : "text-gold"
              }`}
            >
              {eyebrow}
            </p>
          </FadeIn>
        )}
        <FadeIn delay={100}>
          <h2
            className={`font-serif text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight mb-5 ${
              isLight ? "text-cream-light" : "text-chocolate"
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
              className={`px-8 py-4 rounded-xl font-sans font-semibold text-sm tracking-wide transition-all duration-300 ${
                variant === "dark"
                  ? "bg-gold text-espresso hover:bg-gold-light shadow-lg shadow-gold/20"
                  : variant === "gold"
                  ? "bg-espresso text-cream-light hover:bg-chocolate"
                  : "bg-chocolate text-cream-light hover:bg-chocolate-light"
              }`}
            >
              {primaryCta.label}
            </Link>
            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                className={`px-8 py-4 rounded-xl font-sans font-semibold text-sm tracking-wide transition-all duration-300 border ${
                  isLight
                    ? "border-cream-light/25 text-cream-light hover:bg-cream-light/10"
                    : "border-chocolate text-chocolate hover:bg-chocolate hover:text-cream-light"
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
