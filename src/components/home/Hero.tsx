import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { heroContent } from "@/content/site";
import { images } from "@/content/images";

/**
 * Hero — solda büyük tipografi, sağda medya sahnesi.
 *
 * Medya sahnesi video için ayrılmıştır: `heroContent.video` doldurulduğunda
 * (örn. "/media/hero.mp4") aynı alanda video oynar. Alanın oranı sabit olduğu
 * için video eklendiğinde layout kaymaz.
 */
export function Hero() {
  const poster = images.hero;

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

          {/* Medya sahnesi — video alanı */}
          <div className="lg:col-span-6">
            <div
              className="relative mx-auto w-full max-w-[560px] overflow-hidden border border-stone/45 bg-[linear-gradient(155deg,#f7f0e4_0%,#eadfcc_55%,#dccbb0_100%)] lg:max-h-[56vh] lg:max-w-none"
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
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <span
                    aria-hidden="true"
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-bordo/40 text-bordo"
                  >
                    <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                      <path d="M1 1.2 13 8 1 14.8z" fill="currentColor" opacity="0.85" />
                    </svg>
                  </span>
                  <p className="font-sans text-[13px] uppercase tracking-[0.2em] text-ink-soft">
                    Video gelecek
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
