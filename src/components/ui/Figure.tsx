import Image from "next/image";
import type { ImageAsset } from "@/content/images";

type FigureProps = {
  asset: ImageAsset;
  /** Kaydın oranını ezmek için (örn. "3 / 2"). */
  ratio?: string;
  className?: string;
  sizes?: string;
  /** Hero gibi ilk ekranda görünen görseller için. */
  priority?: boolean;
  /** Hover'da çok hafif yakınlaşma. */
  zoom?: boolean;
};

/**
 * Görsel alanı. Fotoğraf yoksa aynı oranda nötr bir yüzey çizer —
 * desen veya motif kullanılmaz, yalnızca sıcak nötr bir zemin.
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
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          style={{ objectPosition: asset.position }}
          className={`object-cover ${
            zoom
              ? "transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              : ""
          }`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(150deg,#efe6d6_0%,#e3d5be_55%,#d6c4a7_100%)] p-6">
          <span className="max-w-[24ch] text-center font-sans text-[12px] uppercase leading-[1.7] tracking-[0.16em] text-ink-soft/70">
            {asset.alt}
          </span>
        </div>
      )}
    </div>
  );
}
