"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { ResolvedHeroSlide } from "@/lib/hero-slides";
import { HeroVisual } from "./HeroVisual";

const AUTOPLAY_MS = 7500;

const pad2 = (n: number) => String(n).padStart(2, "0");

/*
 * Desktop scene (lg+): the photo fills the whole stage — one image, cover-
 * fitted around the slide's focal point, never stretched — and the copy sits
 * on its left. The only overlay is SCENE_LIGHT, the same on every slide.
 *   --stage-h     scene height: 3/4 of the width's photo share (58vw lg, 62vw
 *                 xl), capped so the branch section below stays above the fold
 *                 (76px header + ~204px section), never shorter than the copy
 *   --text-left   copy start = the site container's content edge (header logo)
 *   --text-w      copy width, kept to the left ~44% of the stage
 */
const STAGE_VARS = {
  "--stage-h": "max(460px, min(calc(var(--photo-share) * 0.75), 900px, calc(100svh - 280px)))",
  "--text-left": "max(96px, calc((100% - 1320px) / 2 + 40px))",
  "--text-w": "min(32rem, calc(44% - var(--text-left)))",
} as CSSProperties;

/* A limited warm light behind the copy only: strongest at the far left, gone
   by the end of the copy block — well before the stage's middle and the subject. */
const SCENE_LIGHT = `linear-gradient(to right,
  rgb(248 242 233 / 0.78) 0,
  rgb(248 242 233 / 0.62) calc(var(--text-left) + var(--text-w) * 0.55),
  rgb(248 242 233 / 0.26) calc(var(--text-left) + var(--text-w) * 0.85),
  rgb(248 242 233 / 0) calc(var(--text-left) + var(--text-w) + 2rem))`;

function ArrowRight() {
  return (
    <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M5 12h14M13 6l6 6-6 6" />
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

  // Autoplay is the active progress segment's fill: when it ends, the next
  // slide starts. Pausing (hover/focus) pauses the fill, so bar and timer
  // can't drift apart. Reduced motion: no fill, no autoplay.
  const autoplay = !reduced && count > 1;
  const fill = (axis: "x" | "y", active: boolean): CSSProperties => {
    if (!active) return { transform: axis === "x" ? "scaleX(0)" : "scaleY(0)" };
    if (!autoplay) return {};
    return {
      animation: `hero-fill-${axis} ${AUTOPLAY_MS}ms linear forwards`,
      animationPlayState: paused ? "paused" : "running",
    };
  };

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

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
  };

  return (
    <section
      className="relative bg-cream-light pt-[68px] md:pt-[76px] lg:[--photo-share:58vw] xl:[--photo-share:62vw]"
      style={STAGE_VARS}
      aria-roledescription="carousel"
      aria-label="Funda 1959 öne çıkanlar"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={onKeyDown}
    >
      <div className="relative lg:h-[var(--stage-h)]" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {/* Photo — phones/tablets: its own 4:3 box above the copy; desktop:
            fills the stage behind the copy */}
        <div
          data-hero-photo
          className="relative aspect-[4/3] w-full overflow-hidden bg-cream-dark lg:absolute lg:inset-0 lg:aspect-auto"
        >
          {slides.map((slide, i) => {
            const on = i === index;
            return (
              <div
                key={slide.id}
                aria-hidden={!on}
                className={`absolute inset-0 transition-opacity duration-[1100ms] ease-out motion-reduce:transition-none ${
                  on ? "opacity-100" : "opacity-0"
                }`}
              >
                {slide.media.src ? (
                  <Image
                    src={slide.media.src}
                    alt={slide.media.alt}
                    fill
                    priority={i === 0}
                    sizes="100vw"
                    className="object-cover"
                    style={{ objectPosition: slide.focal }}
                  />
                ) : (
                  <HeroVisual variant={slide.fallbackVisual} />
                )}
              </div>
            );
          })}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{ background: SCENE_LIGHT }}
        />

        {/* Desktop rail — quiet slide number + vertical progress, in the margin */}
        {count > 1 && (
          <div className="absolute inset-y-0 z-10 hidden w-10 -translate-x-1/2 flex-col items-center lg:left-[calc(var(--text-left)-60px)] lg:flex">
            <span aria-hidden className="w-px flex-1 bg-burgundy/15" />
            <p className="py-4 text-center tabular-nums" aria-live="polite">
              <span className="sr-only">Slayt </span>
              <span className="block font-serif text-[17px] font-medium text-burgundy">{pad2(index + 1)}</span>
              <span className="mt-0.5 block font-sans text-[11px] tracking-[0.12em] text-burgundy/45">
                / {pad2(count)}
              </span>
            </p>
            <div className="flex flex-col">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`${i + 1}. slayt: ${slide.eyebrow}`}
                  aria-current={i === index}
                  className="group flex h-12 w-10 items-center justify-center"
                >
                  <span className="relative block h-10 w-[2px] overflow-hidden rounded-full bg-burgundy/25 transition-colors group-hover:bg-burgundy/40">
                    <span
                      key={i === index ? `on-${index}` : "off"}
                      className="absolute inset-0 origin-top bg-burgundy"
                      style={fill("y", i === index)}
                      onAnimationEnd={i === index ? next : undefined}
                    />
                  </span>
                </button>
              ))}
            </div>
            <span aria-hidden className="flex-1" />
          </div>
        )}

        {/* Copy — below the photo on phones/tablets; in the light left part of
            the scene on desktop, clear of the photo's products */}
        <div className="px-5 pb-10 pt-8 sm:px-8 sm:pt-10 lg:absolute lg:inset-y-0 lg:left-[var(--text-left)] lg:flex lg:w-[var(--text-w)] lg:items-center lg:p-0">
          <div className="w-full">
            {/* slides share one grid cell (text and links in separate stacks),
                so every stack is as tall as its longest slide: nothing moves
                between slides */}
            <div className="grid">
              {slides.map((slide, i) => {
                const isActive = i === index;
                return (
                  <div
                    key={slide.id}
                    role="group"
                    aria-roledescription="slayt"
                    aria-label={`${i + 1} / ${count}`}
                    aria-hidden={!isActive}
                    className={`self-start [grid-area:1/1] transition-opacity duration-700 ease-out motion-reduce:transition-none ${
                      isActive ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                  >
                    <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-burgundy/55 xl:text-[11.5px]">
                      {slide.eyebrow}
                    </p>
                    <h1 className="mt-4 font-serif text-[32px] font-semibold leading-[1.04] tracking-[-0.02em] text-burgundy sm:text-[40px] lg:text-[31px] xl:text-[42px] 2xl:text-[46px]">
                      {slide.headline[0]}
                      <br />
                      {slide.headline[1]}
                    </h1>
                    <p className="mt-5 max-w-[28rem] font-sans text-[15.5px] leading-relaxed text-warm-brown sm:text-[16px] lg:text-[15px] xl:text-[16.5px]">
                      {slide.text}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 grid xl:mt-9">
              {slides.map((slide, i) => {
                const isActive = i === index;
                return (
                  <div
                    key={slide.id}
                    aria-hidden={!isActive}
                    className={`flex flex-col items-start gap-5 self-start [grid-area:1/1] transition-opacity duration-700 ease-out motion-reduce:transition-none ${
                      isActive ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                  >
                    <Link
                      href={slide.primary.href}
                      tabIndex={isActive ? 0 : -1}
                      className="inline-flex items-center gap-3 rounded-md bg-burgundy px-6 py-3.5 font-sans text-[14.5px] font-medium tracking-wide text-cream-light transition-colors duration-200 hover:bg-chocolate-light xl:px-7 xl:py-4 xl:text-[15px]"
                    >
                      {slide.primary.label}
                      <ArrowRight />
                    </Link>
                    <Link
                      href={slide.secondary.href}
                      tabIndex={isActive ? 0 : -1}
                      className="group inline-flex items-center gap-2 font-sans text-[14.5px] text-burgundy underline decoration-burgundy/35 underline-offset-[5px] transition-colors hover:decoration-burgundy"
                    >
                      {slide.secondary.label}
                      <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                        <ArrowRight />
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Phone/tablet: the same number + progress, laid horizontally */}
            {count > 1 && (
              <div className="mt-8 flex items-center gap-4 lg:hidden">
                <p className="font-sans text-[12.5px] tabular-nums text-burgundy/55">
                  <span className="font-serif text-[16px] font-medium text-burgundy">{pad2(index + 1)}</span>{" "}
                  / {pad2(count)}
                </p>
                <div className="flex items-center">
                  {slides.map((slide, i) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`${i + 1}. slayt: ${slide.eyebrow}`}
                      aria-current={i === index}
                      className="flex h-11 w-12 items-center px-1"
                    >
                      <span className="relative block h-[2px] w-full overflow-hidden rounded-full bg-burgundy/15">
                        <span
                          key={i === index ? `on-${index}` : "off"}
                          className="absolute inset-0 origin-left bg-burgundy"
                          style={fill("x", i === index)}
                          onAnimationEnd={i === index ? next : undefined}
                        />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
