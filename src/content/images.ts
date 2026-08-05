/**
 * Merkezi görsel kaydı — sitedeki bütün görsel alanları buradan beslenir.
 *
 * Fotoğraf eklemek için: dosyayı public/ altına koyup ilgili kaydın `src`,
 * `width` ve `height` alanlarını doldurun. Layout değişmez.
 *
 * `src` boşken alan, aynı oranda nötr bir yüzey olarak çizilir.
 */

export type ImageAsset = {
  /** Fotoğraf yolu (public altı). Boşsa nötr yüzey gösterilir. */
  src?: string;
  /** Erişilebilirlik metni. */
  alt: string;
  /** Kaynak dosyanın gerçek ölçüleri — CLS önlemek için zorunlu. */
  width?: number;
  height?: number;
  /** CSS aspect-ratio — alanın oranı. */
  ratio?: string;
  /** CSS object-position — kadraj. */
  position?: string;
};

/** Henüz fotoğrafı olmayan alan. */
const slot = (alt: string, ratio: string, position = "center"): ImageAsset => ({
  alt,
  ratio,
  position,
});

/** public/Hikayemiz altındaki gerçek arşiv kareleri (675×770, siyah-beyaz). */
const archive = (file: string, alt: string, position = "center"): ImageAsset => ({
  src: `/Hikayemiz/${file}`,
  alt,
  width: 675,
  height: 770,
  ratio: "675 / 770",
  position,
});

export const images = {
  /* --- Gerçek arşiv görselleri --- */
  arsiv1: archive("img-hakkimizda-1.jpg", "Funda 1959 aile arşivinden bir kare"),
  arsiv2: archive("img-hakkimizda-2.jpg", "Funda 1959 aile arşivinden bir kare"),
  arsiv3: archive(
    "img-hakkimizda-3.jpg",
    "Tarakçı ailesinin pastacılık yıllarından bir arşiv karesi",
  ),
  arsiv4: archive(
    "img-hakkimizda-4.jpg",
    "Funda Pastanesi’nin ilk yıllarından bir arşiv karesi",
  ),

  /* --- Hero (video gelene kadar poster) --- */
  hero: slot("Funda 1959 şubesinde kahve ve tatlı servisi", "4 / 3"),

  /* --- Günün her anına Funda --- */
  kahveninYanina: slot("Kahvenin yanında tek lokmalık tatlı", "4 / 5"),
  eveGoturmelik: slot("Kutulanmış, eve götürülmeye hazır lezzetler", "4 / 3"),
  ozelGunler: slot("Özel gün pastası ve masa", "4 / 3"),
  imzaKart: slot("Funda imza lezzeti", "16 / 10"),

  /* --- İmza --- */
  imzaBuyuk: slot("Kahve ve yanında Funda imza lezzeti", "4 / 5"),

  /* --- Bir kutu mutluluk --- */
  hediyeGenis: slot("Funda kutusu hazırlanırken", "21 / 9"),
  hediye1: slot("Klasik Funda kutusu", "3 / 4"),
  hediye2: slot("Misafirlik kutusu", "3 / 4"),
  hediye3: slot("Ofis ikramı", "3 / 4"),
  hediye4: slot("Özel gün kutusu", "3 / 4"),

  /* --- Şubeler --- */
  subeGop: slot("Funda 1959 GOP şubesi", "4 / 5"),
  subePanora: slot("Funda 1959 Panora şubesi", "4 / 5"),
  subeIncek: slot("Funda 1959 İncek şubesi", "4 / 5"),

  /* --- Hikaye --- */
  /** Hikayemiz sayfasının kapanışındaki güncel, renkli kare. */
  bugununFundasi: slot(
    "Bugün Funda 1959’un masalarından bir kare",
    "21 / 9",
    "center 55%",
  ),

  /* --- Tatlı ritüeller --- */
  defter1: slot("Kahve ve yanında küçük tabak", "3 / 2"),
  defter2: slot("Elde taşınan kutu", "4 / 3"),
  defter3: slot("Mumlu pasta ve masa", "4 / 3"),
  defter4: slot("Masada kahve, tatlı ve gün ışığı", "4 / 3"),

  /* --- Ürün ve kategoriler --- */
  urunBaklava: slot("Antep fıstıklı baklava", "4 / 5"),
  urunMakaron: slot("Makaron seçkisi", "4 / 5"),
  urunTart: slot("Meyveli tart", "4 / 5"),
  urunPasta: slot("Yaş pasta dilimi", "4 / 5"),
  urunKek: slot("Kek ve çay servisi", "4 / 5"),
  urunFistik: slot("Fıstıklı tatlı", "4 / 5"),
  urunVitrin: slot("Vitrinde günün çeşitleri", "4 / 3"),
} satisfies Record<string, ImageAsset>;
