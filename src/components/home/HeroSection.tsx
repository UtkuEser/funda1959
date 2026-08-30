"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Container } from "@/components/shared/Container";
import { heroSlides } from "@/lib/hero-slides";
import { HeroVisual } from "./HeroVisual";

const AUTOPLAY_MS = 6500;

function Arrow({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={dir === "prev" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
      />
    </svg>
  );
}

export function HeroSection() {
  const count = heroSlides.length;
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
    if (paused || reduced) return;
    const t = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, reduced, next, index]);

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

  const activeTag = heroSlides[index].tag;

  return (
    <section
      className="relative bg-cream-light pt-24 md:pt-32 pb-14 md:pb-20"
      aria-roledescription="carousel"
      aria-label="Funda 1959 öne çıkanlar"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <Container>
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Left — copy (fixed position, crossfades) */}
          <div className="relative min-h-[300px] sm:min-h-[300px] lg:min-h-[352px] max-w-[34rem]">
            {heroSlides.map((slide, i) => {
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
                  <h1 className="font-serif text-[30px] sm:text-[40px] lg:text-[48px] font-semibold text-burgundy leading-[1.1] tracking-[-0.018em]">
                    {slide.headline[0]}
                    <br />
                    {slide.headline[1]}
                  </h1>
                  <p className="mt-6 font-sans text-[16px] md:text-[17px] text-warm-brown leading-relaxed max-w-[27rem]">
                    {slide.text}
                  </p>
                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <Link
                      href={slide.primary.href}
                      tabIndex={isActive ? 0 : -1}
                      className="inline-flex items-center justify-center px-7 py-3.5 rounded-md bg-burgundy text-cream-light font-sans text-[15px] font-semibold tracking-wide hover:bg-chocolate-light transition-colors duration-200"
                    >
                      {slide.primary.label}
                    </Link>
                    <Link
                      href={slide.secondary.href}
                      tabIndex={isActive ? 0 : -1}
                      className="inline-flex items-center justify-center px-7 py-3.5 rounded-md border border-burgundy/25 text-burgundy font-sans text-[15px] font-semibold tracking-wide hover:border-burgundy hover:bg-burgundy/[0.04] transition-colors duration-200"
                    >
                      {slide.secondary.label}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right — visual (crossfade + light zoom) */}
          <div className="relative mx-auto w-full max-w-[360px] sm:max-w-[420px] lg:max-w-none lg:h-[520px]">
            <div className="relative h-full w-full aspect-[4/5] lg:aspect-auto rounded-xl overflow-hidden shadow-[0_34px_80px_-34px_rgba(110,34,48,0.4)]">
              {heroSlides.map((slide, i) => (
                <div
                  key={slide.id}
                  aria-hidden={i !== index}
                  className={`absolute inset-0 transition-all duration-[900ms] ease-out motion-reduce:transition-none motion-reduce:scale-100 ${
                    i === index ? "opacity-100 scale-100" : "opacity-0 scale-[1.035]"
                  }`}
                >
                  <HeroVisual variant={slide.visual} />
                </div>
              ))}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-burgundy/12 via-transparent to-cream-light/10" />
            </div>

            {activeTag && (
              <div
                key={activeTag.value}
                className="absolute -left-4 bottom-8 sm:-left-6 rounded-lg border border-sand-light bg-cream-light px-5 py-3.5 shadow-[0_16px_44px_-16px_rgba(42,35,32,0.32)] animate-fade-in"
              >
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-burgundy/55">
                  {activeTag.label}
                </p>
                <p className="mt-0.5 font-serif text-[15px] font-medium text-burgundy">
                  {activeTag.value}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-9 flex items-center gap-5 lg:mt-11">
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
            {heroSlides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${i + 1}. slayt`}
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
