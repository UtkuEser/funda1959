import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { heroContent } from "@/content/site";
import { images } from "@/content/images";

/**
 * Hero — büyük medya sahnesi.
 * Video geldiğinde `heroContent.video` doldurulur ve aynı alan videoyu oynatır.
 * Medya yokken sıcak bir gradient zemin kullanılır; metin rengi buna göre değişir.
 */
export function Hero() {
  const poster = images.hero;
  const hasMedia = Boolean(heroContent.video || poster.src);

  return (
    <section className="relative flex min-h-[82vh] items-end overflow-hidden lg:min-h-[88vh]">
      {/* Medya */}
      <div className="absolute inset-0">
        {heroContent.video ? (
          <video
            className="h-full w-full object-cover"
            src={heroContent.video}
            poster={poster.src}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : poster.src ? (
          <Image
            src={poster.src}
            alt={poster.alt}
            fill
            priority
            sizes="100vw"
            style={{ objectPosition: poster.position }}
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-[linear-gradient(155deg,#fbf8f3_0%,#f0e6d6_40%,#dfcdb2_100%)]" />
        )}

        {hasMedia ? (
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/35 to-ink/15" />
        ) : null}
      </div>

      <Container className="relative pb-20 pt-40 lg:pb-28">
        <div className="max-w-[900px]">
          <p
            className={`t-label font-sans ${hasMedia ? "text-cream/85" : "text-bordo/80"}`}
          >
            {heroContent.eyebrow}
          </p>

          <h1
            className={`t-hero mt-6 max-w-[15ch] font-serif ${
              hasMedia ? "text-cream" : "text-ink"
            }`}
          >
            {heroContent.title}
          </h1>

          <p
            className={`t-lead measure mt-8 ${hasMedia ? "text-cream/90" : "text-ink-soft"}`}
          >
            {heroContent.description}
          </p>

          <div className="mt-11 flex flex-wrap items-center gap-4">
            <Button href="/lezzetler" variant={hasMedia ? "lightSolid" : "solid"}>
              Lezzetleri Keşfet
            </Button>
            <Button href="/subeler" variant={hasMedia ? "light" : "outline"}>
              Şubelerimizi Gör
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
