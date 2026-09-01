"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Container } from "@/components/shared/Container";
import type { ResolvedHeroSlide } from "@/lib/hero-slides";
import { HeroVisual } from "./HeroVisual";

const AUTOPLAY_MS = 7500;

function Arrow({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.9}
        d={dir === "prev" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
      />
    </svg>
  );
}

export function HeroSection({ slides }: { slides: ResolvedHeroSlide[] }) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const touchX = useRef<number | null>(null);

  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || reduced || count < 2) return;
    const t = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, reduced, next, index, count]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchX.current;
    if (delta < -44) next();
    else if (delta > 44) prev();
    touchX.current = null;
  };

  const activeSignature = slides[index]?.signature;

  return (
    <section
      className="relative bg-cream-light pt-24 md:pt-28 pb-14 md:pb-20"
      aria-roledescription="carousel"
      aria-label="Funda 1959 öne çıkanlar"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <Container>
        <div
          className="grid grid-cols-1 items-center gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] lg:gap-16"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Left — copy (fixed position, crossfades) */}
          <div className="relative min-h-[326px] max-w-[35rem] sm:min-h-[336px] lg:min-h-[372px]">
            {slides.map((slide, i) => {
              const isActive = i === index;
              return (
                <div
                  key={slide.id}
                  role="group"
                  aria-roledescription="slayt"
                  aria-label={`${i + 1} / ${count}`}
                  aria-hidden={!isActive}
                  className={`transition-opacity duration-700 ease-out motion-reduce:transition-none ${
                    isActive
                      ? "relative opacity-100"
                      : "pointer-events-none absolute inset-0 opacity-0"
                  }`}
                >
                  <p className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.2em] text-burgundy/55">
                    {slide.eyebrow}
                  </p>
                  <h1 className="mt-3.5 font-serif text-[31px] font-semibold leading-[1.08] tracking-[-0.02em] text-burgundy sm:text-[40px] lg:text-[49px]">
                    {slide.headline[0]}
                    <br />
                    {slide.headline[1]}
                  </h1>
                  <p className="mt-5 max-w-[27rem] font-sans text-[15.5px] leading-relaxed text-warm-brown md:text-[16.5px]">
                    {slide.text}
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={slide.primary.href}
                      tabIndex={isActive ? 0 : -1}
                      className="inline-flex items-center justify-center rounded-md bg-burgundy px-7 py-3.5 font-sans text-[15px] font-semibold tracking-wide text-cream-light transition-colors duration-200 hover:bg-chocolate-light"
                    >
                      {slide.primary.label}
                    </Link>
                    <Link
                      href={slide.secondary.href}
                      tabIndex={isActive ? 0 : -1}
                      className="inline-flex items-center justify-center rounded-md border border-burgundy/25 px-7 py-3.5 font-sans text-[15px] font-semibold tracking-wide text-burgundy transition-colors duration-200 hover:border-burgundy hover:bg-burgundy/[0.04]"
                    >
                      {slide.secondary.label}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right — visual (photo crossfade + subtle settle) */}
          <div className="relative mx-auto w-full max-w-[420px] sm:max-w-[460px] lg:max-w-none">
            <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl bg-cream-dark shadow-[0_40px_90px_-40px_rgba(110,34,48,0.45)] ring-1 ring-espresso/[0.06] sm:aspect-[4/5] lg:aspect-auto lg:h-[560px]">
              {slides.map((slide, i) => {
                const on = i === index;
                return (
                  <div
                    key={slide.id}
                    aria-hidden={!on}
                    className={`absolute inset-0 transition-[opacity,transform] duration-[1100ms] ease-out motion-reduce:transition-none motion-reduce:transform-none ${
                      on ? "scale-100 opacity-100" : "scale-[1.045] opacity-0"
                    }`}
                  >
                    {slide.media.src ? (
                      <Image
                        src={slide.media.src}
                        alt={slide.media.alt}
                        fill
                        priority={i === 0}
                        sizes="(max-width: 1024px) 92vw, 600px"
                        className="object-cover"
                      />
                    ) : (
                      <HeroVisual variant={slide.fallbackVisual} />
                    )}
                  </div>
                );
              })}

              {/* legibility + depth */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-espresso/30 via-espresso/[0.04] to-transparent" />
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-cream-light/10" />

              {/* quiet collection wordmark */}
              <span className="pointer-events-none absolute bottom-3.5 right-4 font-sans text-[10.5px] font-semibold uppercase tracking-[0.24em] text-cream-light/60">
                Funda · 1959
              </span>
            </div>

            {/* signature card — only when the slide actually has one */}
            {activeSignature && (
              <div
                key={activeSignature.value}
                className="animate-fade-in absolute -left-3 bottom-7 rounded-xl border border-cream-light/55 bg-cream-light/80 px-5 py-3.5 shadow-[0_20px_50px_-18px_rgba(42,35,32,0.4)] backdrop-blur-md sm:-left-6"
              >
                <p className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-burgundy/55">
                  {activeSignature.label}
                </p>
                <p className="mt-0.5 font-serif text-[15px] font-medium text-burgundy">
                  {activeSignature.value}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center gap-5 lg:mt-11">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              aria-label="Önceki slayt"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-burgundy/20 text-burgundy transition-colors hover:bg-burgundy hover:text-cream-light"
            >
              <Arrow dir="prev" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Sonraki slayt"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-burgundy/20 text-burgundy transition-colors hover:bg-burgundy hover:text-cream-light"
            >
              <Arrow dir="next" />
            </button>
          </div>

          <span className="font-sans text-[13px] font-medium tabular-nums text-burgundy/60">
            {String(index + 1).padStart(2, "0")}
            <span className="text-burgundy/30"> / {String(count).padStart(2, "0")}</span>
          </span>

          <div className="flex items-center gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${i + 1}. slayt: ${slide.eyebrow}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-7 bg-burgundy" : "w-1.5 bg-burgundy/25 hover:bg-burgundy/45"
                }`}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
