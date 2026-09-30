import { productGroup, type NavIconName } from "@/lib/product-taxonomy";

export type NavChild = { label: string; href: string };
export type { NavIconName };

/** A labelled column inside a dropdown (e.g. "Pastalar" under Ürünler). */
export type NavGroup = { label: string; icon: NavIconName; links: NavChild[] };
export type NavItem = {
  label: string;
  href: string;
  /** grouped dropdown content */
  groups?: NavGroup[];
  /** trailing "see everything" link under the groups */
  allLink?: NavChild;
  /** path prefixes that mark this item as the current page */
  activeFor?: string[];
  /**
   * Shown but not yet linkable — no working flow behind it. Rendered disabled
   * with this short note instead of pointing at a fake or unrelated page.
   */
  pending?: string;
  /** opens a site-wide UI instead of navigating ("address" = the address picker) */
  action?: "address";
};

/**
 * Shared top navigation — consumed by the desktop menu row and the mobile
 * drawer so both stay in sync. Links only point to routes that exist. There
 * is no campaigns page yet: "Fırsatlar" opens the home page's campaign
 * section. "Adres" opens the shared address picker (district -> neighbourhood).
 * Quick order and the cake finder are reached from the page itself (branch
 * bar, Kutlamalar section, footer), not from the header.
 */
/** group title + icon come from the shared product taxonomy (also used by the admin stock screen) */
const groupHead = (id: Parameters<typeof productGroup>[0]) => {
  const g = productGroup(id);
  return { label: g.label, icon: g.icon };
};

export const navItems: NavItem[] = [
  { label: "Ana Sayfa", href: "/", activeFor: [] },
  {
    label: "Ürünler",
    href: "/lezzetlerimiz",
    activeFor: ["/lezzetlerimiz", "/urunler", "/hediyelikler"],
    // Only listings that have products: Adet Pastalar and Atıştırmalıklar are
    // real categories but currently empty, so they are not linked. No link
    // appears in two groups.
    groups: [
      {
        ...groupHead("pastalar"),
        links: [
          { label: "Yaş Pastalar", href: "/lezzetlerimiz/yas-pastalar" },
          { label: "Özel Gün Pastaları", href: "/lezzetlerimiz/ozel-gun" },
        ],
      },
      {
        ...groupHead("cikolatalar"),
        links: [
          { label: "El Yapımı Trüf Çikolata", href: "/urunler/el-yapimi-truf-cikolata" },
          { label: "Pralinli Çikolata Kutusu", href: "/urunler/pralinli-cikolata-kutusu" },
          { label: "Tüm Çikolatalar", href: "/lezzetlerimiz/cikolatalar" },
        ],
      },
      {
        ...groupHead("tatlilar"),
        links: [
          { label: "Sütlü Tatlılar", href: "/lezzetlerimiz/sutlu-tatlilar" },
          { label: "Şerbetli Tatlılar", href: "/lezzetlerimiz/serbetli-tatlilar" },
          { label: "Mini Lezzetler", href: "/lezzetlerimiz/mini-lezzetler" },
          { label: "Kekler", href: "/lezzetlerimiz/kekler" },
          { label: "Tüm Tatlılar", href: "/lezzetlerimiz/tatlilar" },
        ],
      },
      {
        ...groupHead("unlu-mamuller"),
        links: [
          { label: "Börekler & Mayalılar", href: "/lezzetlerimiz/borekler" },
          { label: "Kuru Pastalar", href: "/lezzetlerimiz/kuru-pastalar" },
        ],
      },
      {
        ...groupHead("hediyelikler"),
        links: [
          { label: "Hediye Seçkileri", href: "/hediyelikler#hediye-secimi" },
          { label: "Kurumsal Hediyeler", href: "/hediyelikler#kurumsal" },
          { label: "Tüm Hediyelikler", href: "/hediyelikler" },
        ],
      },
    ],
    allLink: { label: "Tüm Ürünler", href: "/lezzetlerimiz" },
  },
  { label: "Fırsatlar", href: "/#kampanyalar", activeFor: [] },
  { label: "1959'dan Bugüne", href: "/hikayemiz", activeFor: ["/hikayemiz"] },
  { label: "İletişim", href: "/iletisim", activeFor: ["/iletisim", "/subeler"] },
  { label: "Adres", href: "", action: "address" },
];

/** Ana Sayfa is current only on "/" itself; others by their path prefixes. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.pending || item.action) return false;
  if (item.href === "/") return pathname === "/";
  return (item.activeFor ?? []).some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
