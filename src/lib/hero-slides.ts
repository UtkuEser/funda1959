export type HeroMediaType = "image" | "video";

export type HeroSlideMedia = {
  /** Today always "image". The renderer already branches on this so a
   *  background <video> can drop in later without touching slide callers. */
  type: HeroMediaType;
  /** Public path (e.g. /home/hero/1.png) or null when the file is missing —
   *  the slide then falls back to its gradient identity. */
  src: string | null;
  alt: string;
};

export type HeroSlide = {
  id: string;
  /** small uppercase kicker above the headline */
  eyebrow: string;
  headline: [string, string];
  text: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  /** optional "signature of the week" card floating over the visual */
  signature?: { label: string; value: string };
  mediaType: HeroMediaType;
  /** intended still image under /public (verified at build by resolveHeroSlides) */
  image: string;
  /** gradient identity used when the image is missing */
  fallbackVisual: "heritage" | "celebration" | "daily";
};

export type ResolvedHeroSlide = HeroSlide & { media: HeroSlideMedia };

/**
 * Homepage hero — three calm, editorial slides in a fixed order:
 * (1) heritage & craft, (2) the daily bakery counter, (3) celebration cakes.
 * The left copy column stays fixed; only the copy and the photo crossfade.
 * Photos: /public/home/hero/1–3.
 */
export const heroSlides: HeroSlide[] = [
  {
    id: "heritage",
    eyebrow: "1959'dan Bugüne",
    headline: ["1959'dan bugüne", "aynı özen, aynı lezzet."],
    text: "Gelenekten gelen ustalık; her sabah taze hazırlanan pastalar, el yapımı çikolatalar ve köklü bir pastane kültürüyle sofralarınızda.",
    primary: { label: "Pastaları Keşfet", href: "/lezzetlerimiz/yas-pastalar" },
    secondary: { label: "1959'dan Bugüne", href: "/hikayemiz" },
    signature: { label: "Bu haftanın imzası", value: "Çikolatalı Çilekli Pasta" },
    mediaType: "image",
    image: "/home/hero/1.png",
    fallbackVisual: "heritage",
  },
  {
    id: "daily",
    eyebrow: "Günlük Vitrin",
    headline: ["Günün her anına", "Funda'dan bir lezzet."],
    text: "Sabah böreklerinden çay saatine, mini tatlılardan el yapımı çikolatalara; günlük vitrinimizin sevilen lezzetleri her gün taze.",
    primary: { label: "Günlük Lezzetleri Keşfet", href: "/lezzetlerimiz" },
    secondary: { label: "Tüm Ürünler", href: "/lezzetlerimiz" },
    mediaType: "image",
    image: "/home/hero/2.png",
    fallbackVisual: "daily",
  },
  {
    id: "celebration",
    eyebrow: "Özel Günler",
    headline: ["Kutlamalarınıza", "yakışan pastalar."],
    text: "Doğum günü, nişan ve söz törenlerinden özel davetlere; anınıza özel tasarlanan, kişiye özel pastalar.",
    primary: { label: "Özel Gün Pastalarını Keşfet", href: "/ozel-gun" },
    secondary: { label: "Kişiye Özel Pasta", href: "/ozel-gun" },
    mediaType: "image",
    image: "/home/hero/3.png",
    fallbackVisual: "celebration",
  },
];
