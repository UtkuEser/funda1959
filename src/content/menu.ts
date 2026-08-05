/**
 * Ürün dünyası: koleksiyonlar → kategoriler → ürünler.
 * `image` alanı boş bırakıldığında motifli placeholder gösterilir;
 * gerçek fotoğraf geldiğinde yalnızca yolu yazmak yeterlidir. (public/images)
 */

import { images, type ImageAsset } from "./images";

export type Collection = {
  slug: string;
  title: string;
  lead: string;
  description: string;
  href: string;
  cta: string;
  image: ImageAsset;
};

export type Category = {
  slug: string;
  name: string;
  collection: string;
  tagline: string;
  description: string;
  image: ImageAsset;
};

export type Product = {
  id: string;
  name: string;
  categorySlug: string;
  short: string;
  description: string;
  notes: string[];
  image: ImageAsset;
  isSignature?: boolean;
  isGift?: boolean;
};

export const collections: Collection[] = [
  {
    slug: "kahvenin-yanina",
    title: "Kahvenin Yanına",
    lead: "Günün en tatlı molası",
    description:
      "Bir fincan kahvenin yanına yakışan küçük lezzetler. Sabah kaçamağı, öğleden sonra molası ya da sohbetin ortasında paylaşılan tabak.",
    href: "/lezzetler#kahvenin-yanina",
    cta: "Keşfet",
    image: images.kahveninYanina,
  },
  {
    slug: "eve-goturmelik",
    title: "Eve Götürmelik",
    lead: "Sofraya inen mutluluk",
    description:
      "Akşam sofrasına, hafta sonu kahvaltısına ya da sadece canınız çektiği için. Kutulanıp eve götürülen, evde paylaşılan lezzetler.",
    href: "/lezzetler#eve-goturmelik",
    cta: "Keşfet",
    image: images.eveGoturmelik,
  },
  {
    slug: "ozel-gunler",
    title: "Özel Günler",
    lead: "Kutlamanın merkezi",
    description:
      "Doğum günü, nişan, yıl dönümü ya da sebepsiz bir kutlama. Özel gün pastaları ve hediye kutularıyla anıyı tamamlıyoruz.",
    href: "/paket-hediye",
    cta: "Hediye Dünyası",
    image: images.ozelGunler,
  },
  {
    slug: "imza-lezzetler",
    title: "Funda İmza Lezzetleri",
    lead: "Yalnızca Funda’da",
    description:
      "Yıllar içinde markanın adıyla anılmaya başlayan, tarifi değişmeyen ve bir kere tadınca hatırlanan lezzetler.",
    href: "/imza-lezzetler",
    cta: "İmzayı Gör",
    image: images.imzaKart,
  },
];

export const categories: Category[] = [
  {
    slug: "kuru-pastalar",
    name: "Kuru Pastalar",
    collection: "kahvenin-yanina",
    tagline: "Çayın ve kahvenin değişmeyen arkadaşı",
    description:
      "Tereyağı kokan kurabiyeler, bademli ve fıstıklı çeşitler, ağızda dağılan hafiflik. Kilo ile tartılır, kutuya dizilir, eve gider.",
    image: images.urunKek,
  },
  {
    slug: "mini-lezzetler",
    name: "Mini Lezzetler",
    collection: "kahvenin-yanina",
    tagline: "Bir lokmalık, tam ölçüsünde",
    description:
      "Tek servislik tatlılar; ikram tabağına, toplantı masasına ve kahve molasına en yakışanı. Küçük ama iddiası büyük.",
    image: images.urunMakaron,
  },
  {
    slug: "kekler",
    name: "Kekler & Fırından",
    collection: "kahvenin-yanina",
    tagline: "Sabahın sıcak kokusu",
    description:
      "Her sabah fırından çıkan kekler, çörekler ve mayalı hamur işleri. Günün ilk saatlerinde vitrinin en kalabalık köşesi.",
    image: images.defter4,
  },
  {
    slug: "yas-pastalar",
    name: "Yaş Pastalar",
    collection: "eve-goturmelik",
    tagline: "Masanın ortasına konan pasta",
    description:
      "Taze krema, mevsim meyveleri ve ustaların elinden çıkan katmanlar. Dilimle de alınır, bütün olarak da sipariş edilir.",
    image: images.urunPasta,
  },
  {
    slug: "serbetli-tatlilar",
    name: "Şerbetli Tatlılar",
    collection: "eve-goturmelik",
    tagline: "Gelenekten gelen tarifler",
    description:
      "İnce açılmış yufkalar, antep fıstığı ve dengeli şerbet. Baklava, kadayıf ve sarmalar; misafirliğin klasik cevabı.",
    image: images.urunBaklava,
  },
  {
    slug: "sutlu-tatlilar",
    name: "Sütlü Tatlılar",
    collection: "eve-goturmelik",
    tagline: "Hafif, kremsi ve evcil",
    description:
      "Kazandibi, sütlaç, muhallebi ve profiterol. Ağır olmayan, her mevsim yenen, herkesin sevdiği tatlılar.",
    image: images.hikayeArsiv,
  },
  {
    slug: "cikolatalar",
    name: "Çikolatalar",
    collection: "ozel-gunler",
    tagline: "El yapımı, kutuya hazır",
    description:
      "Pralinler, trüfler ve dolgulu çikolatalar. Tek tek seçilir, kutulanır ve çoğu zaman bir başkasına götürülür.",
    image: images.urunFistik,
  },
  {
    slug: "ozel-gun-pastalari",
    name: "Özel Gün Pastaları",
    collection: "ozel-gunler",
    tagline: "Kutlamaya göre hazırlanır",
    description:
      "Doğum günü, nişan, yıl dönümü ve kurumsal kutlamalar için siparişe özel pastalar. Sade ya da özel tasarım, sizin anlatınıza göre.",
    image: images.ozelGunler,
  },
];

export const products: Product[] = [
  /* Kuru Pastalar */
  {
    id: "kp-1",
    name: "Funda Kuru Pastası",
    categorySlug: "kuru-pastalar",
    short: "1959’dan beri değişmeyen karışım",
    description:
      "Tereyağlı hamur, bademli ve fıstıklı çeşitler, üzeri hafif şekerli. Kutuya dizildiğinde Funda’nın en çok tanınan hali.",
    notes: ["Tereyağlı", "Kilo ile", "Kutulanabilir"],
    isSignature: true,
    isGift: true,
    image: images.hediye1,
  },
  {
    id: "kp-2",
    name: "Bademli Tereyağlı Kurabiye",
    categorySlug: "kuru-pastalar",
    short: "Ağızda dağılan klasik",
    description:
      "Taze çekilmiş badem ve tereyağıyla açılan hamur, düşük ısıda uzun pişirme. Çay saatinin sessiz kahramanı.",
    notes: ["Bademli", "Çay yanı"],
    image: images.urunMakaron,
  },
  {
    id: "kp-3",
    name: "Fıstıklı Kurabiye",
    categorySlug: "kuru-pastalar",
    short: "Antep fıstığı ile",
    description:
      "Bol fıstıklı iç harç ve ince hamur. Kahvenin yanına da yakışır, misafirlik kutusunun içine de.",
    notes: ["Antep fıstıklı"],
    image: images.urunFistik,
  },

  /* Mini Lezzetler */
  {
    id: "ml-1",
    name: "Tiramisu Bardak",
    categorySlug: "mini-lezzetler",
    short: "Tek servislik, kahveli",
    description:
      "Espresso emdirilmiş kek, mascarpone kreması ve kakao. Kahvenin yanında ikinci bir kahve gibi.",
    notes: ["Kahveli", "Tek servis"],
    image: images.hikayeArsiv,
  },
  {
    id: "ml-2",
    name: "Mini Cheesecake",
    categorySlug: "mini-lezzetler",
    short: "Bir lokmalık cheesecake",
    description:
      "Bisküvi tabanı, krem peynir dolgusu ve mevsim meyvesi. İkram tabağının en hızlı biteni.",
    notes: ["Meyveli", "İkramlık"],
    image: images.urunTart,
  },
  {
    id: "ml-3",
    name: "Makaron Seçkisi",
    categorySlug: "mini-lezzetler",
    short: "Renkli, hafif, hediyelik",
    description:
      "Badem unuyla hazırlanan kabuk ve dolgulu iç. Kutulandığında küçük ama şık bir jest.",
    notes: ["Glutensiz hamur", "Kutulanabilir"],
    isGift: true,
    image: images.hediye3,
  },

  /* Kekler & Fırından */
  {
    id: "kk-1",
    name: "Portakallı Mermer Kek",
    categorySlug: "kekler",
    short: "Sabahın kokusu",
    description:
      "Taze portakal kabuğu rendesi ve kakaolu damarlar. Dilimlendiğinde iki ayrı tat, tek dokuda.",
    notes: ["Portakallı", "Günlük"],
    image: images.urunKek,
  },
  {
    id: "kk-2",
    name: "Tuzlu Kurabiye & Poğaça",
    categorySlug: "kekler",
    short: "Kahvaltı tarafı",
    description:
      "Peynirli, zeytinli ve sade çeşitler. Sabah erken saatte fırından çıkar, öğlene kalmaz.",
    notes: ["Tuzlu", "Her sabah taze"],
    image: images.defter4,
  },

  /* Yaş Pastalar */
  {
    id: "yp-1",
    name: "Bordo Kadife",
    categorySlug: "yas-pastalar",
    short: "Funda’nın imza pastası",
    description:
      "Bordo renginin markaya dönüştüğü pasta: kadife dokulu kek, hafif krem peynir kreması ve ince bir kakao vurgusu.",
    notes: ["İmza ürün", "Dilim ve bütün"],
    isSignature: true,
    image: images.urunPasta,
  },
  {
    id: "yp-2",
    name: "Çilekli Krem Pasta",
    categorySlug: "yas-pastalar",
    short: "Klasiklerin klasiği",
    description:
      "Taze çilek dilimleri, hafif pastacı kreması ve ıslatılmış pandispanya. Doğum günü masalarının değişmezi.",
    notes: ["Mevsim meyveli", "Siparişe özel"],
    image: images.ozelGunler,
  },
  {
    id: "yp-3",
    name: "Fındıklı Çikolatalı Pasta",
    categorySlug: "yas-pastalar",
    short: "Koyu ve dengeli",
    description:
      "Kavrulmuş fındık kırıkları, bitter ganaj ve tuz dokunuşu. Çikolatayı sevenlerin ilk tercihi.",
    notes: ["Fındıklı", "Bitter"],
    image: images.defter4,
  },

  /* Şerbetli */
  {
    id: "st-1",
    name: "Antep Fıstıklı Baklava",
    categorySlug: "serbetli-tatlilar",
    short: "İnce yufka, dengeli şerbet",
    description:
      "Elde açılan kat kat yufka, bol fıstık ve ağır olmayan şerbet. Tepsiyle de alınır, kutuyla da.",
    notes: ["Antep fıstıklı", "Tepsi & kutu"],
    isGift: true,
    image: images.urunBaklava,
  },
  {
    id: "st-2",
    name: "Fındıklı Kadayıf",
    categorySlug: "serbetli-tatlilar",
    short: "Tel kadayıf, taze kaymak",
    description:
      "Fırında altın rengini alan tel kadayıf, içinde fındık; yanında kaymakla servis edilir.",
    notes: ["Fındıklı", "Kaymaklı servis"],
    image: images.urunFistik,
  },

  /* Sütlü */
  {
    id: "sut-1",
    name: "Fırın Sütlaç",
    categorySlug: "sutlu-tatlilar",
    short: "Üstü kızarmış, içi kremsi",
    description:
      "Güğümde uzun süre pişen süt, pirinç ve vanilya. Fırında üstü koyulaşana kadar bekletilir.",
    notes: ["Hafif", "Her mevsim"],
    image: images.hikayeArsiv,
  },
  {
    id: "sut-2",
    name: "Kazandibi",
    categorySlug: "sutlu-tatlilar",
    short: "Karamelize tabanıyla",
    description:
      "Tabanı özenle karamelize edilen, kaşıkla kolayca ayrılan geleneksel sütlü tatlı.",
    notes: ["Geleneksel"],
    image: images.hikayeArsiv,
  },
  {
    id: "sut-3",
    name: "Profiterol",
    categorySlug: "sutlu-tatlilar",
    short: "Sıcak çikolata sosuyla",
    description:
      "Kremayla doldurulmuş choux hamuru topları ve üzerine dökülen çikolata sosu. Paylaşmak için yapılmış gibi.",
    notes: ["Çikolatalı", "Paylaşımlık"],
    image: images.urunTart,
  },

  /* Çikolatalar */
  {
    id: "ck-1",
    name: "1959 Çikolatası",
    categorySlug: "cikolatalar",
    short: "El yapımı pralin seçkisi",
    description:
      "Fındık, fıstık ve tuzlu karamel dolgulu pralinler; bordo kurdeleli kutuda. Funda’dan çıkarken en çok elde taşınan kutu.",
    notes: ["El yapımı", "Hediye kutusu"],
    isSignature: true,
    isGift: true,
    image: images.hediye4,
  },
  {
    id: "ck-2",
    name: "Trüf Çikolata",
    categorySlug: "cikolatalar",
    short: "Kakaoya bulanmış",
    description:
      "Yoğun ganaj, ince kakao kaplama. Kahvenin yanında tek tane yeter denir, yetmez.",
    notes: ["Bitter", "Kutulanabilir"],
    isGift: true,
    image: images.urunFistik,
  },

  /* Özel gün */
  {
    id: "og-1",
    name: "Doğum Günü Pastası",
    categorySlug: "ozel-gun-pastalari",
    short: "Kişiye özel hazırlanır",
    description:
      "Boyut, tat ve süsleme seçimi size ait. Mum, yazı ve sunum detaylarıyla birlikte teslim edilir.",
    notes: ["Siparişe özel", "48 saat önce"],
    image: images.ozelGunler,
  },
  {
    id: "og-2",
    name: "Nişan & Kutlama Pastası",
    categorySlug: "ozel-gun-pastalari",
    short: "Sade ya da katlı",
    description:
      "Zarif süsleme, dengeli tat ve masaya yakışan sunum. Kalabalık davetler için katlı seçenekler mevcut.",
    notes: ["Katlı seçenek", "Siparişe özel"],
    image: images.urunPasta,
  },
  {
    id: "og-3",
    name: "Tuzlu Fındıklı Tart",
    categorySlug: "ozel-gun-pastalari",
    short: "İmza tart",
    description:
      "Çıtır tart tabanı, tuzlu karamel ve kavrulmuş fındık. İkram masasında ilk biten tabak.",
    notes: ["İmza ürün", "İkramlık"],
    isSignature: true,
    image: images.urunTart,
  },
];

export const signatureProducts = products.filter((product) => product.isSignature);
export const giftProducts = products.filter((product) => product.isGift);

export const getCategory = (slug: string) =>
  categories.find((category) => category.slug === slug);

export const getCategoriesByCollection = (collectionSlug: string) =>
  categories.filter((category) => category.collection === collectionSlug);

export const getProductsByCategory = (slug: string) =>
  products.filter((product) => product.categorySlug === slug);

export const signatureIntro = {
  eyebrow: "Funda’nın İmzası",
  title: "Kahvenin yanına küçük bir Funda.",
  description:
    "Funda’ya özgü, günlük hayata karışan; kahve yanında da misafirlikte de yer bulan lezzetler. Tarifi yıllardır aynı, hikayesi her gün yeniden yazılıyor.",
  image: images.imzaBuyuk,
};
