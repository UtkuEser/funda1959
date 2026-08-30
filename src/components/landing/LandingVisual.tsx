import type { CSSProperties } from "react";

/**
 * Placeholder visual for the celebration / gifting landing pages. Real
 * photography drops in later by swapping this block for an <Image> — the
 * surrounding layout (aspect ratio, border, corner label) stays the same.
 */
export type LandingVisualProps = {
  gradient?: string; // tailwind `from-[..] to-[..]` fragment
  style?: CSSProperties;
  ratio?: string; // aspect-ratio utility, e.g. "aspect-[4/5]"
  label?: { kicker: string; title: string };
  className?: string;
};

export function LandingVisual({
  gradient,
  style,
  ratio = "aspect-[4/5]",
  label,
  className = "",
}: LandingVisualProps) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg border border-sand-light ${ratio} ${
        gradient ? `bg-gradient-to-br ${gradient}` : "bg-cream-dark"
      } ${className}`}
      style={style}
    >
      <div className="absolute inset-0 bg-[radial-gradient(75%_60%_at_30%_22%,rgba(255,255,255,0.34),transparent_66%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-espresso/[0.13] via-transparent to-transparent" />
      {label && (
        <div className="absolute bottom-4 left-4 rounded-md border border-cream-light/45 bg-cream-light/85 px-3 py-2">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-burgundy/60">
            {label.kicker}
          </p>
          <p className="mt-0.5 font-serif text-[13px] font-medium text-burgundy">{label.title}</p>
        </div>
      )}
    </div>
  );
}
