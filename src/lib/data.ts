import { imageFromFolders, productImage } from "./product-images";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  gradient: string;
  accentColor: string;
};

export type Product = {
  id: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  description: string;
  shortDescription: string;
  tags: string[];
  isFeatured?: boolean;
  isSpecialOccasion?: boolean;
  gradient: string;
  price?: string;
};

/**
 * Extra fields the product catalog / listing experience needs. Kept as a
 * side map (not baked into `products`) so existing pages that import
 * `products` / `featuredProducts` stay untouched. Ready to move onto a
 * real product model / backend later.
 */
export type CatalogMeta = {
  priceValue: number;
  oldPrice?: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  isGift?: boolean;
  customizable?: boolean;
  servingOptions?: string[];
  weightOptions?: string[];
  features?: string[];
  occasions?: string[]; // cake occasion slugs (pasta category only)
  availableBranches?: string[]; // branch ids
};

export type CatalogProduct = Product &
  CatalogMeta & {
    displayPrice: string;
    /** the price a card shows and sorts by: the smallest size's, else the single price (D16) */
    cardPrice: number;
    slug: string;
    /** category-based demo photo (public path), or null -> gradient fallback */
    image: string | null;
  };

const TR_MAP: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
  Ç: "c", Ğ: "g", İ: "i", I: "i", Ö: "o", Ş: "s", Ü: "u",
};

export const slugify = (value: string): string =>
  value
    .split("")
    .map((c) => TR_MAP[c] ?? c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export type Branch = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  address: string;
  neighborhood: string;
  phone: string;
  mapUrl: string;
  hours: string;
  gradient: string;
};

export const categories: Category[] = [
  {
    id: "1",
    name: "Yaş Pastalar",
    slug: "yas-pastalar",
    description: "Doğum günlerinden özel kutlamalara, sizi ve sevdiklerinizi en iyi şekilde ifade edecek özel tasarım yaş pastalar. Her pasta, ustalarımızın elinden çıkan taze malzeme ve özgün tariflerle hazırlanır.",
    shortDescription: "Özel günlerinizin vazgeçilmez lezzeti",
    gradient: "from-[#F0D5C5] to-[#E8B896]",
    accentColor: "#C4762A",
  },
  {
    id: "2",
    name: "Adet Pastalar",
    slug: "adet-pastalar",
    description: "Dilimlere ayrılmış, dilediğiniz kadar alabildiğiniz pastalarımız. Hem vitrinimizde hem de siparişle sunulan adet pastalarımız, her gün taze olarak hazırlanır.",
    shortDescription: "Dilediğiniz kadar, her gün taze",
    gradient: "from-[#E8D5C5] to-[#D4B896]",
    accentColor: "#A87B2F",
  },
  {
    id: "3",
    name: "Mini Lezzetler",
    slug: "mini-lezzetler",
    description: "Bir lokmalık mutluluk. Karşılaşmalarda, toplantılarda veya sadece kendinize bir ödül olarak tercih edebileceğiniz küçük ama özenle hazırlanmış lezzetler.",
    shortDescription: "Bir lokmalık, tam anlamıyla özel",
    gradient: "from-[#F0E5D5] to-[#E8D0A8]",
    accentColor: "#C4962A",
  },
  {
    id: "4",
    name: "Kuru Pastalar",
    slug: "kuru-pastalar",
    description: "Günlük hayatın vazgeçilmezi, çayın yanında ya da yolculuklarda eşliğinde taşıyabileceğiniz kuru pastalar. Geleneksel tariflerden ilham alarak hazırlanan kurabiyeler, biscotti ve kurabiyeler.",
    shortDescription: "Çayın yanında, her anın tadı",
    gradient: "from-[#EAD8C0] to-[#D4C0A0]",
    accentColor: "#8B5E3C",
  },
  {
    id: "5",
    name: "Atıştırmalıklar",
    slug: "atistirmaliklar",
    description: "Kahve molasında, öğleden sonra bir pauzda veya misafirlerinize ikram etmek için ideal atıştırmalıklar. Tatlı ve tuzlu seçeneklerle zengin bir çeşitlilik.",
    shortDescription: "Her anın tatlı molası",
    gradient: "from-[#F5EAD5] to-[#E8D5B0]",
    accentColor: "#7B4A2D",
  },
  {
    id: "6",
    name: "Börekler & Mayalılar",
    slug: "borekler-ve-mayalilar",
    description: "Sabah kahvaltısından öğle aralarına, geleneksel Türk börek ve çörek ustalarımızın elinden çıkan lezzetler. Her gün taze hazırlanan çeşitlerle.",
    shortDescription: "Gelenekten gelen hamur işi lezzetleri",
    gradient: "from-[#EAD5C0] to-[#D8C0A0]",
    accentColor: "#6B4423",
  },
  {
    id: "7",
    name: "Kekler",
    slug: "kekler",
    description: "Sade kekten meyveli, çikolatalı ve özel kaplama seçeneklerine uzanan geniş kek yelpazemiz. Her biri taze malzeme ve sevgiyle pişirilir.",
    shortDescription: "Sıcacık fırından, her gün taze",
    gradient: "from-[#F0D8D0] to-[#E8C0B0]",
    accentColor: "#6B2737",
  },
  {
    id: "8",
    name: "Şerbetli Tatlılar",
    slug: "serbetli-tatlilar",
    description: "Baklava, kadayıf ve Osmanlı mutfağından ilham alan şerbetli tatlılar. Geleneksel tariflere sadık kalarak, en kaliteli malzemelerle hazırlanan lezzetler.",
    shortDescription: "Osmanlı lezzet geleneğinin günümüzdeki yansıması",
    gradient: "from-[#F0E0D5] to-[#E0C8B8]",
    accentColor: "#A87B2F",
  },
  {
    id: "9",
    name: "Sütlü Tatlılar",
    slug: "sutlu-tatlilar",
    description: "Kazandibi, sütlaç, muhallebi ve daha fazlası. Geleneksel Türk sütlü tatlılarının zarif yorumları, her günü tatlılaştıran hafif ve kremsi lezzetler.",
    shortDescription: "Geleneksel tarifler, modern dokunuş",
    gradient: "from-[#F5EFEA] to-[#ECDDD0]",
    accentColor: "#8B5E3C",
  },
  {
    id: "10",
    name: "Çikolatalar",
    slug: "cikolatalar",
    description: "El yapımı pralin, trüf ve çikolata koleksiyonumuz. Kutu hediyelik seçeneklerinden günlük şekerleme çeşitlerine kadar her damak zevkine hitap eden çikolatalar.",
    shortDescription: "El yapımı, gönülden hediyeler",
    gradient: "from-[#D8C0A8] to-[#C0A080]",
    accentColor: "#3D2015",
  },
  {
    id: "11",
    name: "Özel Gün",
    slug: "ozel-gun",
    description: "Doğum günleri, nişanlar, düğünler, bebek şekeri, mezuniyet ve kurumsal etkinlikler için tasarlanan özel siparişler. Her özel anınız için kişiselleştirilmiş lezzetler.",
    shortDescription: "Her kutlamanın en tatlı anı",
    gradient: "from-[#F0E8D5] to-[#D4B896]",
    accentColor: "#C4962A",
  },
];

export const products: Product[] = [
  // Yaş Pastalar
  {
    id: "p1",
    name: "Çikolatalı Çilekli Pasta",
    categorySlug: "yas-pastalar",
    categoryName: "Yaş Pastalar",
    description: "Belçika çikolatası ganajı ve taze çilek dilimleriyle hazırlanan bu pasta, her katmanında ayrı bir lezzet sunar. Çikolata bisküvi tabanı, hafif krema dolgusu ve taze meyvelerle tamamlanan zarif bir sunum.",
    shortDescription: "Belçika çikolatası ve taze çilek dilimleriyle",
    tags: ["çikolatalı", "meyveli", "kutlama"],
    isFeatured: true,
    isSpecialOccasion: true,
    gradient: "from-[#E8C5B5] to-[#D4A898]",
    price: "₺780",
  },
  {
    id: "p2",
    name: "Vanilyalı Profiterol Pastası",
    categorySlug: "yas-pastalar",
    categoryName: "Yaş Pastalar",
    description: "Fransız pâte à choux hamuru üzerine vanilya kreması ve çikolata sosu ile hazırlanan bu pasta, katmanların arasındaki uyumlu denge ile öne çıkar.",
    shortDescription: "Fransız ustalığıyla vanilya ve çikolata",
    tags: ["vanilyalı", "çikolatalı", "özel"],
    isFeatured: true,
    gradient: "from-[#F0E0D0] to-[#E8CDB5]",
    price: "₺720",
  },
  {
    id: "p3",
    name: "Meyveli Mousse Pasta",
    categorySlug: "yas-pastalar",
    categoryName: "Yaş Pastalar",
    description: "Mango, çilek ve frambuaz gibi tropikal meyvelerin hafif mousse kremasıyla buluştuğu, nefis bir yaz pastası.",
    shortDescription: "Hafif mousse, tropikal meyve karışımı",
    tags: ["meyveli", "hafif", "yaz"],
    gradient: "from-[#F0D8C8] to-[#E8C8B0]",
  },
  {
    id: "p4",
    name: "Karamelli Fındıklı Pasta",
    categorySlug: "yas-pastalar",
    categoryName: "Yaş Pastalar",
    description: "Türk fındığı ve taze karamel sosuyla hazırlanan, ağzınızda eriyen pastamız. Her dilimde hem gevrek hem de kremsi dokular.",
    shortDescription: "Türk fındığı ve taze karamel sosu",
    tags: ["fındıklı", "karamelli", "zengin"],
    isFeatured: true,
    gradient: "from-[#E8D0B0] to-[#D4B890]",
    price: "₺760",
  },
  // Mini Lezzetler
  {
    id: "p5",
    name: "Çikolatalı Macaron",
    categorySlug: "mini-lezzetler",
    categoryName: "Mini Lezzetler",
    description: "Paris usulü, badem unu ile hazırlanmış, içi Belçika çikolata ganajı dolu macaronlar. Her renk ayrı bir tat profili taşır.",
    shortDescription: "Paris usulü badem unu macaronlar",
    tags: ["çikolatalı", "Fransız", "hediye"],
    isFeatured: true,
    gradient: "from-[#E8D5C5] to-[#D5C0B0]",
    price: "₺45 / adet",
  },
  {
    id: "p6",
    name: "Tiramisu Shot",
    categorySlug: "mini-lezzetler",
    categoryName: "Mini Lezzetler",
    description: "Maskarpone kreması, espresso emdirilmiş bisküvi ve kakao tozu ile tek servislik tiramisu. İtalyan tatlı geleneğinin Funda yorumu.",
    shortDescription: "İtalyan tiramisu, tek servislik",
    tags: ["kahveli", "kremali", "İtalyan"],
    isFeatured: true,
    gradient: "from-[#E0D0C0] to-[#CDBBA8]",
    price: "₺95",
  },
  {
    id: "p7",
    name: "Cheesecake Bite",
    categorySlug: "mini-lezzetler",
    categoryName: "Mini Lezzetler",
    description: "New York cheesecake tabanından ilham alınarak hazırlanan bu minik lezzetler, bisküvi tabanı ve krem peynir dolgusuyla tam bir minyatür cheesecake.",
    shortDescription: "Minyatür New York cheesecake",
    tags: ["peynirli", "bisküvili", "kremali"],
    gradient: "from-[#F5EFE8] to-[#EDE0D0]",
  },
  // Kuru Pastalar
  {
    id: "p8",
    name: "Tereyağlı Bademli Kurabiye",
    categorySlug: "kuru-pastalar",
    categoryName: "Kuru Pastalar",
    description: "Taze çekilmiş badem unuyla yapılan, ağzınızda dağılan tereyağlı kurabiyeler. Çay saatinin en değerli arkadaşı.",
    shortDescription: "Ağzınızda dağılan, tereyağlı lezzet",
    tags: ["bademli", "tereyağlı", "çay yanı"],
    isFeatured: true,
    gradient: "from-[#EAD8C0] to-[#D8C5A8]",
    price: "₺420 / kg",
  },
  {
    id: "p9",
    name: "Şekerpare",
    categorySlug: "kuru-pastalar",
    categoryName: "Kuru Pastalar",
    description: "Geleneksel Türk mutfağının sevilen lezzeti şekerpare. Üzerine sürülen fıstıkla daha da zenginleşen tarifimiz.",
    shortDescription: "Geleneksel tarif, üstüne fıstıklı",
    tags: ["geleneksel", "fıstıklı", "tatlı"],
    gradient: "from-[#E8D5B5] to-[#D8C0A0]",
  },
  // Şerbetli Tatlılar
  {
    id: "p10",
    name: "Sade Baklava",
    categorySlug: "serbetli-tatlilar",
    categoryName: "Şerbetli Tatlılar",
    description: "40 kat yufkadan oluşan, içi antep fıstığı dolu geleneksel baklavamız. Özel şerbeti ve çıtır katmanlarıyla Osmanlı mutfağının simgesi.",
    shortDescription: "40 kat yufka, antep fıstığı dolgu",
    tags: ["geleneksel", "fıstıklı", "şerbetli"],
    isFeatured: true,
    gradient: "from-[#F0E0C8] to-[#E0CCA8]",
  },
  {
    id: "p11",
    name: "Fındıklı Kadayıf",
    categorySlug: "serbetli-tatlilar",
    categoryName: "Şerbetli Tatlılar",
    description: "Tel kadayıfın içinde Türk fındığı ve taze kaymak. Altın rengi şerbetiyle ıslatılmış kadayıf, her lokması dolu dolu bir lezzet.",
    shortDescription: "Tel kadayıf, fındık ve taze kaymak",
    tags: ["fındıklı", "şerbetli", "geleneksel"],
    gradient: "from-[#E8D8C0] to-[#D8C5A5]",
  },
  // Sütlü Tatlılar
  {
    id: "p12",
    name: "Kazandibi",
    categorySlug: "sutlu-tatlilar",
    categoryName: "Sütlü Tatlılar",
    description: "Geleneksel Osmanlı mutfağından gelen bu kremsi tatlı, tabanındaki karamelize tabakası ve yumuşak kıvamıyla ayrı bir deneyim sunar.",
    shortDescription: "Karamelize tabanlı geleneksel Osmanlı tatlısı",
    tags: ["kremali", "geleneksel", "sütlü"],
    isFeatured: true,
    gradient: "from-[#F5EFEA] to-[#EDE0D5]",
  },
  // Çikolatalar
  {
    id: "p13",
    name: "El Yapımı Trüf Çikolata",
    categorySlug: "cikolatalar",
    categoryName: "Çikolatalar",
    description: "Kakao oranı yüksek Belçika çikolatası ve taze krema ile hazırlanan el yapımı trüf çikolatalar. Kutularda hediyelik seçenekleriyle.",
    shortDescription: "Belçika çikolatası, el yapımı trüf",
    tags: ["hediye", "el yapımı", "premium"],
    isFeatured: true,
    gradient: "from-[#D8C0A8] to-[#C0A080]",
  },
  {
    id: "p14",
    name: "Pralinli Çikolata Kutusu",
    categorySlug: "cikolatalar",
    categoryName: "Çikolatalar",
    description: "12 çeşit pralin ve ganaj dolgulu çikolata içeren özel hediyelik kutu. Her biri özenle seçilmiş çikolata türleri ve aromalar.",
    shortDescription: "12 çeşit pralin, özel hediyelik kutu",
    tags: ["hediye", "pralinli", "premium"],
    gradient: "from-[#D0B8A0] to-[#B8A085]",
  },
  // Özel Gün
  {
    id: "p15",
    name: "Nişan Pastası",
    categorySlug: "ozel-gun",
    categoryName: "Özel Gün",
    description: "İki katlı, çiçek ve altın detaylarla süslenmiş nişan pastası. Özel gün anılarınızı taçlandıracak kişiselleştirilmiş tasarım.",
    shortDescription: "İki katlı, çiçek ve altın süslemeler",
    tags: ["nişan", "özel tasarım", "hediye"],
    isSpecialOccasion: true,
    gradient: "from-[#F0E8D5] to-[#E8D4B5]",
  },
  {
    id: "p16",
    name: "Doğum Günü Koleksiyonu",
    categorySlug: "ozel-gun",
    categoryName: "Özel Gün",
    description: "Her yaş için kişiselleştirilebilen doğum günü pastaları. Çocuktan yetişkine, sade yorumdan karmaşık tasarıma geniş bir yelpaze.",
    shortDescription: "Her yaş için kişiselleştirilebilen",
    tags: ["doğum günü", "kişiselleştirilebilir", "her yaş"],
    isSpecialOccasion: true,
    isFeatured: true,
    gradient: "from-[#F0E0D0] to-[#E8CDB8]",
  },
  // Börekler
  {
    id: "p17",
    name: "Su Böreği",
    categorySlug: "borekler-ve-mayalilar",
    categoryName: "Börekler & Mayalılar",
    description: "Haşlanmış yufkalar, peynir ve maydanoz iç harcı ile hazırlanan ev yapımı su böreği. Her sabah taze pişirilir.",
    shortDescription: "Ev yapımı, her sabah taze pişirilir",
    tags: ["geleneksel", "peynirli", "sabah"],
    gradient: "from-[#EAD5C0] to-[#D8C0A0]",
  },
  // Kekler
  {
    id: "p18",
    name: "Portakallı Mermer Kek",
    categorySlug: "kekler",
    categoryName: "Kekler",
    description: "Taze portakal kabuğu rendesiyle aromalandırılan, çikolatalı ve vanilyalı mermer deseniyle hazırlanan kek. Her dilimde farklı bir tat katmanı.",
    shortDescription: "Taze portakal kabuğu, mermer desenli",
    tags: ["portakallı", "çikolatalı", "taze"],
    isFeatured: true,
    gradient: "from-[#F0D8C8] to-[#E8C8B0]",
  },
];

export const branches: Branch[] = [
  {
    id: "gop",
    name: "Funda 1959 GOP",
    shortName: "GOP",
    description: "Gaziosmanpaşa'nın kalbinde, Ankara'nın en prestijli mahallelerinden birinde yer alan ana şubemiz. Geniş oturma alanı ve tam ürün çeşidiyle hizmetinizde.",
    address: "Kızkulesi Sokak No:12/A, Gaziosmanpaşa, Ankara",
    neighborhood: "Gaziosmanpaşa",
    phone: "+90 312 447 00 00",
    mapUrl: "https://maps.google.com/?q=Gaziosmanpaşa+Ankara",
    hours: "Hft İçi: 08:00 – 22:00 | Hft Sonu: 08:00 – 23:00",
    gradient: "from-[#F0E8D5] to-[#E8D5B5]",
  },
  {
    id: "panora",
    name: "Funda 1959 Panora",
    shortName: "Panora",
    description: "Panora AVM içindeki şubemiz, alışveriş aralarında ya da özel bir buluşma için ideal bir durak. Modern iç mekanı ve geniş pastane vitriниyle.",
    address: "Panora AVM, Kızılay, Ankara",
    neighborhood: "Kızılay",
    phone: "+90 312 448 00 00",
    mapUrl: "https://maps.google.com/?q=Panora+AVM+Ankara",
    hours: "Her Gün: 10:00 – 22:00",
    gradient: "from-[#EDE5D8] to-[#E0D0C0]",
  },
  {
    id: "incek",
    name: "Funda 1959 İncek",
    shortName: "İncek TONA",
    description: "İncek TONA Residence'ın içinde yer alan en yeni şubemiz. Sakin ve yeşil bir ortamda premium cafe-patisserie deneyimi.",
    address: "TONA Residence, Alacaatlı Mahallesi, Kanuni Sultan Süleyman Bulvarı D:160/K, Çankaya/Ankara",
    neighborhood: "Alacaatlı",
    phone: "+90 312 449 00 00",
    mapUrl: "https://maps.google.com/?q=İncek+TONA+Residence+Ankara",
    hours: "Her Gün: 09:00 – 22:00",
    gradient: "from-[#EAE2D5] to-[#DDD0C0]",
  },
];

export const storyTimeline = [
  {
    year: "1959",
    title: "Kökler",
    description: "Ankara'nın kalbinde, küçük ama özeni büyük bir dükkânda başlayan bir lezzet hikayesi. Kurucumuz, aileden gelen ustalığı ve şehrin tatlı özlemini bir araya getirdi.",
  },
  {
    year: "1970'ler",
    title: "Pastacılığa Geçiş",
    description: "Geleneksel Türk tatlılarının yanı sıra Avrupa pastacılığından ilham alarak vitrinimize yeni lezzetler kattık. Fransız usulü kremalı pastalar ve el yapımı çikolatalar dönemin yenilikleriydi.",
  },
  {
    year: "1990'lar",
    title: "Ankara'da Funda 1959",
    description: "Marka adını ve kimliğini pekiştirdiğimiz on yıl. Gaziosmanpaşa şubemiz Ankaralıların gözde buluşma noktalarından birine dönüştü.",
  },
  {
    year: "2010'lar",
    title: "Büyüyen Bir Aile",
    description: "Panora şubesiyle yeni bir sayfanın başlangıcı. Şehrin farklı noktalarına yayılırken marka özümüzdeki kaliteden asla taviz vermedik.",
  },
  {
    year: "Bugün",
    title: "Gelenekten Geleceğe",
    description: "Üç şube, on yılların birikimi ve hâlâ aynı özenle hazırlanan lezzetler. Funda 1959, geçmişinden güç alarak geleceğe yürümeye devam ediyor.",
  },
];

export const featuredProducts = products.filter(p => p.isFeatured);
export const specialOccasionProducts = products.filter(p => p.isSpecialOccasion);

/* Curated showcase for the homepage vitrine (İmza Lezzetlerimiz) — the first
 * featured product from four different categories, so the four cards show four
 * different demo photos. */
export const signatureProducts = (() => {
  const seen = new Set<string>();
  const picks: Product[] = [];
  for (const p of featuredProducts) {
    if (seen.has(p.categorySlug)) continue;
    seen.add(p.categorySlug);
    picks.push(p);
    if (picks.length === 4) break;
  }
  return picks;
})();

/* Homepage — kategori kartları. Every href is a real route; `links` are the
 * card's sub-options (revealed on hover/focus) and the card's "N farklı
 * seçenek" line counts exactly those links. */
export type HomeCategory = {
  name: string;
  href: string;
  image: string;
  alt: string;
  links: { label: string; href: string }[];
};

export const homeCategories: HomeCategory[] = [
  {
    name: "Pastalar",
    href: "/lezzetlerimiz/yas-pastalar",
    image: "/products/yas-pastalar/yaspasta3.jpg",
    alt: "Çikolata yapraklarıyla çevrili, kakaolu yaş pasta",
    links: [
      { label: "Yaş Pastalar", href: "/lezzetlerimiz/yas-pastalar" },
      { label: "Adet Pastalar", href: "/lezzetlerimiz/adet-pastalar" },
      { label: "Özel Gün Pastaları", href: "/lezzetlerimiz/ozel-gun" },
      { label: "Kutlama Pastanızı Bulun", href: "/ozel-gun" },
    ],
  },
  {
    name: "Çikolatalar",
    href: "/lezzetlerimiz/cikolatalar",
    image: "/products/cikolatalar/cikolatalar1-detay.jpg",
    alt: "Siyah kutuda el yapımı çikolatalar",
    links: [
      { label: "El Yapımı Trüf Çikolata", href: "/urunler/el-yapimi-truf-cikolata" },
      { label: "Pralinli Çikolata Kutusu", href: "/urunler/pralinli-cikolata-kutusu" },
      { label: "Hediye Seçkileri", href: "/hediyelikler" },
    ],
  },
  {
    name: "Tatlılar",
    href: "/lezzetlerimiz/tatlilar",
    image: "/products/sutlu-tatlilar/sutlu3.jpg",
    alt: "Cam kasede, üstü karamelize sütlü tatlı",
    links: [
      { label: "Sütlü Tatlılar", href: "/lezzetlerimiz/sutlu-tatlilar" },
      { label: "Şerbetli Tatlılar", href: "/lezzetlerimiz/serbetli-tatlilar" },
      { label: "Mini Lezzetler", href: "/lezzetlerimiz/mini-lezzetler" },
      { label: "Kekler", href: "/lezzetlerimiz/kekler" },
    ],
  },
  {
    name: "Börekler",
    href: "/lezzetlerimiz/borekler",
    image: "/products/borekler-ve-mayalilar/borek2.jpg",
    alt: "Mermer tabakta çıtır börekler",
    links: [
      { label: "Börekler & Mayalılar", href: "/lezzetlerimiz/borekler-ve-mayalilar" },
      { label: "Atıştırmalıklar", href: "/lezzetlerimiz/atistirmaliklar" },
      { label: "Kuru Pastalar", href: "/lezzetlerimiz/kuru-pastalar" },
    ],
  },
];

/* Homepage — Hediyelik Seçimler / Sevdiklerinize Funda'dan */
export const giftHeroImage = imageFromFolders(["cikolatalar", "kuru-pastalar", "atistirmaliklar"], 0);

export const giftCollections = [
  {
    title: "Hediyelik Çikolatalar",
    description: "El yapımı pralin ve trüf çeşitleriyle hazırlanan çikolatalar.",
    href: "/lezzetlerimiz/cikolatalar",
    gradient: "from-[#D8C1A8] to-[#B4906F]",
    image: imageFromFolders(["cikolatalar"], 0),
  },
  {
    title: "Özel Kutular",
    description: "Doğum günü, yeni iş ya da bir teşekkür için özenle hazırlanan kutular.",
    href: "/lezzetlerimiz/cikolatalar",
    gradient: "from-[#EDE3D2] to-[#D6C0A4]",
    image: imageFromFolders(["kuru-pastalar", "atistirmaliklar"], 0),
  },
  {
    title: "Tatlı & Kurabiye Seçkileri",
    description: "Çayın yanına yakışan kurabiye ve mini tatlı derlemeleri.",
    href: "/lezzetlerimiz/kuru-pastalar",
    gradient: "from-[#EAD9C0] to-[#D2B78E]",
    image: imageFromFolders(["atistirmaliklar", "kuru-pastalar"], 0),
  },
];

/* Homepage — brand-story band. No dedicated archive photo yet; the "1959'dan
 * Bugüne" hero still is reused with a light warm/sepia treatment in the UI. */
export const brandStoryImage = "/home/hero/1.png";

/* Homepage — kısa marka zaman çizelgesi */
export const homeStoryMilestones = [
  { year: "1959", label: "Kuruluş" },
  { year: "1980", label: "Pastacılığa geçiş" },
  { year: "Bugün", label: "Üç mağaza" },
];

export const getCategoryBySlug = (slug: string) =>
  categories.find(c => c.slug === slug);

export const getProductsByCategory = (slug: string) =>
  products.filter(p => p.categorySlug === slug);

/* ---------------------------------------------------------------------------
 * Product detail model: sizes and their catalog prices (used by the catalog
 * cards below and by the detail page)
 * ------------------------------------------------------------------------- */

export type DeliveryType = "address" | "pickup";
export type VariantKind = "serving" | "weight" | "pack" | "none";
export type ProductVariant = {
  id: string;
  label: string;
  price: number;
  /** struck-through old price of this size, where we set one (D18, D21) */
  oldPrice?: string;
};

type ProductDetailMeta = {
  longDescription?: string;
  images?: string[]; // gradient class fragments used as placeholders
  maxCakeMessageLength?: number;
  availableDeliveryTypes?: DeliveryType[];
  extraOptions?: string[];
  allergens?: string;
  ingredients?: string;
  storageInfo?: string;
  deliveryInfo?: string;
  quantityEnabled?: boolean;
  relatedProductIds?: string[];
};

export type ProductDetail = CatalogProduct & {
  variantKind: VariantKind;
  basePrice: number;
  variants: ProductVariant[];
  longDescription: string;
  images: string[];
  imageLabels: string[];
  maxCakeMessageLength: number | null;
  availableDeliveryTypes: DeliveryType[];
  extraOptions: string[];
  allergens: string;
  ingredients: string;
  storageInfo: string;
  deliveryInfo: string;
  quantityEnabled: boolean;
  relatedProducts: CatalogProduct[];
};

export const deliveryTimeSlots = [
  "10:00 – 12:00",
  "12:00 – 14:00",
  "14:00 – 16:00",
  "16:00 – 18:00",
  "18:00 – 20:00",
];

/* sizes, smallest first: [id, label] */
const SERVING: [string, string][] = [["4-6", "4–6 Kişilik"], ["8-10", "8–10 Kişilik"], ["12-15", "12–15 Kişilik"], ["15-20", "15–20 Kişilik"]];
const WEIGHT: [string, string][] = [["500g", "500 g"], ["1kg", "1 kg"], ["1.5kg", "1.5 kg"]];
const PACK: [string, string][] = [["6", "6'lı"], ["12", "12'li"], ["24", "24'lü"]];
const sized = (kinds: [string, string][], prices: number[]): ProductVariant[] =>
  prices.map((price, i) => ({ id: kinds[i][0], label: kinds[i][1], price }));

/**
 * Size prices (SUPABASE_PLAN.md, D20): every size has its own price and Merkez
 * changes them one by one — no multiplier. These are the prices the site
 * showed while sizes were still derived from a base price × category
 * multiplier, kept unchanged as the starting values; a stored price
 * (`product_prices`, key = size id) replaces one size. Smallest size first.
 */
const SIZE_PRICES: Record<string, ProductVariant[]> = {
  p1: sized(SERVING, [780, 1050, 1450]),
  p2: sized(SERVING, [720, 970, 1330, 1730]),
  p3: sized(SERVING, [740, 1000, 1370, 1780]),
  p4: sized(SERVING, [760, 1030, 1410, 1820]),
  p8: sized(WEIGHT, [230, 420, 610]),
  p9: sized(WEIGHT, [200, 360, 520]),
  p10: sized(WEIGHT, [350, 640, 930]),
  p11: sized(WEIGHT, [310, 560, 810]),
  // D21: the struck-through ₺580 belongs to the 12'li pack only
  p13: [
    { id: "6", label: "6'lı", price: 260 },
    { id: "12", label: "12'li", price: 520, oldPrice: "₺580" },
    { id: "24", label: "24'lü", price: 990 },
  ],
  p14: sized(PACK, [450, 890, 1690]),
  p15: sized(SERVING, [1450, 1960, 2680, 3480]),
  p16: sized(SERVING, [950, 1280, 1760, 2280]),
};

export function variantKindFor(categorySlug: string): VariantKind {
  if (["yas-pastalar", "ozel-gun"].includes(categorySlug)) return "serving";
  if (["kuru-pastalar", "serbetli-tatlilar"].includes(categorySlug)) return "weight";
  if (categorySlug === "cikolatalar") return "pack";
  return "none";
}

/** The sizes each kind offers, smallest first — a product added in the panel (D45) picks from these. */
export const SIZE_OPTIONS: Record<Exclude<VariantKind, "none">, { id: string; label: string }[]> = {
  serving: SERVING.map(([id, label]) => ({ id, label })),
  weight: WEIGHT.map(([id, label]) => ({ id, label })),
  pack: PACK.map(([id, label]) => ({ id, label })),
};

const productDetailMeta: Record<string, ProductDetailMeta> = {
  p1: {
    longDescription:
      "Yoğun çikolata kreması, taze çilekler ve yumuşak pandispanya ile hazırlanan Funda klasiklerinden. Belçika çikolatası ganajıyla kaplanır; her katmanında taze meyve dilimleri bulunur. Doğum günü ve kutlamaların vazgeçilmezi.",
    maxCakeMessageLength: 40,
    availableDeliveryTypes: ["address", "pickup"],
    extraOptions: ["Mum Ekle", "Doğum Günü Kartı", "Hediye Notu"],
    allergens: "Gluten, süt ürünü, yumurta ve fındık içerebilir.",
    ingredients:
      "Pandispanya (buğday unu, yumurta, şeker), çikolatalı krema, taze çilek, Belçika çikolatası ganajı, krem şanti.",
    storageInfo:
      "+2 / +4 °C arasında buzdolabında saklayınız. Hazırlandığı gün tüketilmesi önerilir, en geç 2 gün içinde tüketiniz.",
    deliveryInfo:
      "Ürün seçtiğiniz şubede mevcutsa bugün için de sipariş verebilirsiniz; seçilebilecek tarih ve saatler adres veya mağaza seçiminizden sonra gösterilir. Adrese teslim ve mağazadan teslim seçenekleri mevcuttur.",
    quantityEnabled: false,
    relatedProductIds: ["p2", "p4", "p18", "p16"],
  },
};

/** The sizes a product sells in with their catalog prices, smallest first ([] = a single price). */
export function productSizes(product: Pick<CatalogProduct, "id">): ProductVariant[] {
  return SIZE_PRICES[product.id] ?? addedProductSizes(product.id);
}

/* ---------------------------------------------------------------------------
 * Product catalog (Lezzetlerimiz listing)
 * ------------------------------------------------------------------------- */

const ALL_BRANCHES = ["gop", "panora", "incek"];

const catalogMeta: Record<string, CatalogMeta> = {
  p1: { priceValue: 780, isBestSeller: true, customizable: true, servingOptions: ["8–10 Kişilik"], occasions: ["kutlama", "kisiye-ozel"], features: ["Yazı Eklenebilir", "Kişiselleştirilebilir"], availableBranches: ALL_BRANCHES },
  p2: { priceValue: 720, servingOptions: ["8–10 Kişilik"], occasions: ["kutlama"], features: ["Yazı Eklenebilir"], availableBranches: ALL_BRANCHES },
  p3: { priceValue: 740, isNew: true, servingOptions: ["4–6 Kişilik"], occasions: ["kutlama"], availableBranches: ["gop", "panora"] },
  p4: { priceValue: 760, servingOptions: ["12–15 Kişilik"], occasions: ["dogum-gunu", "kutlama"], availableBranches: ALL_BRANCHES },
  p5: { priceValue: 45, isGift: true, availableBranches: ALL_BRANCHES },
  p6: { priceValue: 95, availableBranches: ALL_BRANCHES },
  p7: { priceValue: 85, isNew: true, availableBranches: ["gop", "incek"] },
  p8: { priceValue: 420, isBestSeller: true, weightOptions: ["500 g", "1 kg"], availableBranches: ALL_BRANCHES },
  p9: { priceValue: 360, weightOptions: ["1 kg"], availableBranches: ALL_BRANCHES },
  p10: { priceValue: 640, isBestSeller: true, weightOptions: ["500 g", "1 kg"], availableBranches: ALL_BRANCHES },
  p11: { priceValue: 560, weightOptions: ["1 kg"], availableBranches: ["gop", "panora"] },
  p12: { priceValue: 120, availableBranches: ALL_BRANCHES },
  p13: { priceValue: 520, isBestSeller: true, isGift: true, availableBranches: ALL_BRANCHES },
  p14: { priceValue: 890, isNew: true, isGift: true, availableBranches: ["gop", "panora"] },
  p15: { priceValue: 1450, customizable: true, servingOptions: ["15+ Kişilik"], occasions: ["dugun-nisan", "kisiye-ozel"], features: ["Özel Tasarım", "Kişiselleştirilebilir", "Yazı Eklenebilir"], availableBranches: ["gop", "incek"] },
  p16: { priceValue: 950, isBestSeller: true, customizable: true, isGift: true, servingOptions: ["8–10 Kişilik"], occasions: ["dogum-gunu", "kisiye-ozel"], features: ["Kişiselleştirilebilir", "Yazı Eklenebilir", "Fotoğraflı Pasta"], availableBranches: ALL_BRANCHES },
  p17: { priceValue: 280, weightOptions: ["1 kg"], availableBranches: ALL_BRANCHES },
  p18: { priceValue: 240, oldPrice: "₺290", isBestSeller: true, availableBranches: ALL_BRANCHES },
};

const categoryImageIndex = new Map<string, number>();

export const catalogProducts: CatalogProduct[] = products.map((p) => {
  const meta = catalogMeta[p.id] ?? { priceValue: 0 };
  const idx = categoryImageIndex.get(p.categorySlug) ?? 0;
  categoryImageIndex.set(p.categorySlug, idx + 1);
  // D16: a card shows the smallest size's price as it is (no "from" wording),
  // and only that size's old price, if it has one (D21)
  const smallest = productSizes(p)[0];
  return {
    ...p,
    ...meta,
    slug: slugify(p.name),
    cardPrice: smallest?.price ?? meta.priceValue,
    displayPrice: smallest ? `₺${smallest.price.toLocaleString("tr-TR")}` : p.price ?? `₺${meta.priceValue.toLocaleString("tr-TR")}`,
    oldPrice: smallest ? smallest.oldPrice : meta.oldPrice,
    image: productImage(p.categorySlug, idx),
  };
});

/* ---------------------------------------------------------------------------
 * Products added in the admin panel (D45) — published ones only
 *
 * The 18 products above stay in code with their ids. Products Merkez adds
 * live in the database (`catalog_products`, 0013); the server loads the
 * PUBLISHED ones (never drafts or unpublished ones) and registers them here
 * (`setPublishedProducts`), and pages hand the same list to the browser, so
 * every listing, search, detail page and order check sees one catalog:
 * `allCatalogProducts()`. Nothing registered -> exactly the code catalog.
 * ------------------------------------------------------------------------- */

/** A published product from the database, as the storefront needs it (no audit fields). */
export type PublishedProduct = {
  /** "n" + 12 hex — never one of the code ids */
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  shortDescription: string;
  /** public image address, or null (gradient placeholder) */
  imageUrl: string | null;
  /** catalog prices: one per size id (smallest first), or a single `{ key: "" }` */
  sizes: { key: string; price: number }[];
  /** only what Merkez entered — null when nothing was entered (never generated) */
  allergens: string | null;
  /** the customer may write a message on it (pasta yazısı) */
  cakeMessage: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  isGift: boolean;
  /** branch -> active (true) / passive (false), until the branch's own stock rows exist */
  branchStock: Record<string, boolean>;
  updatedAt: string;
};

type AddedCatalog = {
  /** published products + hidden code products: changes when either does */
  key: string;
  published: Map<string, PublishedProduct>;
  products: CatalogProduct[];
  /** code products Merkez took off the site ("Yayında" unticked, D48) */
  hidden: Set<string>;
  /** the storefront: visible code products, then published panel products */
  all: CatalogProduct[];
  /** for the panel: every code product (hidden ones too), then published panel products */
  withHidden: CatalogProduct[];
};

/**
 * The registered list lives on globalThis (shared by the server's module
 * copies). Read through a function: `catalogProducts` above is built while
 * this module loads and already asks `productSizes` -> here.
 */
function addedCatalog(): AddedCatalog | undefined {
  return (globalThis as unknown as { __fundaAddedCatalog?: AddedCatalog }).__fundaAddedCatalog;
}

const codeIds = new Set(catalogProducts.map((p) => p.id));
const codeSlugs = new Set(catalogProducts.map((p) => p.slug));

/** The product slugs of the code catalog — a product added in the panel can't take one. */
export function isCodeProductSlug(slug: string): boolean {
  return codeSlugs.has(slug);
}

function addedSizesOf(p: PublishedProduct): ProductVariant[] {
  const kind = variantKindFor(p.categorySlug);
  if (kind === "none") return [];
  const prices = new Map(p.sizes.map((s) => [s.key, s.price]));
  return SIZE_OPTIONS[kind].filter((o) => prices.has(o.id)).map((o) => ({ id: o.id, label: o.label, price: prices.get(o.id)! }));
}

function toCatalogProduct(p: PublishedProduct): CatalogProduct {
  const category = categories.find((c) => c.slug === p.categorySlug);
  const smallest = addedSizesOf(p)[0];
  const priceValue = smallest?.price ?? p.sizes.find((s) => s.key === "")?.price ?? 0;
  return {
    id: p.id,
    name: p.name,
    categorySlug: p.categorySlug,
    categoryName: category?.name ?? "",
    description: p.shortDescription,
    shortDescription: p.shortDescription,
    tags: [],
    gradient: category?.gradient ?? "from-[#EAD9C8] to-[#D9C2AA]",
    priceValue,
    ...(p.isNew ? { isNew: true } : {}),
    ...(p.isBestSeller ? { isBestSeller: true } : {}),
    ...(p.isGift ? { isGift: true } : {}),
    ...(p.cakeMessage ? { customizable: true } : {}),
    availableBranches: ALL_BRANCHES,
    slug: p.slug,
    cardPrice: priceValue,
    displayPrice: `₺${priceValue.toLocaleString("tr-TR")}`,
    image: p.imageUrl,
  };
}

/** Usable on the storefront: a database id and slug, an existing category, a price. */
function isStorefrontProduct(p: PublishedProduct): boolean {
  return (
    /^n[0-9a-f]{12}$/.test(p.id) &&
    !codeIds.has(p.id) &&
    !codeSlugs.has(p.slug) &&
    categories.some((c) => c.slug === p.categorySlug) &&
    p.sizes.length > 0
  );
}

/**
 * Registers the published products (server: after each read; browser: from
 * the page). The same list twice is a no-op, so listings keep their identity.
 */
export function setPublishedProducts(list: PublishedProduct[], hiddenCodeIds: string[] = hiddenProductIds()): void {
  const usable = list.filter(isStorefrontProduct);
  const hidden = [...new Set(hiddenCodeIds.filter((id) => codeIds.has(id)))].sort();
  const key = `${usable.map((p) => `${p.id}@${p.updatedAt}`).join("|")}#${hidden.join(",")}`;
  if ((addedCatalog()?.key ?? "#") === key) return;
  const products = usable.map(toCatalogProduct);
  const hiddenSet = new Set(hidden);
  const visibleCode = hidden.length > 0 ? catalogProducts.filter((p) => !hiddenSet.has(p.id)) : catalogProducts;
  (globalThis as unknown as { __fundaAddedCatalog?: AddedCatalog }).__fundaAddedCatalog = {
    key,
    published: new Map(usable.map((p) => [p.id, p])),
    products,
    hidden: hiddenSet,
    all: products.length > 0 || hidden.length > 0 ? [...visibleCode, ...products] : catalogProducts,
    withHidden: products.length > 0 ? [...catalogProducts, ...products] : catalogProducts,
  };
}

/** Code products currently off the site (D48). */
export function hiddenProductIds(): string[] {
  return [...(addedCatalog()?.hidden ?? [])];
}

/** Is this code product off the site? (a hidden product is not listed, found or ordered) */
export function isHiddenProduct(id: string): boolean {
  return addedCatalog()?.hidden.has(id) ?? false;
}

/** The panel's list: every code product (hidden ones too), then the published panel products. */
export function catalogWithHidden(): CatalogProduct[] {
  return addedCatalog()?.withHidden ?? catalogProducts;
}

/** The registered published products (what pages hand to the browser). */
export function publishedProducts(): PublishedProduct[] {
  return [...(addedCatalog()?.published.values() ?? [])];
}

/** One published product added in the panel, or undefined (a code product, a draft, unknown). */
export function publishedProduct(id: string): PublishedProduct | undefined {
  return addedCatalog()?.published.get(id);
}

/** Changes whenever the registered list changes — a memo key for listings built from it. */
export function catalogVersion(): string {
  return addedCatalog()?.key ?? "";
}

/** The storefront catalog: the visible code products, then the published ones added in the panel. */
export function allCatalogProducts(): CatalogProduct[] {
  return addedCatalog()?.all ?? catalogProducts;
}

function addedProductSizes(id: string): ProductVariant[] {
  const p = publishedProduct(id);
  return p ? addedSizesOf(p) : [];
}

export const getCatalogProductBySlug = (slug: string) =>
  allCatalogProducts().find((p) => p.slug === slug);

export type CatalogCategory = {
  label: string;
  slug: string;
  sources: string[]; // product categorySlugs that roll up here
};

export const catalogCategories: CatalogCategory[] = [
  { label: "Tümü", slug: "tumu", sources: [] },
  { label: "Yaş Pastalar", slug: "yas-pastalar", sources: ["yas-pastalar", "ozel-gun"] },
  { label: "Adet Pastalar", slug: "adet-pastalar", sources: ["adet-pastalar"] },
  { label: "Tatlılar", slug: "tatlilar", sources: ["serbetli-tatlilar", "sutlu-tatlilar", "mini-lezzetler", "kekler"] },
  { label: "Börekler", slug: "borekler", sources: ["borekler-ve-mayalilar", "atistirmaliklar"] },
  { label: "Kuru Pastalar", slug: "kuru-pastalar", sources: ["kuru-pastalar"] },
  { label: "Çikolatalar", slug: "cikolatalar", sources: ["cikolatalar"] },
  { label: "Hediyelikler", slug: "hediyelikler", sources: [] }, // matched via isGift
];

/** Categories where cake-specific contextual filters apply. */
export const cakeCatalogSlugs = ["yas-pastalar"];

/** Contextual (pasta-only) filter: occasion. */
export const catalogPastaOccasions: { value: string; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "dogum-gunu", label: "Doğum Günü" },
  { value: "dugun-nisan", label: "Düğün & Nişan" },
  { value: "kutlama", label: "Kutlama" },
  { value: "kisiye-ozel", label: "Kişiye Özel" },
];

/** Contextual (pasta-only) filter: serving size. */
export const catalogServingOptions = [
  "4–6 Kişilik",
  "8–10 Kişilik",
  "12–15 Kişilik",
  "15+ Kişilik",
];

export function catalogProductsForCategory(slug: string): CatalogProduct[] {
  const all = allCatalogProducts();
  if (slug === "tumu") return all;
  if (slug === "hediyelikler") return all.filter((p) => p.isGift);
  const cat = catalogCategories.find((c) => c.slug === slug);
  if (!cat) return all;
  return all.filter((p) => cat.sources.includes(p.categorySlug));
}

/* ---------------------------------------------------------------------------
 * Listing routes — one taxonomy for /lezzetlerimiz and /lezzetlerimiz/[kategori]
 * ------------------------------------------------------------------------- */

export type CatalogListing = {
  slug: string;
  title: string;
  description: string;
  /** catalog group highlighted in the category nav */
  navSlug: string;
  products: CatalogProduct[];
};

const GROUP_COPY: Record<string, { title: string; description: string }> = {
  tatlilar: {
    title: "Tatlılar",
    description: "Sütlü ve şerbetli tatlılardan mini lezzetlere ve keklere, Funda'nın tatlı seçkisi.",
  },
  borekler: {
    title: "Börekler & Mayalılar",
    description: "Börekler, mayalılar ve tuzlu atıştırmalıklar; kahvaltıdan çay saatine Funda'nın tuzlu lezzetleri.",
  },
};

/**
 * Resolves a listing URL slug: "tumu", a catalog group (yas-pastalar, tatlilar,
 * borekler, …) or a single data category (sutlu-tatlilar, mini-lezzetler, …).
 * Hediyelikler has its own page (/hediyelikler) and is not a listing route.
 */
export function resolveCatalogListing(slug: string): CatalogListing | null {
  if (slug === "tumu") {
    return {
      slug,
      title: "Lezzetlerimiz",
      description: "Funda'nın günlük üretiminden kutlama pastalarına, tüm lezzetleri keşfedin.",
      navSlug: "tumu",
      products: allCatalogProducts(),
    };
  }
  const group = catalogCategories.find((c) => c.slug === slug && c.sources.length > 0);
  if (group) {
    const category = categories.find((c) => c.slug === slug);
    const copy = GROUP_COPY[slug];
    return {
      slug,
      title: copy?.title ?? category?.name ?? group.label,
      description: copy?.description ?? category?.description ?? "",
      navSlug: slug,
      products: catalogProductsForCategory(slug),
    };
  }
  const category = categories.find((c) => c.slug === slug);
  if (!category) return null;
  const parent = catalogCategories.find((c) => c.sources.includes(slug));
  return {
    slug,
    title: category.name,
    description: category.description,
    navSlug: parent?.slug ?? "tumu",
    products: allCatalogProducts().filter((p) => p.categorySlug === slug),
  };
}

/** every slug /lezzetlerimiz/[kategori] can render */
export const catalogListingSlugs: string[] = [
  ...new Set([
    ...catalogCategories.filter((c) => c.sources.length > 0).map((c) => c.slug),
    ...categories.map((c) => c.slug),
  ]),
];

/* ---------------------------------------------------------------------------
 * Product detail
 * ------------------------------------------------------------------------- */

export function getProductDetail(slug: string): ProductDetail | undefined {
  const base = getCatalogProductBySlug(slug);
  if (!base) return undefined;

  // a product added in the panel (D45) shows only what Merkez entered:
  // no generated ingredients, allergens or storage advice
  const added = publishedProduct(base.id);
  const meta: ProductDetailMeta = added
    ? { allergens: added.allergens ?? "", ingredients: "", storageInfo: "", maxCakeMessageLength: added.cakeMessage ? 40 : undefined }
    : productDetailMeta[base.id] ?? {};
  const variants = productSizes(base);
  const kind = variants.length > 0 ? variantKindFor(base.categorySlug) : "none";
  const basePrice = base.priceValue;

  const all = allCatalogProducts();
  const relatedIds =
    meta.relatedProductIds ??
    all
      .filter((p) => p.categorySlug === base.categorySlug && p.id !== base.id)
      .slice(0, 4)
      .map((p) => p.id);

  const relatedProducts = relatedIds
    .map((id) => all.find((p) => p.id === id))
    .filter((p): p is CatalogProduct => Boolean(p))
    .slice(0, 4);

  return {
    ...base,
    variantKind: kind,
    basePrice,
    variants,
    longDescription: meta.longDescription ?? base.description,
    images: meta.images ?? (base.image ? [base.image] : [base.gradient, base.gradient, base.gradient, base.gradient]),
    imageLabels: ["Ön Görünüm", "Detay", "Kesit", "Servis"],
    maxCakeMessageLength: meta.maxCakeMessageLength ?? (base.customizable ? 40 : null),
    availableDeliveryTypes: meta.availableDeliveryTypes ?? ["address", "pickup"],
    extraOptions: meta.extraOptions ?? (kind === "serving" ? ["Mum Ekle", "Doğum Günü Kartı", "Hediye Notu"] : []),
    allergens: meta.allergens ?? "Gluten, süt ürünü ve yumurta içerebilir.",
    ingredients: meta.ingredients ?? base.shortDescription,
    storageInfo: meta.storageInfo ?? "Serin ve kuru bir yerde, doğrudan güneş ışığından uzakta saklayınız.",
    deliveryInfo:
      meta.deliveryInfo ??
      "Adrese teslim ve mağazadan teslim seçenekleri mevcuttur. Teslimat uygunluğu adres bilgisi sırasında kontrol edilir.",
    quantityEnabled: meta.quantityEnabled ?? (kind === "weight" || kind === "pack"),
    relatedProducts,
  };
}

/** "₺1.450" -> 1450 */
const tlAmount = (label: string) => Number(label.replace(/[^\d,]/g, "").replace(",", "."));

/**
 * D18: a struck-through old price shows only where we set one — for a
 * product, or for one of its sizes (D21) — never generated by a price change,
 * and only while it is above the price shown next to it, so a raised price
 * never looks like a discount.
 */
export function oldPriceShown(oldPrice: string | null | undefined, price: number): boolean {
  return Boolean(oldPrice) && tlAmount(oldPrice ?? "") > price;
}

/** The card's old price (the product's, or its smallest size's) is shown. */
export function showsOldPrice(product: Pick<CatalogProduct, "oldPrice" | "cardPrice">): boolean {
  return oldPriceShown(product.oldPrice, product.cardPrice);
}

/**
 * Whether the product sells in sizes (serving / weight / pack) — its detail
 * page lists them, each with its own price (`SIZE_PRICES`, D20).
 */
export function productHasVariants(product: Pick<CatalogProduct, "id" | "categorySlug">): boolean {
  return productSizes(product).length > 0;
}

/**
 * Whether a product can be added to the cart straight from a product card,
 * without the customer making any pre-purchase choice.
 *
 * Returns `false` (→ "Seçenekleri Gör") whenever the product has ANY of:
 * size / serving selection, weight selection, pack/box selection, a
 * category that derives variants, mandatory personalisation, or no definite
 * price. Derived purely from the data model — never from the product name.
 */
export function canQuickAddToCart(product: CatalogProduct): boolean {
  if (!(product.priceValue > 0)) return false;
  if (product.customizable) return false;
  if (product.servingOptions && product.servingOptions.length > 0) return false;
  if (product.weightOptions && product.weightOptions.length > 0) return false;
  if (variantKindFor(product.categorySlug) !== "none") return false;
  return true;
}
