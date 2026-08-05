import Image from "next/image";
import type { ImageAsset } from "@/content/images";

type ArchiveFrameProps = {
  image: ImageAsset;
  /** Tarayıcıya verilen ölçü ipucu. */
  sizes: string;
  /** Kadraj oranı — verilmezse görselin doğal oranı kullanılır. */
  ratio?: string;
  /** İlk ekranda görünen kareler için. */
  priority?: boolean;
  className?: string;
  caption?: string;
};

/**
 * Arşiv çerçevesi — koyu sıcak kahve ince kenar, dar paspartu ve yumuşak gölge.
 * Görsel çerçeveden baskındır; desen veya amblem içermez.
 */
export function ArchiveFrame({
  image,
  sizes,
  ratio,
  priority = false,
  className = "",
  caption,
}: ArchiveFrameProps) {
  return (
    <figure className={className}>
      <div className="border border-[#4a352b]/45 bg-cream-2 p-1.5 shadow-[0_18px_40px_-32px_rgba(42,26,21,0.45)] sm:p-2">
        <div
          className="relative overflow-hidden bg-cream-3"
          style={{ aspectRatio: ratio ?? image.ratio ?? "675 / 770" }}
        >
          {image.src ? (
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width ?? 675}
              height={image.height ?? 770}
              sizes={sizes}
              priority={priority}
              loading={priority ? undefined : "lazy"}
              style={{ objectPosition: image.position }}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(155deg,#f7f0e4_0%,#eadfcc_52%,#dccbb0_100%)]">
              <span className="absolute inset-x-0 bottom-0 px-4 pb-4 font-sans text-[13px] uppercase tracking-[0.14em] text-ink-mute">
                {image.alt}
              </span>
            </div>
          )}
        </div>
      </div>

      {caption ? (
        <figcaption className="mt-3 font-sans text-[13px] leading-relaxed text-ink-mute">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
