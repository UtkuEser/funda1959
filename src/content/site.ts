/**
 * Marka künyesi, iletişim bilgileri ve navigasyon.
 * Site genelindeki sabit metinler burada yönetilir.
 */

export const site = {
  name: "Funda 1959",
  wordmark: "Funda",
  year: "1959",
  city: "Ankara",
  url: "https://funda1959.com",

  positioning: "Pastane kültürünün sıcak hali.",
  tagline: "Tatlı anların köklü adresi",
  description:
    "1959’dan gelen tatlı miras; bugün kahve molalarında, buluşmalarda ve sevdiklerinize götürdüğünüz küçük mutluluklarda yaşamaya devam ediyor.",
  shortDescription:
    "Ankara’nın köklü pastanesi Funda 1959; imza lezzetleri, hediye kutuları ve GOP, Panora, İncek şubeleriyle pastane kültürünü bugüne taşıyor.",

  phone: "+90 312 447 00 00",
  phoneHref: "tel:+903124470000",
  whatsapp: "https://wa.me/903124470000",
  email: "merhaba@funda1959.com",
  emailHref: "mailto:merhaba@funda1959.com",
  instagram: "https://www.instagram.com/funda.1959",
  instagramHandle: "@funda.1959",

  hours: "Her gün 08.00 – 22.00",
} as const;

export type NavItem = {
  href: string;
  label: string;
};

export const navigation: NavItem[] = [
  { href: "/hikayemiz", label: "Hikayemiz" },
  { href: "/lezzetler", label: "Lezzetler" },
  { href: "/imza-lezzetler", label: "İmza Lezzetler" },
  { href: "/subeler", label: "Şubeler" },
  { href: "/paket-hediye", label: "Paket & Hediye" },
  { href: "/iletisim", label: "İletişim" },
];

export const footerColumns: { title: string; items: NavItem[] }[] = [
  {
    title: "Funda",
    items: [
      { href: "/hikayemiz", label: "Hikayemiz" },
      { href: "/imza-lezzetler", label: "İmza Lezzetler" },
      { href: "/kurumsal", label: "Kurumsal & Toplu Sipariş" },
    ],
  },
  {
    title: "Lezzetler",
    items: [
      { href: "/lezzetler#kahvenin-yanina", label: "Kahvenin Yanına" },
      { href: "/lezzetler#eve-goturmelik", label: "Eve Götürmelik" },
      { href: "/lezzetler#ozel-gunler", label: "Özel Günler" },
    ],
  },
  {
    title: "Şubeler",
    items: [
      { href: "/subeler", label: "GOP" },
      { href: "/subeler", label: "Panora" },
      { href: "/subeler", label: "İncek" },
    ],
  },
  {
    title: "Paket & Hediye",
    items: [
      { href: "/paket-hediye", label: "Hediye Kutuları" },
      { href: "/paket-hediye", label: "Misafirlik & Ofis" },
      { href: "/paket-hediye", label: "Özel Gün Kutuları" },
    ],
  },
  {
    title: "İletişim",
    items: [
      { href: "/iletisim", label: "Sipariş & İletişim" },
      { href: site.phoneHref, label: site.phone },
      { href: site.emailHref, label: site.email },
    ],
  },
];

export const heroContent = {
  eyebrow: "1959’dan beri Ankara’da",
  title: "Pastane kültürünün sıcak hali.",
  description: site.description,
  /**
   * Hero videosu hazır olduğunda:  video: "/media/hero.mp4"
   * Poster/kapak görseli src/content/images.ts → images.hero üzerinden yönetilir.
   */
  video: undefined as string | undefined,
};


export const announcement = `${site.year}’dan beri ${site.city}’da · GOP · Panora · İncek`;
