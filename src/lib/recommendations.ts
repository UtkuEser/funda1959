/**
 * Celebration cake recommender — deterministic, rule-based, no AI / no network.
 *
 * Pipeline: hard eligibility → additive scoring → ranked picks with reasons.
 *
 *   occasion match      + up to 40
 *   serving-size fit     + up to 30
 *   flavour match        + up to 20
 *   style / personalise  + up to 10
 *   -------------------------------
 *   total                       100
 *
 * "Belirsizlik varsa skorla, kesin uyumsuzluk varsa filtrele." — a product is
 * only removed from the pool when its data clearly contradicts an answer
 * (e.g. a small, non-customisable cake for a 20+ guest celebration). When the
 * data is missing/ambiguous the product stays and is ranked by score.
 *
 * All matching runs off fields that already exist on `CatalogProduct`
 * (`occasions`, `servingOptions`, `tags`, `name`, `description`,
 * `customizable`, `isSpecialOccasion`, …) — nothing is hard-coded per product.
 */

import type { CatalogProduct } from "./data";
import { normalize } from "./search";

export type CelebrationAnswers = {
  occasion: string | null;
  serving: string | null;
  flavor: string | null;
  style: string | null;
};

export type CelebrationRecommendation = {
  product: CatalogProduct;
  score: number;
  /** Positional label — "Funda'nın İlk Önerisi" / "Alternatif" / "Kişiselleştirilebilir". */
  label: string;
  /** Short, human rationale strings derived from the actual scoring (max 3). */
  reasons: string[];
};

/* -- copy maps (reason text, kept next to the rules that produce them) ----- */

const OCCASION_REASON: Record<string, string> = {
  "dogum-gunu": "Doğum günü kutlamalarına uygun",
  "nisan-soz": "Nişan & söz için uygun",
  dugun: "Düğün kutlamalarına uygun",
  yildonumu: "Yıldönümü kutlamalarına uygun",
  "ozel-davet": "Özel davetler için uygun",
  kurumsal: "Kurumsal kutlamalara uygun",
};

const SERVING_REASON: Record<string, string> = {
  "2-4": "2–4 kişilik servise uygun",
  "6-8": "6–8 kişilik servise uygun",
  "10-15": "10–15 kişilik servise uygun",
  "20+": "Büyük kutlamalara ölçeklenebilir",
};

const FLAVOR_REASON: Record<string, string> = {
  cikolatali: "Çikolatalı tercihinize uygun",
  meyveli: "Meyveli tercihinize uygun",
  fistikli: "Fıstıklı / kuruyemişli tercihinize uygun",
  hafif: "Daha hafif bir profil sunar",
};

/* -- occasion ------------------------------------------------------------- */

// quiz value -> catalog `occasions` slugs (real values in data: dogum-gunu,
// dugun-nisan, kutlama, kisiye-ozel).
const OCCASION_MAP: Record<string, string[]> = {
  "dogum-gunu": ["dogum-gunu"],
  "nisan-soz": ["dugun-nisan"],
  dugun: ["dugun-nisan"],
  yildonumu: ["kutlama", "kisiye-ozel"],
  "ozel-davet": ["kutlama"],
  kurumsal: ["kutlama"],
};

type Part = { score: number; reason?: string };

function scoreOccasion(p: CatalogProduct, answer: string | null): Part {
  if (!answer) return { score: 0 };
  const mapped = OCCASION_MAP[answer] ?? [];
  const occ = p.occasions ?? [];
  if (occ.some((o) => mapped.includes(o))) {
    return { score: 40, reason: OCCASION_REASON[answer] };
  }
  if (occ.includes("kutlama")) return { score: 24, reason: "Kutlamalar için hazırlanır" };
  if (p.isSpecialOccasion) return { score: 16, reason: "Özel gün pastası" };
  if (p.categorySlug === "yas-pastalar") return { score: 10 };
  return { score: 0 };
}

/* -- serving size ------------------------------------------------------- */

/** "8–10 Kişilik" -> "8-10", "15+ Kişilik" -> "15+" */
function servingKey(label: string): string {
  const nums = label.match(/\d+/g) ?? [];
  if (label.includes("+")) return `${nums[0] ?? ""}+`;
  return nums.join("-");
}

const SERVING_FIT: Record<string, { ideal: string[]; ok: string[] }> = {
  "2-4": { ideal: ["4-6"], ok: ["8-10"] },
  "6-8": { ideal: ["8-10", "4-6"], ok: ["12-15"] },
  "10-15": { ideal: ["12-15", "8-10"], ok: ["15+"] },
  "20+": { ideal: ["15+", "12-15"], ok: [] },
};

function scoreServing(p: CatalogProduct, answer: string | null): Part {
  if (!answer || answer === "unknown") return { score: 0 };
  const fit = SERVING_FIT[answer];
  if (!fit) return { score: 0 };
  const opts = (p.servingOptions ?? []).map(servingKey);
  if (opts.length === 0) {
    // size unknown for this product — don't punish, but only credit a reason
    // for a customisable cake that can genuinely be sized to order.
    return p.customizable
      ? { score: 12, reason: answer === "20+" ? SERVING_REASON["20+"] : "İstenen ölçüye göre hazırlanır" }
      : { score: 12 };
  }
  if (opts.some((o) => fit.ideal.includes(o))) return { score: 30, reason: SERVING_REASON[answer] };
  if (opts.some((o) => fit.ok.includes(o))) return { score: 15, reason: SERVING_REASON[answer] };
  return { score: 3 };
}

/* -- flavour ----------------------------------------------------------- */

const FLAVOR_KEYWORDS: Record<string, string[]> = {
  cikolatali: ["cikolata", "kakao", "praline", "trufl", "truf"],
  meyveli: ["meyve", "cilek", "frambuaz", "mango", "portakal", "limon", "visne", "yaban"],
  fistikli: ["fistik", "antep", "findik", "badem", "ceviz", "kuruyemis", "praline"],
  hafif: ["hafif", "mousse", "meyve", "yogurt", "limon", "yaz"],
};

function scoreFlavor(p: CatalogProduct, answer: string | null): Part {
  if (!answer || answer === "any") return { score: 0 };
  const keywords = FLAVOR_KEYWORDS[answer];
  if (!keywords) return { score: 0 };
  const hay = normalize(
    `${p.name} ${(p.tags ?? []).join(" ")} ${p.description ?? ""} ${p.shortDescription ?? ""}`,
  );
  return keywords.some((k) => hay.includes(k))
    ? { score: 20, reason: FLAVOR_REASON[answer] }
    : { score: 0 };
}

/* -- style / personalisation ---------------------------------------------- */

function scoreStyle(p: CatalogProduct, answer: string | null): Part {
  if (!answer || answer === "any") return { score: 0 };
  const hay = normalize(`${p.name} ${(p.tags ?? []).join(" ")}`);
  switch (answer) {
    case "kisiye-ozel":
      if (p.customizable) return { score: 10, reason: "İsteğinize göre kişiselleştirilebilir" };
      return p.isSpecialOccasion ? { score: 4 } : { score: 0 };
    case "gosterisli":
      return p.customizable || p.isSpecialOccasion || (p.occasions ?? []).includes("dugun-nisan")
        ? { score: 8, reason: "Kutlamanın odağında bir sunum" }
        : { score: 2 };
    case "klasik":
      return hay.includes("klasik") || hay.includes("gelenek")
        ? { score: 8, reason: "Zamansız, klasik Funda çizgisi" }
        : { score: 4 };
    case "sade":
      return !p.customizable && !hay.includes("koleksiyon")
        ? { score: 7, reason: "Sade ve zarif bir sunum" }
        : { score: 3 };
    default:
      return { score: 0 };
  }
}

/* -- hard eligibility ---------------------------------------------------- */

/**
 * Returns false only on a *clear* contradiction between the answers and the
 * product data. Ambiguous / missing data never eliminates a product here.
 */
export function isEligible(p: CatalogProduct, answers: CelebrationAnswers): boolean {
  if (answers.serving === "20+") {
    const opts = (p.servingOptions ?? []).map(servingKey);
    const scalable = p.customizable || opts.some((o) => o === "15+" || o === "12-15");
    // known small, fixed-size, non-customisable cake -> not for a 20+ celebration
    if (!scalable && opts.length > 0) return false;
  }
  return true;
}

/* -- main ------------------------------------------------------------------ */

type Evaluation = { score: number; reasons: string[] };

function evaluate(p: CatalogProduct, answers: CelebrationAnswers): Evaluation {
  const parts = [
    scoreOccasion(p, answers.occasion),
    scoreServing(p, answers.serving),
    scoreFlavor(p, answers.flavor),
    scoreStyle(p, answers.style),
  ];
  return {
    score: parts.reduce((sum, part) => sum + part.score, 0),
    reasons: parts.map((part) => part.reason).filter((r): r is string => Boolean(r)),
  };
}

export function scoreProduct(p: CatalogProduct, answers: CelebrationAnswers): number {
  return evaluate(p, answers).score;
}

/** Whether the chosen guest count warrants a bespoke-planning nudge on results. */
export function needsCustomPlanning(answers: CelebrationAnswers): boolean {
  return answers.serving === "20+";
}

/**
 * Future-safe: serialise answers so they can later be threaded into product
 * URLs / detail context (e.g. `/urunler/foo?occasion=dogum-gunu&serving=6-8`).
 * TODO(product-detail): consume these on the product page in a later pass —
 * routing/query behaviour is intentionally untouched for now.
 */
export function celebrationAnswersToParams(answers: CelebrationAnswers): Record<string, string> {
  const out: Record<string, string> = {};
  if (answers.occasion) out.occasion = answers.occasion;
  if (answers.serving && answers.serving !== "unknown") out.serving = answers.serving;
  if (answers.flavor && answers.flavor !== "any") out.flavor = answers.flavor;
  if (answers.style && answers.style !== "any") out.style = answers.style;
  return out;
}

function fallbackReason(p: CatalogProduct): string {
  if (p.customizable) return "Kişiselleştirilebilir";
  if (p.isBestSeller) return "Çok tercih edilen bir seçim";
  if (p.isFeatured) return "Öne çıkan bir seçim";
  return "Özel günler için hazırlanır";
}

export function getCelebrationRecommendations(
  products: CatalogProduct[],
  answers: CelebrationAnswers,
  limit = 3,
): CelebrationRecommendation[] {
  const rank = (pool: CatalogProduct[]) =>
    pool
      .map((product, index) => ({ product, index, ...evaluate(product, answers) }))
      .filter((entry) => entry.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          Number(!!b.product.isFeatured) - Number(!!a.product.isFeatured) ||
          Number(!!b.product.isBestSeller) - Number(!!a.product.isBestSeller) ||
          Number(!!b.product.isNew) - Number(!!a.product.isNew) ||
          a.index - b.index,
      );

  // hard eligibility first; fall back to the unfiltered pool if it emptied out
  let ranked = rank(products.filter((p) => isEligible(p, answers)));
  if (ranked.length === 0) ranked = rank(products);

  const seen = new Set<string>();
  const picks: CelebrationRecommendation[] = [];
  for (const entry of ranked) {
    if (seen.has(entry.product.id)) continue;
    seen.add(entry.product.id);

    const reasons = (entry.reasons.length > 0 ? entry.reasons : [fallbackReason(entry.product)]).slice(
      0,
      3,
    );
    const label =
      picks.length === 0
        ? "Funda'nın İlk Önerisi"
        : entry.product.customizable
          ? "Kişiselleştirilebilir"
          : "Alternatif";

    picks.push({ product: entry.product, score: entry.score, label, reasons });
    if (picks.length === limit) break;
  }
  return picks;
}
