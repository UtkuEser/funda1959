/**
 * Client-side product + category search.
 *
 * Data source is intentionally isolated behind `search()` / the module-level
 * index so it can later be swapped for `/api/search` or Supabase full-text
 * without touching the UI. The index is built once at module load.
 */

import { allCatalogProducts, catalogVersion, categories, type CatalogProduct } from "./data";

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

/**
 * lowercase + trim + collapse whitespace + Turkish char folding. Pure. NFC
 * first: a decomposed "ö" (o + combining mark, e.g. pasted text) folds like
 * the composed one instead of splitting the word.
 */
export function normalize(input: unknown): string {
  let s = typeof input === "string" ? input.normalize("NFC") : "";
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
  /** the name without spaces ("suboregi") */
  nameCompact: string;
  nameWords: string[];
  /** category, tags, search keywords, occasions */
  attrWords: string[];
  descWords: string[];
};

const words = (s: string): string[] => (s ? s.split(" ") : []);

function indexEntry(product: CatalogProduct, order: number): ProductIndexEntry {
  const keywords = [...(product.tags ?? []), ...(SEARCH_KEYWORDS[product.id] ?? [])].join(" ");
  const occasions = (product.occasions ?? []).map((o) => OCCASION_LABELS[o] ?? o).join(" ");
  const name = normalize(product.name);
  return {
    product,
    order,
    name,
    nameCompact: name.replace(/ /g, ""),
    nameWords: words(name),
    attrWords: words(normalize(`${product.categoryName} ${keywords} ${occasions}`)),
    descWords: words(normalize(`${product.description ?? ""} ${product.shortDescription ?? ""}`)),
  };
}

function buildProductIndex(): ProductIndexEntry[] {
  return allCatalogProducts().map(indexEntry);
}

/** the code catalog plus published panel products (D45); rebuilt when that list changes */
let productIndex: { version: string; entries: ProductIndexEntry[] } | null = null;
function productIndexNow(): ProductIndexEntry[] {
  const version = catalogVersion();
  if (!productIndex || productIndex.version !== version) productIndex = { version, entries: buildProductIndex() };
  return productIndex.entries;
}

type CategoryIndexEntry = {
  slug: string;
  name: string;
  order: number;
  normName: string;
  nameWords: string[];
  descWords: string[];
};

const CATEGORY_INDEX: CategoryIndexEntry[] = categories.map((c, order) => {
  const normName = normalize(c.name);
  return {
    slug: c.slug,
    name: c.name,
    order,
    normName,
    nameWords: words(normName),
    descWords: words(normalize(`${c.shortDescription ?? ""} ${c.description ?? ""}`)),
  };
});

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

/*
 * Words are compared whole, never as a piece of another word — "su" is not
 * found inside "sütlü", "kutusu" or "sunar". How well a query word matches a
 * word of the text:
 */
const EXACT = 3;
/** the word starts with it: still being typed (the last query word) or written with a suffix ("pasta" -> "pastası") */
const STARTED = 2;
/** the same root with another suffix: "pastası" ~ "pastalar", "börek" ~ "böreği" / "börekler" */
const SAME_ROOT = 1;

/** Turkish consonant softening before a suffix: börek -> böreği, dolap -> dolabı, kanat -> kanadı */
const SOFTENED: Record<string, string> = { k: "g", p: "b", t: "d" };

function wordMatch(token: string, word: string, last: boolean): number {
  if (word === token) return EXACT;
  if (word.startsWith(token) && (token.length >= 3 || last)) return STARTED;
  if (word.length >= 3 && token.length > word.length && token.startsWith(word)) return SAME_ROOT;
  let i = 0;
  while (i < token.length && i < word.length && token[i] === word[i]) i += 1;
  if (i >= 3 && i < token.length && i < word.length && (SOFTENED[token[i]] === word[i] || SOFTENED[word[i]] === token[i])) {
    return SAME_ROOT;
  }
  if (i >= 5 && i >= Math.min(token.length, word.length) - 2) return SAME_ROOT;
  return 0;
}

function bestIn(list: string[], token: string, last: boolean): number {
  let best = 0;
  for (const w of list) {
    const m = wordMatch(token, w, last);
    if (m > best) best = m;
    if (best === EXACT) break;
  }
  return best;
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

type Query = { q: string; compact: string; tokens: string[] };

function parseQuery(q: string): Query {
  return { q, compact: q.replace(/ /g, ""), tokens: q.split(" ").filter(Boolean) };
}

/*
 * Ranking — one rule for the header search, /arama and quick order. A tier
 * always beats the tiers below it, so words many products share ("pasta",
 * "tatlı", "su") never outrank a product named like the query:
 *   6  the name is the query ("su boregi", "Su  Böreği", "suboregi" -> Su Böreği)
 *   5  every query word is a whole word of the name, in any order
 *   4  every query word is in the name, some started or with another suffix
 *   3  part of the query in the name, the rest in its category / tags / text
 *   2  every word in the category, tags or occasions — not in the name
 *   1  every word somewhere, the description included
 * Every query word has to match somewhere, or the product isn't a result.
 * Inside a tier: better word matches (the name's count most), then the
 * share of the name the query covers ("Su Böreği" before "Su Böreği Tepsisi").
 */
const TIER = 10_000;

function scoreProduct(e: ProductIndexEntry, { q, compact, tokens }: Query): number {
  const last = tokens.length - 1;
  const inName = tokens.map((t, i) => bestIn(e.nameWords, t, i === last));
  const inAttrs = tokens.map((t, i) => bestIn(e.attrWords, t, i === last));
  // a short word still being typed ("su") is looked for at word starts in the name and tags, not all through the text
  const inText = tokens.map((t) => bestIn(e.descWords, t, false));
  const quality = sum(inName) * 9 + sum(inAttrs) * 3 + sum(inText);
  const covered = e.nameWords.filter((w) => tokens.some((t, i) => wordMatch(t, w, i === last) > 0)).length;
  const coverage = e.nameWords.length > 0 ? Math.round((covered / e.nameWords.length) * 9) : 0;

  let tier: number;
  if (e.name === q || e.nameCompact === compact) tier = 6;
  else if (!tokens.every((_, i) => inName[i] || inAttrs[i] || inText[i])) {
    // written without its spaces or in one run ("suborek") — the name still holds it
    if (compact.length >= 3 && e.nameCompact.includes(compact)) tier = 4;
    else return 0;
  } else if (inName.every((m) => m === EXACT)) tier = 5;
  else if (inName.every((m) => m > 0)) tier = 4;
  // a one-letter start ("su b") alone doesn't make a name match
  else if (inName.some((m, i) => m === EXACT || (m > 0 && tokens[i].length >= 3))) tier = 3;
  else if (tokens.every((_, i) => inName[i] || inAttrs[i])) tier = 2;
  else tier = 1;
  return tier * TIER + quality * 10 + coverage;
}

function scoreCategory(c: CategoryIndexEntry, { q, tokens }: Query): number {
  if (c.normName === q) return 100;
  const last = tokens.length - 1;
  const inName = tokens.map((t, i) => bestIn(c.nameWords, t, i === last));
  if (inName.every((m) => m > 0)) return 70 + sum(inName);
  // "su böreği" -> Börekler & Mayalılar (never Sütlü Tatlılar)
  if (inName.some((m, i) => m === EXACT || (m > 0 && tokens[i].length >= 3))) return 40 + sum(inName);
  if (tokens.every((t) => bestIn(c.descWords, t, false) > 0)) return 20;
  return 0;
}

function rankEntries(entries: ProductIndexEntry[], query: Query): CatalogProduct[] {
  return entries
    .map((e) => ({ e, s: scoreProduct(e, query) }))
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
}

/* -------------------------------------------------------------------------- */
/* Search                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The same matching and order over a list the caller already narrowed (quick
 * order: a category, "Çok Satanlar") — no minimum length there. An empty
 * query keeps the list as it is.
 */
export function rankProducts<T extends CatalogProduct>(list: T[], rawQuery: string): T[] {
  const q = normalize(rawQuery);
  if (!q) return list;
  return rankEntries(list.map(indexEntry), parseQuery(q)) as T[];
}

export function search(rawQuery: string): SearchResults {
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
  const q = normalize(query);

  if (q.length < MIN_QUERY_LENGTH) {
    return { query, products: [], categories: [], total: 0 };
  }

  const parsed = parseQuery(q);
  const products = rankEntries(productIndexNow(), parsed);

  const cats = CATEGORY_INDEX.map((c) => ({ c, s: scoreCategory(c, parsed) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.c.order - b.c.order)
    .map((x) => ({ slug: x.c.slug, name: x.c.name, href: `/lezzetlerimiz/${x.c.slug}` }));

  return { query, products, categories: cats, total: products.length };
}
