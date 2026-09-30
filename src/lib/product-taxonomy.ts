/**
 * The product category structure shared by the header's Ürünler menu and the
 * admin panel's Şube Stokları screen: five groups, each with an icon and the
 * data categories (sub-categories) it covers. Hediyelikler is cross-cutting:
 * it holds every product flagged as a gift, whatever its category.
 */

export type NavIconName = "cake" | "chocolate" | "dessert" | "bread" | "gift";

export type ProductGroup = {
  id: "pastalar" | "cikolatalar" | "tatlilar" | "unlu-mamuller" | "hediyelikler";
  label: string;
  icon: NavIconName;
  /** data category slugs (lib/data `categories`) in display order; empty for Hediyelikler */
  categories: string[];
};

export const PRODUCT_GROUPS: ProductGroup[] = [
  { id: "pastalar", label: "Pastalar", icon: "cake", categories: ["yas-pastalar", "adet-pastalar", "ozel-gun"] },
  { id: "cikolatalar", label: "Çikolatalar", icon: "chocolate", categories: ["cikolatalar"] },
  { id: "tatlilar", label: "Tatlılar", icon: "dessert", categories: ["sutlu-tatlilar", "serbetli-tatlilar", "mini-lezzetler", "kekler"] },
  { id: "unlu-mamuller", label: "Unlu Mamuller", icon: "bread", categories: ["borekler-ve-mayalilar", "atistirmaliklar", "kuru-pastalar"] },
  { id: "hediyelikler", label: "Hediyelikler", icon: "gift", categories: [] },
];

export function productGroup(id: ProductGroup["id"]): ProductGroup {
  return PRODUCT_GROUPS.find((g) => g.id === id)!;
}

/** Does a product (by category slug + gift flag) belong in a group? */
export function inProductGroup(group: ProductGroup, categorySlug: string, isGift: boolean): boolean {
  return group.id === "hediyelikler" ? isGift : group.categories.includes(categorySlug);
}
