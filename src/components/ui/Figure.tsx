import Image from "next/image";
import type { ImageAsset } from "@/content/images";

type FigureProps = {
  asset: ImageAsset;
  /** Kaydın oranını ezmek için (örn. "3 / 2"). */
  ratio?: string;
  className?: string;
  sizes?: string;
  /** İlk ekranda görünen görseller için. */
  priority?: boolean;
  /** Hover'da çok hafif yakınlaşma (maks. 1.03). */
  zoom?: boolean;
};

/**
 * Görsel alanı. Fotoğraf yoksa aynı oranda sıcak nötr bir yüzey çizer —
 * desen, motif veya amblem kullanılmaz.
 */
export function Figure({
  asset,
  ratio,
  className = "",
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
  zoom = false,
}: FigureProps) {
  const aspect = ratio ?? asset.ratio ?? "4 / 3";

  return (
    <div
      className={`relative overflow-hidden bg-cream-3 ${className}`}
      style={{ aspectRatio: aspect }}
    >
      {asset.src ? (
        <Image
          src={asset.src}
          alt={asset.alt}
          width={asset.width ?? 1600}
          height={asset.height ?? 1200}
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          style={{ objectPosition: asset.position }}
          className={`h-full w-full object-cover ${
            zoom ? "transition-transform duration-700 ease-out group-hover:scale-[1.03]" : ""
          }`}
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(155deg,#f7f0e4_0%,#eadfcc_52%,#dccbb0_100%)]">
          <span className="absolute inset-x-0 bottom-0 px-5 pb-5 font-sans text-[12px] uppercase tracking-[0.14em] text-ink-mute/80">
            {asset.alt}
          </span>
        </div>
      )}
    </div>
  );
}
