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
};

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

export const getCategoryBySlug = (slug: string) =>
  categories.find(c => c.slug === slug);

export const getProductsByCategory = (slug: string) =>
  products.filter(p => p.categorySlug === slug);
