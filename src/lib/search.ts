/**
 * Client-side product + category search.
 *
 * Data source is intentionally isolated behind `search()` / the module-level
 * index so it can later be swapped for `/api/search` or Supabase full-text
 * without touching the UI. The index is built once at module load.
 */

import { catalogProducts, categories, type CatalogProduct } from "./data";

/* -------------------------------------------------------------------------- */
/* Normalization                                                              */
/* -------------------------------------------------------------------------- */

const TR_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/[İIı]/g, "i"],
  [/[Şş]/g, "s"],
  [/[Ğğ]/g, "g"],
  [/[Çç]/g, "c"],
  [/[Öö]/g, "o"],
  [/[Üü]/g, "u"],
  [/[Ââ]/g, "a"],
  [/[Îî]/g, "i"],
  [/[Ûû]/g, "u"],
];

/** lowercase + trim + collapse whitespace + Turkish char folding. Pure. */
export function normalize(input: unknown): string {
  let s = typeof input === "string" ? input : "";
  for (const [re, rep] of TR_REPLACEMENTS) s = s.replace(re, rep);
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* -------------------------------------------------------------------------- */
/* Public result shapes (data-source agnostic)                               */
/* -------------------------------------------------------------------------- */

export type SearchCategoryResult = { slug: string; name: string; href: string };

export type SearchResults = {
  query: string;
  products: CatalogProduct[];
  categories: SearchCategoryResult[];
  total: number;
};

export const MIN_QUERY_LENGTH = 2;
export const AUTOCOMPLETE_PRODUCT_LIMIT = 6;
export const AUTOCOMPLETE_CATEGORY_LIMIT = 3;

export const POPULAR_SEARCHES = [
  "Doğum Günü Pastası",
  "Çikolatalı Pasta",
  "Baklava",
  "Profiterol",
  "Hediyelik Çikolata",
];

/* -------------------------------------------------------------------------- */
/* Index                                                                      */
/* -------------------------------------------------------------------------- */

const OCCASION_LABELS: Record<string, string> = {
  "dogum-gunu": "Doğum Günü",
  "dugun-nisan": "Düğün Nişan",
  kutlama: "Kutlama",
  "kisiye-ozel": "Kişiye Özel",
};

/** A few demo keywords so common phrasings resolve. Extend as needed. */
const SEARCH_KEYWORDS: Record<string, string[]> = {
  p1: ["çikolatalı pasta", "çilekli pasta", "doğum günü pastası", "yaş pasta"],
  p2: ["profiterol", "çikolatalı pasta", "yaş pasta"],
  p5: ["macaron", "hediyelik çikolata", "mini tatlı"],
  p10: ["fıstıklı baklava", "antep fıstığı", "şerbetli tatlı"],
  p11: ["kadayıf", "şerbetli tatlı"],
  p13: ["hediyelik çikolata", "kutu çikolata", "trüf"],
  p14: ["hediyelik çikolata", "çikolata kutusu", "pralin"],
  p15: ["nişan pastası", "düğün pastası"],
  p16: ["doğum günü pastası", "kişiye özel pasta"],
  p17: ["börek", "tuzlu"],
};

type ProductIndexEntry = {
  product: CatalogProduct;
  order: number;
  name: string;
  category: string;
  keywords: string;
  occasions: string;
  description: string;
  combined: string;
};

const PRODUCT_INDEX: ProductIndexEntry[] = catalogProducts.map((product, order) => {
  const keywords = [...(product.tags ?? []), ...(SEARCH_KEYWORDS[product.id] ?? [])].join(" ");
  const occasions = (product.occasions ?? []).map((o) => OCCASION_LABELS[o] ?? o).join(" ");
  const name = normalize(product.name);
  const category = normalize(product.categoryName);
  const kw = normalize(keywords);
  const occ = normalize(occasions);
  const description = normalize(`${product.description ?? ""} ${product.shortDescription ?? ""}`);
  return {
    product,
    order,
    name,
    category,
    keywords: kw,
    occasions: occ,
    description,
    combined: `${name} ${category} ${kw} ${occ} ${description}`,
  };
});

type CategoryIndexEntry = {
  slug: string;
  name: string;
  order: number;
  normName: string;
  normDesc: string;
};

const CATEGORY_INDEX: CategoryIndexEntry[] = categories.map((c, order) => ({
  slug: c.slug,
  name: c.name,
  order,
  normName: normalize(c.name),
  normDesc: normalize(`${c.shortDescription ?? ""} ${c.description ?? ""}`),
}));

/** Small curated route-safe category list for the empty search state. */
export const searchOverlayCategories: SearchCategoryResult[] = [
  "yas-pastalar",
  "adet-pastalar",
  "sutlu-tatlilar",
  "borekler-ve-mayalilar",
  "cikolatalar",
  "kuru-pastalar",
]
  .map((slug) => categories.find((c) => c.slug === slug))
  .filter((c): c is (typeof categories)[number] => Boolean(c))
  .map((c) => ({ slug: c.slug, name: c.name, href: `/lezzetlerimiz/${c.slug}` }));

/* -------------------------------------------------------------------------- */
/* Scoring                                                                    */
/* -------------------------------------------------------------------------- */

function scoreProduct(e: ProductIndexEntry, q: string, tokens: string[]): number {
  let score = 0;

  if (e.name === q) score += 100;
  else if (e.name.startsWith(q)) score += 80;
  else if (e.name.includes(q)) score += 60;

  if (e.category.includes(q)) score += 40;
  if (e.keywords.includes(q)) score += 30;
  if (e.occasions.includes(q)) score += 25;
  if (e.description.includes(q)) score += 10;

  // Multi-word queries: every token present somewhere.
  if (score === 0 && tokens.length > 1 && tokens.every((t) => e.combined.includes(t))) {
    score += 15;
  }
  return score;
}

function scoreCategory(c: CategoryIndexEntry, q: string, tokens: string[]): number {
  if (c.normName === q) return 100;
  if (c.normName.startsWith(q)) return 70;
  if (c.normName.includes(q)) return 50;
  if (c.normDesc.includes(q)) return 20;
  if (tokens.length > 1 && tokens.every((t) => c.normName.includes(t))) return 30;
  return 0;
}

/* -------------------------------------------------------------------------- */
/* Search                                                                     */
/* -------------------------------------------------------------------------- */

export function search(rawQuery: string): SearchResults {
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
  const q = normalize(query);

  if (q.length < MIN_QUERY_LENGTH) {
    return { query, products: [], categories: [], total: 0 };
  }

  const tokens = q.split(" ").filter(Boolean);

  const products = PRODUCT_INDEX.map((e) => ({ e, s: scoreProduct(e, q, tokens) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => {
      if (b.s !== a.s) return b.s - a.s;
      const bs = Number(!!b.e.product.isBestSeller) - Number(!!a.e.product.isBestSeller);
      if (bs) return bs;
      const bf = Number(!!b.e.product.isFeatured) - Number(!!a.e.product.isFeatured);
      if (bf) return bf;
      const bn = Number(!!b.e.product.isNew) - Number(!!a.e.product.isNew);
      if (bn) return bn;
      return a.e.order - b.e.order;
    })
    .map((x) => x.e.product);

  const cats = CATEGORY_INDEX.map((c) => ({ c, s: scoreCategory(c, q, tokens) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.c.order - b.c.order)
    .map((x) => ({ slug: x.c.slug, name: x.c.name, href: `/lezzetlerimiz/${x.c.slug}` }));

  return { query, products, categories: cats, total: products.length };
}
