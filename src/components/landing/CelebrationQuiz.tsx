"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/shared/Container";
import { SampleDataNote } from "@/components/delivery/SampleDataNote";
import type { CatalogProduct } from "@/lib/data";
import type { CelebrationRecommendation } from "@/lib/recommendations";
import { CELEBRATION_QUESTIONS, RESULTS_STEP } from "@/lib/celebration-finder";
import { useCelebrationFinder } from "./useCelebrationFinder";

const CAKE_PHOTO = "/home/hero/3.png";
const CAKE_ALT = "Pembe güller ve altın detaylarla süslenmiş iki katlı kutlama pastası";

/** One recommendation: photo, short description, the reasons it matched, actions. */
function RecommendationCard({
  rec,
  offerCustom,
  delay,
  headingTag: Heading,
}: {
  rec: CelebrationRecommendation;
  offerCustom: boolean;
  delay: number;
  headingTag: "h3" | "h4";
}) {
  const { product, label, reasons } = rec;
  return (
    <article
      className="cq-rise flex flex-col overflow-hidden rounded-xl border border-sand-light bg-white/50"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`relative aspect-[4/3] bg-gradient-to-br ${product.gradient}`}>
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span aria-hidden className="absolute inset-0 grid place-items-center font-serif text-6xl text-espresso/15">
            {product.name.charAt(0)}
          </span>
        )}
        <span className="absolute left-3 top-3 rounded-sm bg-cream-light/95 px-2 py-0.5 font-sans text-[11px] font-semibold tracking-wide text-burgundy">
          {label}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <Heading className="font-serif text-[20px] font-semibold leading-snug text-burgundy">{product.name}</Heading>
        <p className="mt-1.5 font-sans text-[13.5px] leading-relaxed text-warm-brown">{product.shortDescription}</p>

        <div className="mt-4 rounded-lg bg-cream/70 px-4 py-3">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-burgundy/65">
            Size neden uygun?
          </p>
          <ul className="mt-1.5 space-y-1">
            {[...new Set(reasons)].map((reason) => (
              <li key={reason} className="flex items-start gap-2 font-sans text-[13px] leading-snug text-espresso">
                <span aria-hidden className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-burgundy/60" />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-5">
          <Link
            href={`/urunler/${product.slug}`}
            className="inline-flex items-center gap-2 rounded-md bg-burgundy px-5 py-2.5 font-sans text-[14px] font-semibold text-cream-light transition-colors hover:bg-chocolate-light"
          >
            Pastayı İncele <span aria-hidden>→</span>
          </Link>
          {offerCustom && (
            <Link
              href="/iletisim"
              className="font-sans text-[13.5px] font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-4 transition-colors hover:decoration-burgundy"
            >
              Özel Tasarım Talep Et
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * The four-question cake finder. One component, two placements:
 *   "page"    — the /ozel-gun hero (page h1, clears the fixed header)
 *   "section" — a home page section (h2, normal section rhythm)
 * Both share `useCelebrationFinder`, so answers carry over between them.
 */
export function CelebrationQuiz({
  products,
  variant = "page",
}: {
  products: CatalogProduct[];
  variant?: "page" | "section";
}) {
  const f = useCelebrationFinder(products);
  const isPage = variant === "page";
  const TitleTag = isPage ? "h1" : "h2";
  const StepTag = isPage ? "h2" : "h3";
  const titleId = `cq-title-${variant}`;

  // after a step change the new question (or results heading) takes focus,
  // and is scrolled into view if it sits under the fixed header or off screen
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!f.interacted) return;
    const el = stepHeadingRef.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    const top = el.getBoundingClientRect().top;
    if (top < 96 || top > window.innerHeight - 120) {
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: window.scrollY + top - 120, behavior: smooth ? "smooth" : "auto" });
    }
  }, [f.step, f.interacted]);

  const chipButtons = (
    <div className="flex flex-wrap items-center gap-1.5">
      {f.chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => f.goToStep(chip.step)}
          disabled={f.isTransitioning}
          aria-label={`${CELEBRATION_QUESTIONS[chip.step].stepLabel}: ${chip.label}. Değiştir`}
          className="rounded-full border border-sand bg-cream-light px-3 py-1 font-sans text-[12.5px] text-warm-brown transition-colors hover:border-burgundy/40 hover:text-burgundy"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );

  return (
    <section aria-labelledby={titleId} className="bg-cream-light">
      <style>{`
        @keyframes cqIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cqOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-7px); } }
        @keyframes cqFade { from { opacity: 0.3; } to { opacity: 1; } }
        @keyframes cqPop { from { opacity: 0; transform: scale(0.4); } to { opacity: 1; transform: scale(1); } }
        @keyframes cqRise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        /* cq-exit is declared after cq-in so it wins the 'animation' shorthand when both classes are present */
        .cq-in { animation: cqIn 240ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        .cq-exit { animation: cqOut 200ms ease-in forwards; }
        .cq-fade { animation: cqFade 300ms ease-out both; }
        .cq-check { animation: cqPop 220ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        .cq-rise { animation: cqRise 440ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .cq-in, .cq-exit, .cq-fade, .cq-check, .cq-rise { animation-duration: 1ms !important; }
        }
      `}</style>

      <Container>
        <div className={isPage ? "pb-12 pt-[calc(68px+1.75rem)] md:pt-[calc(76px+2.25rem)] lg:pb-16" : "py-14 md:py-20"}>
          {/* screen-reader step announcement */}
          <p className="sr-only" role="status" aria-live="polite">
            {f.isResults ? "Önerileriniz hazır." : `Adım ${f.step + 1} / ${RESULTS_STEP}: ${f.title}`}
          </p>

          {!f.isResults && f.question && (
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:gap-14 xl:gap-20">
              {/* ----- left: heading + question flow ----- */}
              <div className="min-w-0">
                <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-burgundy/60">
                  Kutlamalar
                </p>
                <TitleTag
                  id={titleId}
                  className="mt-3 font-serif text-[30px] font-semibold leading-[1.1] tracking-[-0.01em] text-burgundy sm:text-[38px] xl:text-[44px]"
                >
                  Kutlamanıza uygun pastayı
                  <br className="hidden sm:block" /> birlikte bulalım.
                </TitleTag>
                <p className="mt-3 max-w-[30rem] font-sans text-[15px] leading-relaxed text-warm-brown md:text-[16px]">
                  4 kısa soruda size uygun Funda pastalarını gösterelim.
                </p>

                {/* phones/tablets: a slim photo band that never pushes the options off screen */}
                <div className="relative mt-5 h-28 overflow-hidden rounded-xl bg-cream-dark sm:h-40 lg:hidden">
                  <Image
                    src={CAKE_PHOTO}
                    alt={CAKE_ALT}
                    fill
                    sizes="(min-width: 640px) 90vw, 100vw"
                    className="object-cover"
                    style={{ objectPosition: "52% 38%" }}
                  />
                </div>

                <div className="mt-6 lg:mt-7">
                  {/* progress: "1 / 4 · Kutlama Türü" + thin bar */}
                  <div key={`progress-${f.step}`} className="cq-fade flex items-center gap-2 font-sans text-[12.5px] font-semibold" aria-hidden>
                    <span className="tabular-nums text-burgundy">
                      {f.step + 1} / {RESULTS_STEP}
                    </span>
                    <span className="text-burgundy/30">·</span>
                    <span className="text-warm-brown">{f.question.stepLabel}</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label="Soru ilerlemesi"
                    aria-valuemin={1}
                    aria-valuemax={RESULTS_STEP}
                    aria-valuenow={f.step + 1}
                    aria-valuetext={`${f.step + 1} / ${RESULTS_STEP}: ${f.question.stepLabel}`}
                    className="mt-2 h-[3px] w-full max-w-[240px] overflow-hidden rounded-full bg-burgundy/15"
                  >
                    <div
                      className="h-full rounded-full bg-burgundy transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      style={{ width: `${((f.step + 1) / RESULTS_STEP) * 100}%` }}
                    />
                  </div>

                  {/* earlier answers — each one reopens its question */}
                  {f.chips.length > 0 && <div className="mt-3">{chipButtons}</div>}

                  {/* question + options — height kept stable across steps */}
                  <div
                    key={`question-${f.step}`}
                    className={`cq-in mt-5 min-h-[15.5rem] sm:min-h-[12.5rem] ${f.phase === "exiting" ? "cq-exit" : ""}`}
                  >
                    <StepTag
                      ref={stepHeadingRef}
                      tabIndex={-1}
                      className="font-serif text-[22px] font-medium text-burgundy focus:outline-none md:text-[25px]"
                    >
                      {f.title}
                    </StepTag>

                    {(() => {
                      const q = f.question;
                      const gridOptions = q.options.filter((o) => o.variant !== "aside");
                      const asideOptions = q.options.filter((o) => o.variant === "aside");
                      const hasHints = gridOptions.some((o) => o.hint);
                      const cols = hasHints ? "sm:grid-cols-2" : gridOptions.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3";
                      return (
                        <>
                          <div className={`mt-4 grid grid-cols-2 gap-2.5 ${cols} ${f.isTransitioning ? "pointer-events-none" : ""}`}>
                            {gridOptions.map((option) => {
                              const selected = f.currentValue === option.value;
                              const muted = option.variant === "muted";
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  aria-pressed={selected}
                                  onClick={() => f.pick(option.value)}
                                  className={`relative flex min-h-[52px] flex-col justify-center rounded-md border px-3 py-2.5 font-sans transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/40 ${
                                    hasHints ? "items-start pr-7 text-left" : "items-center text-center"
                                  } ${
                                    selected
                                      ? "-translate-y-0.5 scale-[1.02] border-burgundy bg-burgundy/[0.07] text-burgundy shadow-[0_8px_20px_-10px_rgba(110,34,48,0.30)] ring-1 ring-burgundy"
                                      : muted
                                        ? "border-dashed border-sand text-warm-brown hover:border-taupe hover:bg-cream/70"
                                        : "border-sand bg-cream-light text-espresso hover:border-taupe hover:bg-cream/70"
                                  }`}
                                >
                                  {selected && (
                                    <span
                                      aria-hidden
                                      className="cq-check absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-burgundy text-[9px] font-bold leading-none text-cream-light"
                                    >
                                      ✓
                                    </span>
                                  )}
                                  <span className={`text-[13.5px] md:text-[14px] ${selected ? "font-semibold" : muted ? "font-normal" : "font-medium"}`}>
                                    {option.label}
                                  </span>
                                  {option.hint && (
                                    <span className={`mt-0.5 font-sans text-[11.5px] leading-snug ${selected ? "text-burgundy/70" : "text-taupe"}`}>
                                      {option.hint}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {asideOptions.map((option) => {
                            const selected = f.currentValue === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => f.pick(option.value)}
                                className={`mt-3 inline-flex items-center gap-1.5 font-sans text-[13px] transition-colors ${
                                  f.isTransitioning ? "pointer-events-none" : ""
                                } ${
                                  selected
                                    ? "font-semibold text-burgundy"
                                    : "text-warm-brown underline decoration-taupe/40 underline-offset-4 hover:text-burgundy hover:decoration-burgundy"
                                }`}
                              >
                                {selected && (
                                  <span
                                    aria-hidden
                                    className="cq-check flex h-4 w-4 items-center justify-center rounded-full bg-burgundy text-[9px] font-bold leading-none text-cream-light"
                                  >
                                    ✓
                                  </span>
                                )}
                                {option.label} <span aria-hidden>→</span>
                              </button>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>

                  {/* back / forward — a pick advances on its own (re-picking the chosen option too);
                      "İleri" re-advances after going back — /ozel-gun only, the homepage shows just "Geri" */}
                  <div className="mt-5 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={f.goBack}
                      disabled={f.step === 0 || f.isTransitioning}
                      className="inline-flex h-10 items-center rounded-md border border-sand px-4 font-sans text-[13.5px] font-semibold text-warm-brown transition-colors hover:border-burgundy/40 hover:text-burgundy disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ← Geri
                    </button>
                    {isPage && (
                      <button
                        type="button"
                        onClick={f.goForward}
                        disabled={!f.currentValue || f.isTransitioning}
                        className="inline-flex h-10 items-center rounded-md border border-burgundy/30 px-4 font-sans text-[13.5px] font-semibold text-burgundy transition-colors hover:border-burgundy hover:bg-burgundy/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {f.step === RESULTS_STEP - 1 ? "Önerileri Gör →" : "İleri →"}
                      </button>
                    )}
                  </div>

                  <p className="mt-5 font-sans text-[13px] text-warm-brown">
                    Seçim yapmak istemiyor musunuz?{" "}
                    <Link
                      href="/lezzetlerimiz/yas-pastalar"
                      className="font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-4 transition-colors hover:decoration-burgundy"
                    >
                      Tüm pastaları keşfedin →
                    </Link>
                  </p>
                </div>
              </div>

              {/* ----- right (desktop): celebration cake photo, never over the text ----- */}
              <figure
                className={`relative hidden overflow-hidden rounded-2xl bg-cream-dark lg:block ${
                  isPage ? "lg:h-[min(34rem,calc(100svh-11rem))]" : "lg:h-[32rem]"
                }`}
              >
                <Image
                  src={CAKE_PHOTO}
                  alt={CAKE_ALT}
                  fill
                  priority={isPage}
                  sizes="(min-width: 1280px) 520px, 42vw"
                  className="object-cover"
                  style={{ objectPosition: "52% 50%" }}
                />
              </figure>
            </div>
          )}

          {/* ----- results (same area) ----- */}
          {f.isResults && (
            <div key="results" className="cq-in">
              {isPage ? (
                <h1 id={titleId} className="sr-only">
                  Kutlamanıza uygun pastayı birlikte bulalım.
                </h1>
              ) : (
                <h2 id={titleId} className="sr-only">
                  Kutlamalar
                </h2>
              )}
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <div>
                  <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-burgundy/60">
                    {isPage ? "Size Önerilerimiz" : "Kutlamalar · Size Önerilerimiz"}
                  </p>
                  <StepTag
                    ref={stepHeadingRef}
                    tabIndex={-1}
                    className="mt-3 font-serif text-[28px] font-semibold leading-[1.14] text-burgundy focus:outline-none md:text-[36px]"
                  >
                    Kutlamanız için seçtiklerimiz.
                  </StepTag>
                </div>
                <button
                  type="button"
                  onClick={f.editAnswers}
                  className="font-sans text-[13.5px] font-semibold text-burgundy transition-colors hover:text-chocolate-light"
                >
                  ← Seçimleri Değiştir
                </button>
              </div>

              {f.chips.length > 0 && <div className="mt-4">{chipButtons}</div>}

              {f.largeScale && (
                <div className="mt-5 rounded-md border border-burgundy/15 bg-burgundy/[0.03] px-4 py-3">
                  <p className="font-sans text-[13px] leading-relaxed text-warm-brown">
                    Bu ölçekteki kutlamalar için özel planlama öneriyoruz.
                  </p>
                  <Link
                    href="/iletisim"
                    className="mt-1 inline-flex items-center gap-1.5 font-sans text-[13px] font-semibold text-burgundy transition-colors hover:text-chocolate-light"
                  >
                    Özel Tasarım Talep Et <span aria-hidden>→</span>
                  </Link>
                </div>
              )}

              {f.recommendations.length > 0 ? (
                <>
                  <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {f.recommendations.map((rec, i) => (
                      <RecommendationCard
                        key={rec.product.id}
                        rec={rec}
                        offerCustom={f.offerCustom || Boolean(rec.product.customizable)}
                        delay={120 + i * 80}
                        headingTag={isPage ? "h3" : "h4"}
                      />
                    ))}
                  </div>

                  <div className="mt-7 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                    <Link
                      href="/lezzetlerimiz/yas-pastalar"
                      className="inline-flex items-center gap-1.5 border-b border-burgundy/20 pb-0.5 font-sans text-[13.5px] font-semibold text-burgundy transition-colors hover:border-burgundy"
                    >
                      Tüm Özel Gün Pastalarını Gör <span aria-hidden>→</span>
                    </Link>
                    <SampleDataNote about="öneriler, teslimat ve kişiselleştirme bilgileri" />
                  </div>
                </>
              ) : (
                <div className="mt-6 rounded-lg border border-sand-light bg-cream p-6 md:p-8">
                  <p className="font-serif text-[19px] font-medium text-burgundy">Seçimlerinize tam uyan bir ürün bulamadık.</p>
                  <p className="mt-2 max-w-md font-sans text-[14px] leading-relaxed text-warm-brown">
                    Tüm özel gün pastalarını inceleyebilir veya kişiye özel bir sipariş için bizimle iletişime geçebilirsiniz.
                  </p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/lezzetlerimiz/yas-pastalar"
                      className="inline-flex items-center justify-center rounded-md bg-burgundy px-6 py-3 font-sans text-[14px] font-semibold text-cream-light transition-colors hover:bg-chocolate-light"
                    >
                      Tüm Pastaları Gör
                    </Link>
                    <Link
                      href="/iletisim"
                      className="inline-flex items-center justify-center rounded-md border border-burgundy/25 px-6 py-3 font-sans text-[14px] font-semibold text-burgundy transition-colors hover:border-burgundy hover:bg-burgundy/[0.04]"
                    >
                      Özel Tasarım Talep Et
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
