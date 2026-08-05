/**
 * Merkezi görsel kaydı.
 *
 * Fotoğraf eklemek için tek yapılacak: dosyayı public/images içine koyup
 * ilgili kaydın `src` alanını doldurmak.
 *
 *   hero: { ...,  src: "/images/hero.jpg" }
 *
 * `src` boşken alan, aynı ölçüde nötr bir yüzey olarak çizilir; layout değişmez.
 * `position` kadrajı, `ratio` ise alanın en-boy oranını belirler (CLS oluşmaz).
 */

export type ImageAsset = {
  /** Fotoğraf yolu (public altı). Boşsa nötr yüzey gösterilir. */
  src?: string;
  /** Erişilebilirlik metni. */
  alt: string;
  /** CSS object-position — kadraj. */
  position?: string;
  /** CSS aspect-ratio — alanın oranı. */
  ratio?: string;
  /** Kaynak dosyanın gerçek ölçüleri (biliniyorsa). */
  width?: number;
  height?: number;
};

const slot = (alt: string, ratio: string, position = "center"): ImageAsset => ({
  src: undefined,
  alt,
  ratio,
  position,
});

export const images = {
  /* Hero — video posteri / kapak */
  hero: slot("Funda 1959 şubesinde kahve ve tatlı servisi", "16 / 9"),

  /* Günün her anına Funda */
  kahveninYanina: slot("Kahvenin yanında tek lokmalık tatlı", "4 / 5"),
  eveGoturmelik: slot("Kutulanmış, eve götürülmeye hazır lezzetler", "16 / 10"),
  ozelGunler: slot("Özel gün pastası ve masa", "16 / 10"),
  imzaKart: slot("Funda imza lezzeti", "21 / 9"),

  /* İmza */
  imzaBuyuk: slot("İmza lezzet, yakın plan", "4 / 5"),

  /* Bir kutu mutluluk */
  hediyeGenis: slot("Funda kutusu hazırlanırken", "21 / 9"),
  hediye1: slot("Klasik Funda kutusu", "3 / 4"),
  hediye2: slot("Misafirlik kutusu", "3 / 4"),
  hediye3: slot("Ofis ikramı", "3 / 4"),
  hediye4: slot("Özel gün kutusu", "3 / 4"),

  /* Şubeler */
  subeGop: slot("GOP şubesi", "4 / 5"),
  subePanora: slot("Panora şubesi", "4 / 5"),
  subeIncek: slot("İncek şubesi", "4 / 5"),

  /* Hikaye */
  hikaye: slot("Funda 1959 arşivinden bir kare", "4 / 5"),
  hikayeArsiv: slot("Eski vitrin detayı", "4 / 3"),

  /* Tatlı ritüeller */
  defter1: slot("Kahve ve yanında küçük tabak", "3 / 2"),
  defter2: slot("Elde taşınan kutu", "1 / 1"),
  defter3: slot("Mumlu pasta ve masa", "1 / 1"),
  defter4: slot("Masada kahve ve tatlı", "3 / 2"),

  /* Ürün ve kategoriler */
  urunBaklava: slot("Antep fıstıklı baklava", "4 / 5"),
  urunMakaron: slot("Makaron seçkisi", "4 / 5"),
  urunTart: slot("Meyveli tart", "4 / 5"),
  urunPasta: slot("Yaş pasta dilimi", "4 / 5"),
  urunKek: slot("Kek ve çay servisi", "4 / 5"),
  urunFistik: slot("Fıstıklı tatlı", "4 / 5"),
  urunVitrin: slot("Vitrinde günün çeşitleri", "4 / 3"),
} satisfies Record<string, ImageAsset>;

