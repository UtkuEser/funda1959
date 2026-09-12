import Image from "next/image";
import { getInstagramContentRepository, type InstagramContent } from "@/lib/social";
import { INSTAGRAM_HANDLE, INSTAGRAM_PROFILE_URL } from "@/lib/social/config";
import { resolvePublicAsset } from "@/lib/public-asset";
import { Container } from "@/components/shared/Container";
import { FadeIn } from "@/components/shared/FadeIn";

const CARD_GRADIENTS = [
  "from-[#E8C5A8] to-[#D4A878]",
  "from-[#D8B5A0] to-[#C4A090]",
  "from-[#DCC8B0] to-[#C8B098]",
  "from-[#E8D5C0] to-[#D4C0A8]",
];

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 translate-x-px">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function ReelCard({ item, index }: { item: InstagramContent; index: number }) {
  const poster = resolvePublicAsset(item.posterImage);
  const label = item.title ?? "Funda 1959";

  return (
    <FadeIn
      delay={([0, 100, 200, 300] as const)[index] ?? 0}
      className="w-[78vw] shrink-0 snap-start sm:w-[42%] lg:w-auto lg:shrink"
    >
      <a
        href={item.instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label} — Instagram'da izle`}
        className={`group relative block aspect-[9/16] overflow-hidden rounded-xl bg-gradient-to-br lg:aspect-auto lg:h-[410px] ${CARD_GRADIENTS[index % CARD_GRADIENTS.length]}`}
      >
        {poster && (
          <Image
            src={poster}
            alt={label}
            fill
            sizes="(max-width: 1024px) 78vw, 300px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/55 via-espresso/5 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream-light/90 text-burgundy shadow-sm transition-transform duration-300 group-hover:scale-110">
            <PlayIcon />
          </span>
        </div>
        {item.title && (
          <p className="absolute inset-x-3 bottom-3 font-sans text-[13px] text-cream-light leading-snug">
            {item.title}
          </p>
        )}
      </a>
    </FadeIn>
  );
}

export function InstagramContentSection() {
  const items = getInstagramContentRepository()
    .listPublished()
    .slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section className="bg-cream py-10 md:py-16">
      <Container>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-8">
          <div>
            <FadeIn>
              <h2 className="font-serif text-[26px] md:text-[32px] font-medium text-burgundy leading-[1.12]">
                Funda&apos;dan Kareler
              </h2>
            </FadeIn>
            <FadeIn delay={100}>
              <p className="mt-2 font-sans text-[14px] text-warm-brown leading-relaxed">
                Günlük lezzetlerden Funda&apos;daki küçük anlara.
              </p>
            </FadeIn>
          </div>
          <FadeIn delay={150}>
            <a
              href={INSTAGRAM_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${INSTAGRAM_HANDLE} — Instagram'da bizi takip edin`}
              className="group inline-flex shrink-0 items-center gap-1.5 font-sans text-[14px] font-semibold text-burgundy border-b border-burgundy/20 pb-0.5 transition-colors hover:border-burgundy"
            >
              {INSTAGRAM_HANDLE}&apos;da bizi takip edin
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </a>
          </FadeIn>
        </div>

        <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-0">
          {items.map((item, index) => (
            <ReelCard key={item.id} item={item} index={index} />
          ))}
        </div>
      </Container>
    </section>
  );
}
