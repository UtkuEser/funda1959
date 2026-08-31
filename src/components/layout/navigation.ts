export type NavChild = { label: string; href: string };
export type NavItem = {
  label: string;
  href: string;
  children?: NavChild[];
  /** Slightly more prominent than the other links (no dropdown, no button). */
  emphasis?: boolean;
};

/**
 * Shared top navigation tree — consumed by the desktop dropdowns and the
 * mobile accordion so both stay in sync. Category depth lives here, not in
 * the header bar itself. Links only point to routes that already exist.
 */
export const navItems: NavItem[] = [
  { label: "Hızlı Sipariş", href: "/hizli-siparis", emphasis: true },
  {
    label: "Ürünler",
    href: "/lezzetlerimiz",
    children: [
      { label: "Yaş Pastalar", href: "/lezzetlerimiz/yas-pastalar" },
      { label: "Adet Pastalar", href: "/lezzetlerimiz/adet-pastalar" },
      { label: "Tatlılar", href: "/lezzetlerimiz/sutlu-tatlilar" },
      { label: "Börekler", href: "/lezzetlerimiz/borekler-ve-mayalilar" },
      { label: "Kuru Pastalar", href: "/lezzetlerimiz/kuru-pastalar" },
      { label: "Çikolatalar", href: "/lezzetlerimiz/cikolatalar" },
      { label: "Hediyelikler", href: "/hediyelikler" },
      { label: "Tüm Ürünler", href: "/lezzetlerimiz" },
    ],
  },
  {
    label: "Pastalar",
    href: "/lezzetlerimiz/yas-pastalar",
    children: [
      { label: "Tüm Pastalar", href: "/lezzetlerimiz/yas-pastalar" },
      { label: "Doğum Günü Pastaları", href: "/ozel-gun" },
      { label: "Düğün & Nişan Pastaları", href: "/ozel-gun" },
      { label: "Kişiye Özel Pastalar", href: "/ozel-gun" },
      { label: "Kutlama Pastaları", href: "/ozel-gun" },
      { label: "Fotoğraflı / Yazılı Pastalar", href: "/ozel-gun" },
    ],
  },
  {
    label: "Kutlamalar",
    href: "/ozel-gun",
    children: [
      { label: "Doğum Günü", href: "/ozel-gun" },
      { label: "Düğün & Nişan", href: "/ozel-gun" },
      { label: "Yeni İş / Tebrik", href: "/ozel-gun" },
      { label: "Yıldönümü", href: "/ozel-gun" },
      { label: "Baby Shower", href: "/ozel-gun" },
      { label: "Mezuniyet", href: "/ozel-gun" },
      { label: "Tüm Kutlamalar", href: "/ozel-gun" },
    ],
  },
  {
    label: "Günlük Lezzetler",
    href: "/lezzetlerimiz",
    children: [
      { label: "Börekler", href: "/lezzetlerimiz/borekler-ve-mayalilar" },
      { label: "Poğaçalar", href: "/lezzetlerimiz/borekler-ve-mayalilar" },
      { label: "Kruvasanlar", href: "/lezzetlerimiz/borekler-ve-mayalilar" },
      { label: "Kuru Pastalar", href: "/lezzetlerimiz/kuru-pastalar" },
      { label: "Tatlılar", href: "/lezzetlerimiz/sutlu-tatlilar" },
      { label: "Adet Pastalar", href: "/lezzetlerimiz/adet-pastalar" },
    ],
  },
  {
    label: "Hediyelikler",
    href: "/hediyelikler",
    children: [
      { label: "Çikolata Kutuları", href: "/lezzetlerimiz/cikolatalar" },
      { label: "Hediye Seçkileri", href: "/hediyelikler#hediye-secimi" },
      { label: "Özel Gün Hediyeleri", href: "/ozel-gun" },
      { label: "Kurumsal Hediyeler", href: "/hediyelikler#kurumsal" },
      { label: "Tüm Hediyelikler", href: "/hediyelikler" },
    ],
  },
  { label: "1959'dan Bugüne", href: "/hikayemiz" },
  { label: "Mağazalarımız", href: "/subeler" },
];
