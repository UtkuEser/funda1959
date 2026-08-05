import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { heroContent } from "@/content/site";
import { images } from "@/content/images";

/**
 * Hero — solda büyük tipografi, sağda medya sahnesi.
 *
 * Medya sahnesi video için hazırdır: `heroContent.video` doldurulduğunda aynı
 * alanda video oynar. Video gelene kadar arşivden bir kare poster olarak durur.
 * Alanın oranı sabit olduğu için video eklendiğinde layout kaymaz.
 */
export function Hero() {
  const poster = images.hero.src ? images.hero : images.arsiv1;

  return (
    <section className="relative overflow-hidden bg-cream">
      {/* sıcak zemin geçişi */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(140deg,#fbf8f3_0%,#f4ecdf_55%,#e7dac4_100%)]"
      />

      <Container className="relative">
        <div className="grid min-h-[82vh] items-center gap-12 pb-16 pt-32 lg:min-h-[84vh] lg:grid-cols-12 lg:gap-16 lg:pb-20 lg:pt-36">
          {/* Metin */}
          <div className="lg:col-span-6">
            <p className="t-label font-sans text-bordo/80">{heroContent.eyebrow}</p>

            <h1 className="t-hero mt-7 max-w-[13ch] font-serif text-ink">
              {heroContent.title}
            </h1>

            <p className="t-lead measure mt-8 text-ink-soft">{heroContent.description}</p>

            <div className="mt-11 flex flex-wrap items-center gap-4">
              <Button href="/lezzetler">Lezzetleri Keşfet</Button>
              <Button href="/subeler" variant="outline">
                Şubelerimizi Gör
              </Button>
            </div>
          </div>

          {/* Medya sahnesi */}
          <div className="lg:col-span-6">
            <div
              className="relative mx-auto w-full max-w-[560px] overflow-hidden bg-cream-3 shadow-[0_30px_70px_-45px_rgba(42,26,21,0.6)] lg:max-h-[56vh] lg:max-w-none"
              style={{ aspectRatio: "4 / 5" }}
            >
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
              ) : (
                <Image
                  src={poster.src as string}
                  alt={poster.alt}
                  width={poster.width ?? 675}
                  height={poster.height ?? 770}
                  sizes="(max-width: 1024px) 92vw, 560px"
                  priority
                  style={{ objectPosition: poster.position }}
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            <p className="mt-4 font-sans text-[13px] text-ink-mute">
              Funda 1959 arşivinden
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
