/**
 * The cake finder's questions and saved progress — shared by the home page
 * section and /ozel-gun (both render `CelebrationQuiz`), so there is one
 * question set, one state shape and one recommender (`recommendations.ts`).
 */

import type { CatalogProduct } from "./data";
import { CELEBRATION_OCCASIONS, type CelebrationAnswers } from "./recommendations";

export type FinderOption = {
  value: string;
  label: string;
  /** one-line helper shown under the label */
  hint?: string;
  /** shorter label for the answer chips */
  short?: string;
  /** "muted" = lower visual weight in the grid; "aside" = rendered below the grid */
  variant?: "muted" | "aside";
};

export type FinderQuestion = {
  key: keyof CelebrationAnswers;
  stepLabel: string;
  title: string;
  options: FinderOption[];
};

export const CELEBRATION_QUESTIONS: FinderQuestion[] = [
  {
    key: "occasion",
    stepLabel: "Kutlama Türü",
    title: "Hangi günü kutluyoruz?",
    options: CELEBRATION_OCCASIONS,
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
      { value: "unknown", label: "Kişi sayısı henüz net değil", short: "Kişi sayısı belirsiz", variant: "aside" },
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
      { value: "any", label: "Kararsızım, Funda seçsin", short: "Funda seçsin", variant: "muted" },
    ],
  },
  {
    key: "style",
    stepLabel: "Tasarım",
    title: "Nasıl bir pasta hayal ediyorsunuz?",
    options: [
      { value: "klasik", label: "Klasik", hint: "Zamansız Funda çizgisi" },
      { value: "sade", label: "Sade & Zarif", hint: "Minimal detaylar" },
      { value: "gosterisli", label: "Gösterişli", hint: "Kutlamanın odağında" },
      { value: "kisiye-ozel", label: "Kişiye Özel", hint: "Size göre tasarlanır" },
    ],
  },
];

export const RESULTS_STEP = CELEBRATION_QUESTIONS.length;

export const EMPTY_ANSWERS: CelebrationAnswers = { occasion: null, serving: null, flavor: null, style: null };

/** Light copy adaptation based on the first answer (copy only, never the options). */
export function questionTitle(q: FinderQuestion, answers: CelebrationAnswers): string {
  if (q.key === "style" && answers.occasion === "kurumsal") return "Nasıl bir sunum düşünüyorsunuz?";
  return q.title;
}

export function optionShortLabel(q: FinderQuestion, value: string | null): string | undefined {
  if (!value) return undefined;
  const opt = q.options.find((o) => o.value === value);
  return opt?.short ?? opt?.label;
}

/** Candidate pool — celebration cakes only. */
export function celebrationPool(products: CatalogProduct[]): CatalogProduct[] {
  return products.filter(
    (p) =>
      p.categorySlug === "yas-pastalar" ||
      p.categorySlug === "ozel-gun" ||
      p.isSpecialOccasion ||
      (p.occasions?.length ?? 0) > 0,
  );
}

/* -------------------------------------------------------------------------- */
/* Saved progress — sessionStorage, so the home page and /ozel-gun continue   */
/* the same run within a visit                                                  */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = "funda-celebration-finder";

export type FinderState = { answers: CelebrationAnswers; step: number };

/** Keeps only known answers and never lands past the first unanswered question. */
export function sanitizeFinderState(raw: unknown): FinderState {
  const input = (raw ?? {}) as { answers?: Partial<Record<string, unknown>>; step?: unknown };
  const answers: CelebrationAnswers = { ...EMPTY_ANSWERS };
  for (const q of CELEBRATION_QUESTIONS) {
    const v = input.answers?.[q.key];
    if (typeof v === "string" && q.options.some((o) => o.value === v)) answers[q.key] = v;
  }
  const firstOpen = CELEBRATION_QUESTIONS.findIndex((q) => !answers[q.key]);
  const reachable = firstOpen === -1 ? RESULTS_STEP : firstOpen;
  const step = typeof input.step === "number" && Number.isInteger(input.step) ? input.step : 0;
  return { answers, step: Math.max(0, Math.min(step, reachable)) };
}

export function readFinderState(): FinderState | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeFinderState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeFinderState(state: FinderState): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — progress is simply not kept */
  }
}
