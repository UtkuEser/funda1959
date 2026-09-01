import { productImage } from "./product-images";

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
  sameDayDelivery?: boolean;
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
    address: "TONA Residence, İncek, Ankara",
    neighborhood: "İncek",
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

/* Curated, hand-picked showcase for the homepage vitrine (İmza Lezzetlerimiz) */
export const signatureProducts = featuredProducts.slice(0, 4);

/* Homepage — Kutlamalarınız İçin */
export const celebrationCategories = [
  {
    title: "Doğum Günü Pastaları",
    description: "Her yaşa özel, kişiselleştirilebilen tasarımlar.",
    href: "/ozel-gun",
    gradient: "from-[#EBD3C6] to-[#D9AF9C]",
  },
  {
    title: "Düğün & Nişan Pastaları",
    description: "İki hayatı birleştiren, zarif ve çok katlı pastalar.",
    href: "/ozel-gun",
    gradient: "from-[#EEE4D3] to-[#DCC7AE]",
  },
  {
    title: "Kişiye Özel Pastalar",
    description: "Fikrinizi anlatın, ustalarımız hayata geçirsin.",
    href: "/ozel-gun",
    gradient: "from-[#E6D0CF] to-[#C9A7AB]",
  },
];

/* Homepage — Kategoriler mozaiği */
export const homeCategories = [
  {
    name: "Pastalar",
    href: "/lezzetlerimiz/yas-pastalar",
    gradient: "from-[#E7C9BA] to-[#C99A86]",
    feature: true,
  },
  {
    name: "Tatlılar",
    href: "/lezzetlerimiz/sutlu-tatlilar",
    gradient: "from-[#EFE6D4] to-[#DCC9AC]",
  },
  {
    name: "Börekler",
    href: "/lezzetlerimiz/borekler-ve-mayalilar",
    gradient: "from-[#E9DAC3] to-[#D3BE9C]",
  },
  {
    name: "Çikolatalar",
    href: "/lezzetlerimiz/cikolatalar",
    gradient: "from-[#D8C1A8] to-[#B89A7C]",
  },
  {
    name: "Hediyelikler",
    href: "/hediyelikler",
    gradient: "from-[#E7D6D2] to-[#CBAAA6]",
  },
];

/* Homepage — Hediyelik Seçimler / Sevdiklerinize Funda'dan */
export const giftCollections = [
  {
    title: "Hediyelik Çikolatalar",
    description: "El yapımı pralin ve trüf çeşitleriyle hazırlanan çikolatalar.",
    href: "/lezzetlerimiz/cikolatalar",
    gradient: "from-[#D8C1A8] to-[#B4906F]",
  },
  {
    title: "Özel Kutular",
    description: "Doğum günü, yeni iş ya da bir teşekkür için özenle hazırlanan kutular.",
    href: "/lezzetlerimiz/cikolatalar",
    gradient: "from-[#EDE3D2] to-[#D6C0A4]",
  },
  {
    title: "Tatlı & Kurabiye Seçkileri",
    description: "Çayın yanına yakışan kurabiye ve mini tatlı derlemeleri.",
    href: "/lezzetlerimiz/kuru-pastalar",
    gradient: "from-[#EAD9C0] to-[#D2B78E]",
  },
];

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
 * Product catalog (Lezzetlerimiz listing)
 * ------------------------------------------------------------------------- */

const ALL_BRANCHES = ["gop", "panora", "incek"];

const catalogMeta: Record<string, CatalogMeta> = {
  p1: { priceValue: 780, isBestSeller: true, customizable: true, servingOptions: ["8–10 Kişilik"], occasions: ["kutlama", "kisiye-ozel"], features: ["Yazı Eklenebilir", "Kişiselleştirilebilir"], availableBranches: ALL_BRANCHES },
  p2: { priceValue: 720, servingOptions: ["8–10 Kişilik"], occasions: ["kutlama"], features: ["Yazı Eklenebilir"], availableBranches: ALL_BRANCHES },
  p3: { priceValue: 740, isNew: true, servingOptions: ["4–6 Kişilik"], occasions: ["kutlama"], availableBranches: ["gop", "panora"] },
  p4: { priceValue: 760, servingOptions: ["12–15 Kişilik"], occasions: ["dogum-gunu", "kutlama"], availableBranches: ALL_BRANCHES },
  p5: { priceValue: 45, sameDayDelivery: true, isGift: true, availableBranches: ALL_BRANCHES },
  p6: { priceValue: 95, sameDayDelivery: true, availableBranches: ALL_BRANCHES },
  p7: { priceValue: 85, sameDayDelivery: true, isNew: true, availableBranches: ["gop", "incek"] },
  p8: { priceValue: 420, sameDayDelivery: true, isBestSeller: true, weightOptions: ["500 g", "1 kg"], availableBranches: ALL_BRANCHES },
  p9: { priceValue: 360, sameDayDelivery: true, weightOptions: ["1 kg"], availableBranches: ALL_BRANCHES },
  p10: { priceValue: 640, sameDayDelivery: true, isBestSeller: true, weightOptions: ["500 g", "1 kg"], availableBranches: ALL_BRANCHES },
  p11: { priceValue: 560, sameDayDelivery: true, weightOptions: ["1 kg"], availableBranches: ["gop", "panora"] },
  p12: { priceValue: 120, sameDayDelivery: true, availableBranches: ALL_BRANCHES },
  p13: { priceValue: 520, oldPrice: "₺580", sameDayDelivery: true, isBestSeller: true, isGift: true, availableBranches: ALL_BRANCHES },
  p14: { priceValue: 890, isNew: true, isGift: true, availableBranches: ["gop", "panora"] },
  p15: { priceValue: 1450, customizable: true, servingOptions: ["15+ Kişilik"], occasions: ["dugun-nisan", "kisiye-ozel"], features: ["Özel Tasarım", "Kişiselleştirilebilir", "Yazı Eklenebilir"], availableBranches: ["gop", "incek"] },
  p16: { priceValue: 950, isBestSeller: true, customizable: true, isGift: true, servingOptions: ["8–10 Kişilik"], occasions: ["dogum-gunu", "kisiye-ozel"], features: ["Kişiselleştirilebilir", "Yazı Eklenebilir", "Fotoğraflı Pasta"], availableBranches: ALL_BRANCHES },
  p17: { priceValue: 280, sameDayDelivery: true, weightOptions: ["1 kg"], availableBranches: ALL_BRANCHES },
  p18: { priceValue: 240, oldPrice: "₺290", sameDayDelivery: true, isBestSeller: true, availableBranches: ALL_BRANCHES },
};

const categoryImageIndex = new Map<string, number>();

export const catalogProducts: CatalogProduct[] = products.map((p) => {
  const meta = catalogMeta[p.id] ?? { priceValue: 0 };
  const idx = categoryImageIndex.get(p.categorySlug) ?? 0;
  categoryImageIndex.set(p.categorySlug, idx + 1);
  return {
    ...p,
    ...meta,
    slug: slugify(p.name),
    displayPrice: p.price ?? `₺${meta.priceValue.toLocaleString("tr-TR")}`,
    image: productImage(p.categorySlug, idx),
  };
});

export const getCatalogProductBySlug = (slug: string) =>
  catalogProducts.find((p) => p.slug === slug);

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
  if (slug === "tumu") return catalogProducts;
  if (slug === "hediyelikler") return catalogProducts.filter((p) => p.isGift);
  const cat = catalogCategories.find((c) => c.slug === slug);
  if (!cat) return catalogProducts;
  return catalogProducts.filter((p) => cat.sources.includes(p.categorySlug));
}

/* ---------------------------------------------------------------------------
 * Product detail
 * ------------------------------------------------------------------------- */

export type DeliveryType = "address" | "pickup";
export type VariantKind = "serving" | "weight" | "pack" | "none";
export type ProductVariant = { id: string; label: string; price: number };

type ProductDetailMeta = {
  longDescription?: string;
  images?: string[]; // gradient class fragments used as placeholders
  variants?: ProductVariant[];
  maxCakeMessageLength?: number;
  preparationTimeHours?: number;
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
  preparationTimeHours: number;
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

const SERVING_BUCKETS = [
  { id: "4-6", label: "4–6 Kişilik", mult: 1 },
  { id: "8-10", label: "8–10 Kişilik", mult: 1.35 },
  { id: "12-15", label: "12–15 Kişilik", mult: 1.85 },
  { id: "15-20", label: "15–20 Kişilik", mult: 2.4 },
];
const WEIGHT_BUCKETS = [
  { id: "500g", label: "500 g", mult: 0.55 },
  { id: "1kg", label: "1 kg", mult: 1 },
  { id: "1.5kg", label: "1.5 kg", mult: 1.45 },
];
const PACK_BUCKETS = [
  { id: "6", label: "6'lı", mult: 0.5 },
  { id: "12", label: "12'li", mult: 1 },
  { id: "24", label: "24'lü", mult: 1.9 },
];

function variantKindFor(categorySlug: string): VariantKind {
  if (["yas-pastalar", "ozel-gun"].includes(categorySlug)) return "serving";
  if (["kuru-pastalar", "serbetli-tatlilar"].includes(categorySlug)) return "weight";
  if (categorySlug === "cikolatalar") return "pack";
  return "none";
}

const round10 = (n: number) => Math.round(n / 10) * 10;

const productDetailMeta: Record<string, ProductDetailMeta> = {
  p1: {
    longDescription:
      "Yoğun çikolata kreması, taze çilekler ve yumuşak pandispanya ile hazırlanan Funda klasiklerinden. Belçika çikolatası ganajıyla kaplanır; her katmanında taze meyve dilimleri bulunur. Doğum günü ve kutlamaların vazgeçilmezi.",
    variants: [
      { id: "4-6", label: "4–6 Kişilik", price: 780 },
      { id: "8-10", label: "8–10 Kişilik", price: 1050 },
      { id: "12-15", label: "12–15 Kişilik", price: 1450 },
    ],
    maxCakeMessageLength: 40,
    preparationTimeHours: 24,
    availableDeliveryTypes: ["address", "pickup"],
    extraOptions: ["Mum Ekle", "Doğum Günü Kartı", "Hediye Notu"],
    allergens: "Gluten, süt ürünü, yumurta ve fındık içerebilir.",
    ingredients:
      "Pandispanya (buğday unu, yumurta, şeker), çikolatalı krema, taze çilek, Belçika çikolatası ganajı, krem şanti.",
    storageInfo:
      "+2 / +4 °C arasında buzdolabında saklayınız. Hazırlandığı gün tüketilmesi önerilir, en geç 2 gün içinde tüketiniz.",
    deliveryInfo:
      "Yaş pasta siparişleri en az 24 saat öncesinden alınır. Adrese teslim ve mağazadan teslim seçenekleri mevcuttur.",
    quantityEnabled: false,
    relatedProductIds: ["p2", "p4", "p18", "p16"],
  },
};

export function getProductDetail(slug: string): ProductDetail | undefined {
  const base = getCatalogProductBySlug(slug);
  if (!base) return undefined;

  const meta = productDetailMeta[base.id] ?? {};
  const kind = variantKindFor(base.categorySlug);
  const basePrice = base.priceValue;

  let variants = meta.variants ?? [];
  if (variants.length === 0 && kind !== "none") {
    const buckets =
      kind === "serving" ? SERVING_BUCKETS : kind === "weight" ? WEIGHT_BUCKETS : PACK_BUCKETS;
    variants = buckets.map((b) => ({
      id: b.id,
      label: b.label,
      price: round10(basePrice * b.mult),
    }));
  }

  const relatedIds =
    meta.relatedProductIds ??
    catalogProducts
      .filter((p) => p.categorySlug === base.categorySlug && p.id !== base.id)
      .slice(0, 4)
      .map((p) => p.id);

  const relatedProducts = relatedIds
    .map((id) => catalogProducts.find((p) => p.id === id))
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
    preparationTimeHours: meta.preparationTimeHours ?? (base.sameDayDelivery ? 4 : 24),
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
