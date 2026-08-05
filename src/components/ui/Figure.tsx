import Image from "next/image";
import type { ImageAsset, ImageTone } from "@/content/images";
import { Crest, MotifField } from "./Ornament";

type FigureProps = {
  /** Merkezi görsel kaydından gelen alan (src + alt + kadraj + ton). */
  asset: ImageAsset;
  /** Tailwind aspect sınıfı, örn. "aspect-[4/5]". */
  ratio?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Kapsayıcıyı doldurur (oran yerine ebeveyn yüksekliği kullanılır). */
  fill?: boolean;
  /** İnce altın iç çerçeve. */
  framed?: boolean;
  /** Hover'da yakınlaşma. */
  zoom?: boolean;
  /** Fotoğraf yokken künyeyi gizler (çok küçük alanlar için). */
  quiet?: boolean;
};

/** Fotoğraf gelene kadar kullanılan marka yüzeyleri. */
const plates: Record<ImageTone, { surface: string; motif: string; text: string }> = {
  cream: {
    surface: "bg-gradient-to-br from-cream via-cream-2 to-cream-3",
    motif: "text-stone/45",
    text: "text-ink-mute",
  },
  beige: {
    surface: "bg-gradient-to-br from-cream-2 via-cream-3 to-beige",
    motif: "text-gold/40",
    text: "text-ink-soft",
  },
  powder: {
    surface: "bg-gradient-to-br from-powder via-cream-2 to-cream-3",
    motif: "text-bordo/25",
    text: "text-bordo/70",
  },
  stone: {
    surface: "bg-gradient-to-br from-cream-3 via-beige to-stone",
    motif: "text-bordo/20",
    text: "text-ink-soft",
  },
  bordo: {
    surface: "bg-gradient-to-br from-bordo via-bordo-dark to-bordo-dark",
    motif: "text-gold-soft/45",
    text: "text-cream/75",
  },
};

export function Figure({
  asset,
  ratio = "aspect-[4/3]",
  className = "",
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
  fill = false,
  framed = false,
  zoom = false,
  quiet = false,
}: FigureProps) {
  const plate = plates[asset.tone ?? "cream"];
  const box = `overflow-hidden ${fill ? "absolute inset-0" : `relative ${ratio}`} ${className}`;

  if (asset.src) {
    return (
      <div className={`group/fig bg-cream-3 ${box}`}>
        <Image
          src={asset.src}
          alt={asset.alt}
          fill
          sizes={sizes}
          priority={priority}
          style={{ objectPosition: asset.position }}
          className={`object-cover ${
            zoom
              ? "transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
              : ""
          }`}
        />
        {framed ? (
          <span className="pointer-events-none absolute inset-3 z-10 border border-cream/45 sm:inset-4" />
        ) : null}
      </div>
    );
  }

  return (
    <div className={`${plate.surface} ${box}`}>
      <MotifField className={plate.motif} id={asset.alt.slice(0, 12)} />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Crest className={`h-11 w-11 ${plate.motif} opacity-90`} />
        {!quiet ? (
          <>
            <span className={`h-px w-10 bg-current opacity-40 ${plate.text}`} />
            <p
              className={`max-w-[26ch] font-sans text-[11px] uppercase leading-[1.7] tracking-[0.2em] ${plate.text}`}
            >
              {asset.alt}
            </p>
          </>
        ) : null}
      </div>

      <span
        className={`pointer-events-none absolute inset-3 border sm:inset-4 ${
          asset.tone === "bordo" ? "border-cream/25" : "border-gold/35"
        }`}
      />
    </div>
  );
}
