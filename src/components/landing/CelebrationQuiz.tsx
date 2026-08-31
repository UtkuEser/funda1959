"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { ProductGridCard } from "@/components/catalog/ProductGridCard";
import type { CatalogProduct } from "@/lib/data";
import {
  getCelebrationRecommendations,
  needsCustomPlanning,
  type CelebrationAnswers,
} from "@/lib/recommendations";

type AnswerKey = keyof CelebrationAnswers;
type Option = {
  value: string;
  label: string;
  /** one-line helper shown under the label */
  hint?: string;
  /** shorter label for the breadcrumb summary */
  short?: string;
  /** "muted" = lower visual weight in the grid; "aside" = rendered below the grid */
  variant?: "muted" | "aside";
};
type Question = { key: AnswerKey; stepLabel: string; title: string; options: Option[] };

/**
 * Micro-interaction timings (ms). On a pick: the selected card is acknowledged,
 * then the current question animates out, then the next one animates in.
 */
const ACK_MS = 190; // selected state held before the exit starts
const EXIT_MS = 200; // current question fades/slides out

const QUESTIONS: Question[] = [
  {
    key: "occasion",
    stepLabel: "Kutlama Türü",
    title: "Hangi günü kutluyoruz?",
    options: [
      { value: "dogum-gunu", label: "Doğum Günü" },
      { value: "nisan-soz", label: "Nişan & Söz" },
      { value: "dugun", label: "Düğün" },
      { value: "yildonumu", label: "Yıldönümü" },
      { value: "ozel-davet", label: "Özel Davet" },
      { value: "kurumsal", label: "Kurumsal Kutlama" },
    ],
  },
  {
    key: "serving",
    stepLabel: "Kişi Sayısı",
    title: "Kaç kişi olacaksınız?",
    options: [
      { value: "2-4", label: "2–4 kişi" },
      { value: "6-8", label: "6–8 kişi" },
      { value: "10-15", label: "10–15 kişi" },
      { value: "20+", label: "20+ kişi" },
      {
        value: "unknown",
        label: "Kişi sayısı henüz net değil",
        short: "Kişi sayısı belirsiz",
        variant: "aside",
      },
    ],
  },
  {
    key: "flavor",
    stepLabel: "Lezzet",
    title: "Hangi lezzet size daha yakın?",
    options: [
      { value: "cikolatali", label: "Çikolatalı" },
      { value: "meyveli", label: "Meyveli" },
      { value: "fistikli", label: "Fıstıklı / Kuruyemişli" },
      { value: "hafif", label: "Daha Hafif" },
      {
        value: "any",
        label: "Kararsızım, Funda seçsin",
        short: "Funda seçsin",
        variant: "muted",
      },
    ],
  },
  {
    key: "style",
    stepLabel: "Tasarım",
    title: "Nasıl bir pasta hayal ediyorsunuz?",
    options: [
      { value: "sade", label: "Sade & Zarif", hint: "Minimal detaylar" },
      { value: "klasik", label: "Klasik", hint: "Zamansız Funda çizgisi" },
      { value: "gosterisli", label: "Gösterişli", hint: "Kutlamanın odağında" },
      { value: "kisiye-ozel", label: "Kişiye Özel Tasarım", hint: "Size göre hazırlanır" },
      {
        value: "any",
        label: "Tasarımı Funda'ya bırak",
        short: "Funda seçsin",
        variant: "muted",
      },
    ],
  },
];

const EMPTY: CelebrationAnswers = { occasion: null, serving: null, flavor: null, style: null };
const RESULTS_STEP = QUESTIONS.length;

/** Light copy adaptation based on the first answer (spec: copy only, not options). */
function questionTitle(q: Question, answers: CelebrationAnswers): string {
  if (q.key === "style" && answers.occasion === "kurumsal") {
    return "Nasıl bir sunum düşünüyorsunuz?";
  }
  return q.title;
}

function optionShortLabel(q: Question, value: string | null): string | undefined {
  if (!value) return undefined;
  const opt = q.options.find((o) => o.value === value);
  return opt?.short ?? opt?.label;
}

type Phase = "idle" | "acknowledge" | "exiting";

export function CelebrationQuiz({ products }: { products: CatalogProduct[] }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<CelebrationAnswers>(EMPTY);
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  // Selection is being processed — lock further input and the back action.
  const isTransitioning = phase !== "idle";

  const isResults = step === RESULTS_STEP;
  const question = QUESTIONS[step];
  const currentValue = question ? answers[question.key] : null;
  const title = question ? questionTitle(question, answers) : "";

  const recommendations = useMemo(
    () => (isResults ? getCelebrationRecommendations(products, answers) : []),
    [isResults, products, answers],
  );
  const largeScale = isResults && needsCustomPlanning(answers);

  // full answer summary on the result screen — keyed by question so two answers
  // that share a short label (e.g. both "Funda seçsin") stay unique.
  const summaryChips = useMemo(
    () =>
      QUESTIONS.map((q) => ({ key: q.key, label: optionShortLabel(q, answers[q.key]) })).filter(
        (c): c is { key: AnswerKey; label: string } => Boolean(c.label),
      ),
    [answers],
  );

  // breadcrumb trail of answers made *before* the current step (shown from step 2)
  const summaryTrail = useMemo(
    () =>
      QUESTIONS.slice(0, step)
        .map((q) => ({ key: q.key, label: optionShortLabel(q, answers[q.key]) }))
        .filter((c): c is { key: AnswerKey; label: string } => Boolean(c.label)),
    [answers, step],
  );

  const pick = (value: string) => {
    if (!question || isTransitioning) return; // guard against fast / double clicks
    setAnswers((prev) => ({ ...prev, [question.key]: value }));
    setPhase("acknowledge");
    // analytics: quiz_step_completed { step, key: question.key, value }
    clearTimers();
    timers.current.push(
      // 1) hold the strong selected state, then start the exit
      setTimeout(() => setPhase("exiting"), ACK_MS),
      // 2) after the exit, swap in the next question (it plays its enter anim)
      setTimeout(() => {
        setStep((s) => s + 1); // last step -> RESULTS_STEP (analytics: quiz_completed)
        setPhase("idle");
      }, ACK_MS + EXIT_MS),
    );
  };

  const goBack = () => {
    if (isTransitioning) return;
    clearTimers();
    setStep((s) => Math.max(0, s - 1)); // answers are kept — previous choice stays selected
  };

  // back to the first question with every answer preserved for quick edits
  const editAnswers = () => {
    clearTimers();
    setPhase("idle");
    setStep(0);
  };

  return (
    <section className="relative overflow-hidden bg-cream-light">
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

      {/* low-opacity 1959 watermark — decorative only, no cake placeholder */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -right-2 select-none font-serif text-[42vw] font-semibold leading-none text-burgundy/[0.04] md:text-[280px]"
      >
        1959
      </span>

      <Container>
        <div className="relative mx-auto flex min-h-[calc(100dvh-68px)] max-w-[960px] flex-col justify-center py-14 pt-24 md:min-h-[calc(100dvh-76px)] md:py-16 md:pt-28 lg:max-h-[880px]">
          {/* screen-reader step announcement */}
          <p className="sr-only" role="status" aria-live="polite">
            {isResults
              ? "Önerileriniz hazır."
              : `Adım ${step + 1} / ${QUESTIONS.length}: ${title}`}
          </p>

          {isResults ? (
            /* keep the page h1 present for SEO even on the result view */
            <h1 className="sr-only">Kutlamanıza uygun pastayı birlikte bulalım.</h1>
          ) : (
            <div className="max-w-[40rem]">
              <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-burgundy/55">
                Özel Gün Pastaları
              </p>
              <h1 className="mt-3 font-serif text-[29px] font-semibold leading-[1.12] text-espresso sm:text-[38px] lg:text-[44px]">
                Kutlamanıza uygun pastayı
                <br className="hidden sm:block" /> birlikte bulalım.
              </h1>
              {step === 0 && (
                <p className="mt-4 max-w-[32rem] font-sans text-[15px] leading-relaxed text-warm-brown md:text-[16px]">
                  4 kısa soruda size uygun Funda seçeneklerini gösterelim.
                </p>
              )}
            </div>
          )}

          {/* ----- quiz ----- */}
          {!isResults && question && (
            <div className="mt-7 md:mt-9">
              {/* progress: "1 / 4 · Kişi Sayısı" + a very thin animated line */}
              <div
                key={`progress-${step}`}
                className="cq-fade flex items-center gap-2 font-sans text-[12px] font-semibold"
                aria-hidden
              >
                <span className="tabular-nums text-burgundy">
                  {step + 1} / {QUESTIONS.length}
                </span>
                <span className="text-burgundy/30">·</span>
                <span className="tracking-[0.02em] text-warm-brown">{question.stepLabel}</span>
              </div>
              <div className="mt-2 h-[2px] w-full max-w-[220px] overflow-hidden rounded-full bg-burgundy/15">
                <div
                  className="h-full rounded-full bg-burgundy transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
                />
              </div>

              {/* breadcrumb of earlier answers (from question 2) */}
              {summaryTrail.length > 0 && (
                <p className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-sans text-[12px] text-taupe">
                  {summaryTrail.map((chip, i) => (
                    <span key={chip.key} className="inline-flex items-center gap-1.5">
                      {i > 0 && <span aria-hidden>·</span>}
                      <span>{chip.label}</span>
                    </span>
                  ))}
                </p>
              )}

              {/* question + options — swaps inside the hero; height kept stable */}
              <div
                key={`question-${step}`}
                className={`cq-in mt-5 min-h-[19rem] sm:min-h-[16rem] ${
                  phase === "exiting" ? "cq-exit" : ""
                }`}
              >
                <h2 className="font-serif text-[22px] font-medium text-burgundy md:text-[26px]">
                  {title}
                </h2>

                {(() => {
                  const gridOptions = question.options.filter((o) => o.variant !== "aside");
                  const asideOptions = question.options.filter((o) => o.variant === "aside");
                  const hasHints = gridOptions.some((o) => o.hint);
                  return (
                    <>
                      <div
                        className={`mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 ${
                          isTransitioning ? "pointer-events-none" : ""
                        }`}
                      >
                        {gridOptions.map((option) => {
                          const selected = currentValue === option.value;
                          const muted = option.variant === "muted";
                          return (
                            <button
                              key={option.value}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => pick(option.value)}
                              className={`relative flex min-h-[52px] flex-col justify-center rounded-md border px-3 py-2.5 font-sans transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out will-change-transform ${
                                hasHints ? "items-start pr-7 text-left" : "items-center text-center"
                              } ${
                                selected
                                  ? "-translate-y-0.5 scale-[1.02] border-burgundy bg-burgundy/[0.07] text-burgundy shadow-[0_8px_20px_-10px_rgba(110,34,48,0.30)] ring-1 ring-burgundy"
                                  : muted
                                    ? "border-dashed border-sand text-warm-brown hover:border-taupe hover:bg-cream/70"
                                    : "border-sand text-espresso hover:border-taupe hover:bg-cream/70"
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
                              <span
                                className={`text-[13.5px] md:text-[14px] ${
                                  selected ? "font-semibold" : muted ? "font-normal" : "font-medium"
                                }`}
                              >
                                {option.label}
                              </span>
                              {option.hint && (
                                <span
                                  className={`mt-0.5 font-sans text-[11.5px] leading-snug ${
                                    selected ? "text-burgundy/70" : "text-taupe"
                                  }`}
                                >
                                  {option.hint}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {asideOptions.map((option) => {
                        const selected = currentValue === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => pick(option.value)}
                            className={`mt-3 inline-flex items-center gap-1.5 font-sans text-[13px] transition-colors ${
                              isTransitioning ? "pointer-events-none" : ""
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

              {/* only "← Geri" — no forward CTA, the quiz auto-advances */}
              <div className="mt-6 min-h-[1.5rem]">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={isTransitioning}
                    className="font-sans text-[13.5px] font-semibold text-warm-brown transition-colors hover:text-burgundy disabled:opacity-50"
                  >
                    ← Geri
                  </button>
                )}
              </div>

              {/* escape hatch — deliberately low-contrast, not a primary CTA */}
              <p className="mt-6 font-sans text-[12.5px] leading-relaxed text-taupe/90">
                Seçim yapmak istemiyor musunuz?{" "}
                <Link
                  href="/lezzetlerimiz/yas-pastalar"
                  className="underline decoration-taupe/40 underline-offset-4 transition-colors hover:text-burgundy hover:decoration-burgundy"
                >
                  Tüm pastaları keşfedin →
                </Link>
              </p>
            </div>
          )}

          {/* ----- results (same hero area) ----- */}
          {isResults && (
            <div key="results" className="cq-in">
              <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-burgundy/55">
                Size Önerilerimiz
              </p>
              <h2 className="mt-3 font-serif text-[27px] font-medium leading-[1.16] text-burgundy md:text-[34px]">
                Kutlamanız için seçtiklerimiz.
              </h2>

              {summaryChips.length > 0 && (
                <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-[13px] text-warm-brown">
                  {summaryChips.map((chip, i) => (
                    <span key={chip.key} className="inline-flex items-center gap-2">
                      {i > 0 && <span className="text-taupe/60">·</span>}
                      <span>{chip.label}</span>
                    </span>
                  ))}
                </p>
              )}

              {largeScale && (
                <div className="mt-5 rounded-md border border-burgundy/15 bg-burgundy/[0.03] px-4 py-3">
                  <p className="font-sans text-[13px] leading-relaxed text-warm-brown">
                    Bu ölçekteki kutlamalar için özel planlama öneriyoruz.
                  </p>
                  <Link
                    href="/iletisim"
                    className="mt-1 inline-flex items-center gap-1.5 font-sans text-[13px] font-semibold text-burgundy transition-colors hover:text-chocolate-light"
                  >
                    Özel Sipariş Oluştur <span aria-hidden>→</span>
                  </Link>
                </div>
              )}

              {recommendations.length > 0 ? (
                <>
                  <div className="mt-7 grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-3">
                    {recommendations.map((rec, i) => (
                      // analytics: recommendation_clicked fires from ProductGridCard's own link
                      <div
                        key={rec.product.id}
                        className="cq-rise"
                        style={{ animationDelay: `${120 + i * 80}ms` }}
                      >
                        <p className="mb-1.5 inline-flex rounded-sm bg-burgundy/[0.07] px-2 py-0.5 font-sans text-[11px] font-semibold tracking-wide text-burgundy">
                          {rec.label}
                        </p>
                        {rec.reasons.length > 0 && (
                          <ul className="mb-2.5 space-y-0.5">
                            {[...new Set(rec.reasons)].map((reason) => (
                              <li
                                key={reason}
                                className="flex items-start gap-1.5 font-sans text-[11.5px] leading-snug text-warm-brown"
                              >
                                <span
                                  aria-hidden
                                  className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-burgundy/40"
                                />
                                {reason}
                              </li>
                            ))}
                          </ul>
                        )}
                        <ProductGridCard product={rec.product} />
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <button
                      type="button"
                      onClick={editAnswers}
                      className="font-sans text-[13.5px] font-semibold text-burgundy transition-colors hover:text-chocolate-light"
                    >
                      Seçimleri Değiştir
                    </button>
                    <Link
                      href="/lezzetlerimiz/yas-pastalar"
                      className="inline-flex items-center gap-1.5 border-b border-burgundy/20 pb-0.5 font-sans text-[13.5px] font-semibold text-burgundy transition-colors hover:border-burgundy"
                    >
                      Tüm Özel Gün Pastalarını Gör
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="mt-6 rounded-lg border border-sand-light bg-cream p-6 md:p-8">
                  <p className="font-serif text-[19px] font-medium text-burgundy">
                    Seçimlerinize tam uyan bir ürün bulamadık.
                  </p>
                  <p className="mt-2 max-w-md font-sans text-[14px] leading-relaxed text-warm-brown">
                    Tüm özel gün pastalarını inceleyebilir veya kişiye özel bir sipariş için
                    bizimle iletişime geçebilirsiniz.
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
                      Özel Sipariş Oluştur
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={editAnswers}
                    className="mt-5 font-sans text-[13.5px] font-semibold text-burgundy transition-colors hover:text-chocolate-light"
                  >
                    Seçimleri Değiştir
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
