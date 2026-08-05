import Image from "next/image";
import type { StoryImage } from "@/content/storyImages";

type ArchiveFrameProps = {
  image: StoryImage;
  /** Görselin gerçek genişliğine göre tarayıcıya verilen ölçü ipucu. */
  sizes: string;
  /** Kadraj oranı — verilmezse görselin doğal oranı kullanılır. */
  ratio?: string;
  /** İlk ekranda görünen kareler için. */
  priority?: boolean;
  className?: string;
  caption?: string;
};

/**
 * Arşiv çerçevesi — ince koyu kenar, sıcak paspartu ve çok hafif gölge.
 * Müze/arşiv hissi verir; desen veya amblem içermez.
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
      <div className="border border-ink/20 bg-cream-2 p-2.5 shadow-[0_16px_36px_-26px_rgba(42,26,21,0.55)] sm:p-3.5">
        <div
          className="relative overflow-hidden bg-cream-3"
          style={{ aspectRatio: ratio ?? `${image.width} / ${image.height}` }}
        >
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes={sizes}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            style={{ objectPosition: image.objectPosition }}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {caption ? (
        <figcaption className="mt-4 font-sans text-[13px] leading-relaxed text-ink-mute">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
