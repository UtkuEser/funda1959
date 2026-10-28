import Image from "next/image";

/**
 * The real Funda 1959 logo (public/logo). `funda_logo_transparent.png` is the
 * original `funda_logo.png` cropped to the artwork, pixels unchanged;
 * `funda_logo_light.png` is the same shape in cream for dark (burgundy)
 * backgrounds. 1885 × 640.
 */
const RATIO = 1885 / 640;

const SRC = {
  default: "/logo/funda_logo_transparent.png",
  light: "/logo/funda_logo_light.png",
} as const;

export function BrandLogo({
  height,
  tone = "default",
  alt = "Funda 1959",
  priority = false,
  className = "",
}: {
  /** the largest display height in px (sets the image request); a class may show it smaller */
  height: number;
  tone?: keyof typeof SRC;
  /** "" when the surrounding link already names it */
  alt?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={SRC[tone]}
      alt={alt}
      width={Math.round(height * RATIO)}
      height={height}
      priority={priority}
      className={`block w-auto max-w-none select-none ${className}`}
      draggable={false}
    />
  );
}

/** The A of "FUNDA" inside the logo, as a share of its width / height (admin login's hidden link). */
export const BRAND_LOGO_A_GLYPH = { left: "80.5%", top: "0.6%", width: "18.8%", height: "61.6%" } as const;
