/**
 * "Siparişinize eşlik etsin" — products that go with what is in the cart
 * (/sepet, /checkout). The pairings live here, in one table: for each cart
 * category, what to offer next to it, first pick first. A pick is a catalog
 * category or words in a product's name (e.g. "mum"). Only real products of
 * the storefront catalog are offered (published and on the site); a pick the
 * catalog has nothing for is skipped — nothing is made up, no external
 * service. Whether a candidate can go out with this order (the branch, the
 * cart's shipping time) is the server's answer, asked by the component.
 * Client-safe, pure.
 */

import { catalogWithHidden, type CatalogProduct } from "./data";
import { getQuickOrderMode } from "./quick-order-utils";
import { normalize } from "./search";

export type SuggestionPick = { category: string } | { nameWords: string[] };

export type SuggestionRule = {
  /** cart lines in these categories ... */
  when: string[];
  /** ... are offered these; never a product of a `when` category (a complement, not more of the same) */
  offer: SuggestionPick[];
};

export const CART_SUGGESTION_RULES: SuggestionRule[] = [
  // pasta -> celebration items such as candles (by name: the catalog has none yet, so skipped), small sweets, chocolate
  {
    when: ["yas-pastalar", "ozel-gun"],
    offer: [{ nameWords: ["mum", "maytap", "balon", "parti"] }, { category: "mini-lezzetler" }, { category: "cikolatalar" }],
  },
  // baklava, kadayıf -> kuru pasta, chocolate
  { when: ["serbetli-tatlilar"], offer: [{ category: "kuru-pastalar" }, { category: "cikolatalar" }] },
  { when: ["sutlu-tatlilar"], offer: [{ category: "kuru-pastalar" }, { category: "serbetli-tatlilar" }] },
  { when: ["kuru-pastalar"], offer: [{ category: "serbetli-tatlilar" }, { category: "cikolatalar" }] },
  { when: ["kekler"], offer: [{ category: "kuru-pastalar" }, { category: "borekler-ve-mayalilar" }] },
  { when: ["borekler-ve-mayalilar"], offer: [{ category: "kekler" }, { category: "kuru-pastalar" }] },
  { when: ["atistirmaliklar"], offer: [{ category: "kekler" }, { category: "kuru-pastalar" }] },
  { when: ["cikolatalar"], offer: [{ category: "mini-lezzetler" }, { category: "kuru-pastalar" }] },
  { when: ["mini-lezzetler", "adet-pastalar"], offer: [{ category: "cikolatalar" }, { category: "kuru-pastalar" }] },
];

/** shown at most */
export const SUGGESTION_LIMIT = 4;
/** asked about on the server — enough left for four after the ones this order can't take */
const POOL_LIMIT = 16;

/** FNV-1a: a fixed order per cart — varied between carts, the same on every render */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function matchesPick(p: CatalogProduct, pick: SuggestionPick): boolean {
  if ("category" in pick) return p.categorySlug === pick.category;
  const name = normalize(p.name).split(" ");
  return pick.nameWords.some((w) => {
    const t = normalize(w);
    return name.some((n) => n.startsWith(t));
  });
}

/**
 * The candidates for a cart, best first. Each cart category (in the order the
 * lines were added) brings its rule's picks; they are taken in turns — the
 * first of every pick, then the second ... — so the list mixes kinds. Left
 * out: products already in the cart (any size), the cart line's own kind, and
 * those that need the product page (a cake message, a bespoke design) —
 * everything offered can be added right here.
 */
export function suggestionCandidates(cart: { productId: string }[], catalog: CatalogProduct[]): CatalogProduct[] {
  const inCart = new Set(cart.map((i) => i.productId));
  // a line's product may be off the site by now; its kind still counts
  const known = new Map(catalogWithHidden().map((p) => [p.id, p]));
  const cartCategories = [...new Set(cart.map((i) => known.get(i.productId)?.categorySlug).filter((c): c is string => Boolean(c)))];
  const rules = [
    ...new Set(cartCategories.map((c) => CART_SUGGESTION_RULES.find((r) => r.when.includes(c))).filter((r): r is SuggestionRule => Boolean(r))),
  ];
  if (rules.length === 0) return [];

  const seed = [...inCart].sort().join(",");
  const addable = catalog.filter((p) => !inCart.has(p.id) && p.priceValue > 0 && getQuickOrderMode(p).kind !== "detailed");
  const groups: CatalogProduct[][] = [];
  const rounds = Math.max(...rules.map((r) => r.offer.length));
  for (let k = 0; k < rounds; k += 1) {
    for (const rule of rules) {
      const pick = rule.offer[k];
      if (!pick) continue;
      groups.push(
        addable
          .filter((p) => !rule.when.includes(p.categorySlug) && matchesPick(p, pick))
          .sort((a, b) => hash(`${seed}|${a.id}`) - hash(`${seed}|${b.id}`)),
      );
    }
  }

  const out: CatalogProduct[] = [];
  const seen = new Set<string>();
  for (let round = 0; out.length < POOL_LIMIT; round += 1) {
    let more = false;
    for (const g of groups) {
      const p = g[round];
      if (!p) continue;
      more = true;
      if (!seen.has(p.id)) {
        seen.add(p.id);
        out.push(p);
      }
    }
    if (!more) break;
  }
  return out.slice(0, POOL_LIMIT);
}
