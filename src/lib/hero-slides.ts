export type HeroSlideVisual = "heritage" | "celebration" | "daily";

export type HeroSlide = {
  id: string;
  headline: [string, string];
  text: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  tag?: { label: string; value: string };
  visual: HeroSlideVisual;
};

/**
 * Homepage hero slider — three calm slides that, in order, communicate
 * (1) brand heritage & trust, (2) celebration cake ordering,
 * (3) daily bakery culture. Text lives in a fixed left column; only the
 * visual and copy crossfade.
 */
export const heroSlides: HeroSlide[] = [
  {
    id: "heritage",
    headline: ["1959'dan bugüne", "aynı özen, aynı lezzet."],
    text: "Gelenekten aldığımız ustalıkla hazırlanan pastalar, tatlılar ve çikolatalar ile her günü biraz daha özel kılıyoruz.",
    primary: { label: "Pastaları Keşfet", href: "/lezzetlerimiz/yas-pastalar" },
    secondary: { label: "1959'dan Bugüne", href: "/hikayemiz" },
    tag: { label: "Bu haftanın imzası", value: "Çikolatalı Çilekli Pasta" },
    visual: "heritage",
  },
  {
    id: "celebration",
    headline: ["Kutlamalarınıza", "yakışan pastalar."],
    text: "Doğum günlerinden nişanlara, en özel anlarınız için özenle hazırlanan tasarım pastalar.",
    primary: { label: "Pastaları Keşfet", href: "/lezzetlerimiz/yas-pastalar" },
    secondary: { label: "Kişiye Özel Pasta", href: "/ozel-gun" },
    visual: "celebration",
  },
  {
    id: "daily",
    headline: ["Günün her anına", "Funda'dan bir lezzet."],
    text: "Tatlılardan çikolatalara, günlük vitrinimizin sevilen lezzetleriyle sofralarınıza eşlik ediyoruz.",
    primary: { label: "Günlük Lezzetleri Keşfet", href: "/lezzetlerimiz/borekler-ve-mayalilar" },
    secondary: { label: "Tüm Ürünler", href: "/lezzetlerimiz" },
    visual: "daily",
  },
];
