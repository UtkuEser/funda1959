import type { CSSProperties } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Figure } from "@/components/ui/Figure";
import { Divider, OrnamentBand } from "@/components/ui/Ornament";
import { brandLines, heroContent, site } from "@/content/site";
import { images } from "@/content/images";

const rise = (delay: number) => ({ "--rise-delay": `${delay}ms` }) as CSSProperties;

/**
 * Hero — tam genişlikte medya sahnesi.
 * Video hazır olduğunda `heroContent.video` doldurulur; görsel poster olarak kalır.
 */
export function Hero() {
  const media = images.hero;
  /** Fotoğraf/video geldiğinde okunabilirlik katmanı güçlenir. */
  const hasMedia = Boolean(heroContent.video || media.src);

  return (
    <section className="relative">
      <div className="relative flex min-h-[88vh] items-end overflow-hidden md:min-h-[92vh]">
        {/* Medya — video ya da fotoğraf; ikisi de yokken marka yüzeyi */}
        {heroContent.video ? (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={heroContent.video}
            poster={media.src}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <Figure asset={media} fill priority sizes="100vw" quiet />
        )}

        {/* Okunabilirlik katmanları */}
        <div
          className={`absolute inset-0 ${
            hasMedia ? "bg-bordo-dark/50 mix-blend-multiply" : "bg-bordo-dark/15"
          }`}
        />
        <div
          className={`absolute inset-0 ${
            hasMedia
              ? "bg-gradient-to-t from-ink/85 via-ink/35 to-ink/55"
              : "bg-gradient-to-t from-ink/55 via-transparent to-ink/25"
          }`}
        />

        {/* İnce iç çerçeve */}
        <div className="pointer-events-none absolute inset-4 border border-cream/25 sm:inset-6 lg:inset-10" />

        {/* İçerik */}
        <Container className="relative pb-20 pt-40 md:pb-28">
          <div className="mx-auto max-w-3xl text-center">
            <p
              className="animate-rise font-sans text-[12px] uppercase tracking-[0.42em] text-cream/85"
              style={rise(0)}
            >
              {heroContent.eyebrow}
            </p>

            <h1
              className="animate-rise mt-7 font-serif text-[2.9rem] leading-[1.02] text-cream sm:text-[4.2rem] lg:text-[5rem]"
              style={rise(110)}
            >
              {heroContent.title}
            </h1>

            <div className="animate-rise mt-8" style={rise(190)}>
              <Divider tone="cream" className="opacity-80" />
            </div>

            <p
              className="animate-rise mx-auto mt-8 max-w-xl font-sans text-[17px] leading-[1.8] text-cream/85"
              style={rise(250)}
            >
              {heroContent.description}
            </p>

            <div
              className="animate-rise mt-11 flex flex-wrap items-center justify-center gap-5"
              style={rise(330)}
            >
              <Link
                href="/lezzetler"
                className="inline-flex items-center justify-center border border-cream/70 px-9 py-4 font-sans text-[12px] uppercase tracking-[0.24em] text-cream transition-colors duration-300 hover:bg-cream hover:text-bordo"
              >
                Lezzetleri Keşfet
              </Link>
              <Link
                href="/subeler"
                className="inline-flex items-center justify-center border border-transparent bg-cream/95 px-9 py-4 font-sans text-[12px] uppercase tracking-[0.24em] text-bordo transition-colors duration-300 hover:bg-gold-soft"
              >
                Şubelerimizi Gör
              </Link>
            </div>
          </div>
        </Container>

        {/* Alt bilgi şeridi */}
        <div className="absolute inset-x-0 bottom-0 hidden border-t border-cream/20 md:block">
          <Container>
            <div className="flex items-center justify-between py-4 font-sans text-[11px] uppercase tracking-[0.26em] text-cream/75">
              <span>{heroContent.meta[0]}</span>
              <span className="hidden lg:inline">{site.tagline}</span>
              <span>{heroContent.meta[1]}</span>
            </div>
          </Container>
        </div>
      </div>

      {/* Hero altı motif ayracı ve marka cümleleri */}
      <div className="border-b border-stone/30 bg-cream">
        <OrnamentBand id="hero" height={28} className="opacity-90" />
        <Container>
          <ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-3 pb-6 pt-4 lg:justify-between">
            {brandLines.map((line, index) => (
              <li key={line} className="flex items-center gap-12">
                {index > 0 ? (
                  <span aria-hidden="true" className="hidden h-3.5 w-px bg-stone/60 lg:block" />
                ) : null}
                <span className="font-serif text-[18px] text-ink-soft sm:text-[19px]">{line}</span>
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </section>
  );
}
