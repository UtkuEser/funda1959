/**
 * Merkezi görsel kaydı.
 *
 * Sitedeki bütün görsel alanları buradan beslenir.
 *
 * Fotoğraf eklemek için tek yapılacak:
 *   1) dosyayı public/images içine koyun
 *   2) aşağıdaki ilgili kaydın `src` alanına yolunu yazın
 *
 *      hero: { ...,  src: "/images/hero.jpg" }
 *
 * `src` boş olduğu sürece o alan, aynı ölçüde marka yüzeyi olarak çizilir
 * (bordo/krem zemin + motif + künye). Layout hiçbir şekilde değişmez.
 *
 * `position` her görselin kadrajını ayrı ayarlar (CSS object-position).
 * `tone`, fotoğraf yokken kullanılacak marka zeminini belirler.
 */

export type ImageTone = "cream" | "beige" | "powder" | "stone" | "bordo";

export type ImageAsset = {
  /** Fotoğraf yolu. Boşsa marka yüzeyi çizilir. */
  src?: string;
  /** Erişilebilirlik metni ve fotoğraf yokken görünen künye. */
  alt: string;
  /** CSS object-position — kadraj ayarı. */
  position?: string;
  /** Fotoğraf yokken kullanılacak zemin tonu. */
  tone?: ImageTone;
};

const slot = (alt: string, tone: ImageTone = "cream", position = "center"): ImageAsset => ({
  src: undefined,
  alt,
  tone,
  position,
});

export const images = {
  /* Hero — video ve/veya kapak fotoğrafı */
  hero: slot("Şube atmosferi: sıcak ışık, vitrin, kahve ve masa", "bordo"),

  /* Funda'da Neler Var */
  kahveninYanina: slot("Kahve fincanı ve yanında tek lokmalık tatlı", "powder"),
  eveGoturmelik: slot("Kutulanmış, eve götürülmeye hazır lezzetler", "beige"),
  ozelGunler: slot("Özel gün pastası, mumlar ve masa", "stone"),
  imzaKart: slot("Funda imza lezzeti, yakın plan", "bordo"),

  /* İmza bölümü */
  imzaBuyuk: slot("İmza lezzet, bordo kurdeleli paketiyle birlikte", "powder"),

  /* Paket & hediye */
  hediyeGenis: slot("Paketleme tezgahı: kutular, kurdele, mühür", "beige"),
  hediye1: slot("Klasik Funda kutusu, kapalı ve kurdeleli", "cream"),
  hediye2: slot("Misafirlik kutusu, açık halde içeriğiyle", "powder"),
  hediye3: slot("Ofis ikramı tepsisi", "stone"),
  hediye4: slot("Özel gün kutusu ve el yazısı kart", "beige"),

  /* Şubeler */
  subeGop: slot("GOP şubesi: vitrin ve oturma alanı", "beige"),
  subePanora: slot("Panora şubesi: servis tezgahı ve salon", "stone"),
  subeIncek: slot("İncek şubesi: ferah salon ve masa detayı", "powder"),

  /* Hikaye */
  hikaye: slot("Arşivden bir kare: ilk vitrin ve usta", "stone"),
  hikayeArsiv: slot("Eski tabela, tartı ve kutu detayı", "beige"),

  /* Funda Defteri */
  defter1: slot("Kahve ve yanında küçük tabak", "powder"),
  defter2: slot("Elde taşınan kurdeleli kutu", "cream"),
  defter3: slot("Mumlu pasta ve kalabalık masa", "beige"),
  defter4: slot("Masada kahve, tatlı ve gün ışığı", "stone"),

  /* Ürün ve kategoriler */
  urunBaklava: slot("Antep fıstıklı baklava, yakın plan", "beige"),
  urunMakaron: slot("Makaron seçkisi", "powder"),
  urunTart: slot("Meyveli tart", "cream"),
  urunPasta: slot("Yaş pasta dilimi, kesit", "powder"),
  urunKek: slot("Kek ve çay servisi", "beige"),
  urunFistik: slot("Fıstıklı tatlı, üstten çekim", "stone"),
  urunVitrin: slot("Vitrinde günün çeşitleri", "stone"),
} satisfies Record<string, ImageAsset>;

export type ImageKey = keyof typeof images;
