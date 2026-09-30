"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CatalogProduct } from "@/lib/data";
import {
  CELEBRATION_OCCASIONS,
  getCelebrationRecommendations,
  needsCustomPlanning,
  type CelebrationAnswers,
} from "@/lib/recommendations";
import {
  CELEBRATION_QUESTIONS,
  EMPTY_ANSWERS,
  RESULTS_STEP,
  optionShortLabel,
  questionTitle,
  readFinderState,
  writeFinderState,
} from "@/lib/celebration-finder";

/** On a pick: the selected card is acknowledged, then the question animates out. */
const ACK_MS = 190;
const EXIT_MS = 200;

export type FinderPhase = "idle" | "acknowledge" | "exiting";
export type AnswerChip = { key: keyof CelebrationAnswers; step: number; label: string };

/**
 * State for the cake finder: answers, step, pick/back/forward/edit, saved
 * progress (shared by every page that renders the finder) and the
 * recommendations for the current answers.
 */
export function useCelebrationFinder(products: CatalogProduct[]) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<CelebrationAnswers>(EMPTY_ANSWERS);
  const [phase, setPhase] = useState<FinderPhase>("idle");
  const [restored, setRestored] = useState(false);
  /** false until the visitor acts — keeps a restored step from stealing focus */
  const [interacted, setInteracted] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  // restore once on the client: a ?kutlama= preset wins, else the saved run
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preset = params.get("kutlama");
    if (preset && CELEBRATION_OCCASIONS.some((o) => o.value === preset)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnswers({ ...EMPTY_ANSWERS, occasion: preset });
      setStep(1);
      params.delete("kutlama");
      const query = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
    } else {
      const saved = readFinderState();
      if (saved) {
        setAnswers(saved.answers);
        setStep(saved.step);
      }
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (restored) writeFinderState({ answers, step });
  }, [restored, answers, step]);

  const isTransitioning = phase !== "idle";
  const isResults = step === RESULTS_STEP;
  const question = CELEBRATION_QUESTIONS[step] ?? null;
  const currentValue = question ? answers[question.key] : null;
  const title = question ? questionTitle(question, answers) : "";

  const recommendations = useMemo(
    () => (isResults ? getCelebrationRecommendations(products, answers) : []),
    [isResults, products, answers],
  );
  const largeScale = isResults && needsCustomPlanning(answers);
  const offerCustom = answers.style === "kisiye-ozel" || needsCustomPlanning(answers);

  const chipsBefore = useCallback(
    (limit: number): AnswerChip[] =>
      CELEBRATION_QUESTIONS.slice(0, limit)
        .map((q, i) => ({ key: q.key, step: i, label: optionShortLabel(q, answers[q.key]) }))
        .filter((c): c is AnswerChip => Boolean(c.label)),
    [answers],
  );

  const goToStep = (target: number) => {
    if (isTransitioning) return;
    setInteracted(true);
    clearTimers();
    setPhase("idle");
    setStep(target); // answers are kept — the earlier choice stays selected
  };

  const pick = (value: string) => {
    if (!question || isTransitioning) return; // guard against fast / double clicks
    setInteracted(true);
    setAnswers((prev) => ({ ...prev, [question.key]: value }));
    setPhase("acknowledge");
    clearTimers();
    timers.current.push(
      setTimeout(() => setPhase("exiting"), ACK_MS),
      setTimeout(() => {
        setStep((s) => s + 1);
        setPhase("idle");
      }, ACK_MS + EXIT_MS),
    );
  };

  return {
    step,
    answers,
    phase,
    restored,
    interacted,
    isTransitioning,
    isResults,
    question,
    currentValue,
    title,
    recommendations,
    largeScale,
    offerCustom,
    /** answers given before the current step (all of them on the results view) */
    chips: chipsBefore(isResults ? RESULTS_STEP : step),
    pick,
    goToStep,
    goBack: () => goToStep(Math.max(0, step - 1)),
    /** re-advance after going back, keeping the answer already given */
    goForward: () => {
      if (currentValue) goToStep(step + 1);
    },
    editAnswers: () => goToStep(0),
  };
}
