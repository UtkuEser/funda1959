/** Paket & hediye dünyası: kutular, ritüel adımları ve kullanım anları. */

import { images, type ImageAsset } from "./images";

export type GiftBoxItem = {
  id: string;
  name: string;
  audience: string;
  description: string;
  contents: string[];
  image: ImageAsset;
};

export const giftIntro = {
  eyebrow: "Bir Kutu Mutluluk",
  title: "Bir kutu mutluluk.",
  description:
    "Sevdiklerinize götüreceğiniz küçük bir tatlı jest, Funda’nın sıcak pastane kültürüyle buluşur.",
  image: images.hediyeGenis,
};

export const giftBoxes: GiftBoxItem[] = [
  {
    id: "funda-kutusu",
    name: "Funda Kutusu",
    audience: "Her ziyarete",
    description:
      "Markanın en bilinen kutusu. Kuru pasta ağırlıklı, herkesin sevdiği karışım; kapağı açıldığında masaya yayılan çeşit.",
    contents: ["Funda kuru pastası", "Mevsim kurabiyeleri", "Bordo kurdele"],
    image: images.hediye1,
  },
  {
    id: "misafirlik",
    name: "Misafirlik Kutusu",
    audience: "Akşam ziyaretlerine",
    description:
      "Yemek sonrası çay saatine hazırlanmış seçki. Şerbetli ve kuru çeşitlerin dengeli birlikteliği.",
    contents: ["Baklava seçkisi", "Kuru pasta", "El yapımı çikolata"],
    image: images.hediye4,
  },
  {
    id: "ofis",
    name: "Ofis İkramı",
    audience: "Ekibe ve toplantıya",
    description:
      "Tek servislik ürünlerden oluşan, paylaşması kolay kutu. Toplantı masasında dağıtmak için hazır gelir.",
    contents: ["Mini lezzetler", "Makaron", "Tuzlu çeşitler"],
    image: images.hediye3,
  },
  {
    id: "ozel-gun",
    name: "Özel Gün Kutusu",
    audience: "Kutlamalara",
    description:
      "Doğum günü, yıl dönümü ve teşekkür jestleri için hazırlanan kutu. İsteğe bağlı el yazısı kart ile.",
    contents: ["İmza çikolata", "Seçili mini tatlılar", "El yazısı kart"],
    image: images.hediye2,
  },
];

export const giftRitual = [
  {
    step: "01",
    title: "Seçim",
    description:
      "Kime, hangi masaya gittiğini söyleyin; kutunun içeriğini birlikte belirleyelim.",
  },
  {
    step: "02",
    title: "Hazırlık",
    description:
      "Ürünler siparişten sonra hazırlanır, kutuya dizilir ve tazeliğini koruyacak şekilde paketlenir.",
  },
  {
    step: "03",
    title: "Paketleme",
    description:
      "Bordo kurdele, mühür ve isteğe bağlı el yazısı kart. Kutu, açılmadan önce de bir jesttir.",
  },
  {
    step: "04",
    title: "Teslim",
    description:
      "Şubeden teslim alın ya da kurumsal siparişlerde adrese gönderim için bizimle konuşun.",
  },
];

export const giftMoments = [
  "Misafirliğe giderken",
  "Ofise teşekkür ederken",
  "Doğum gününde",
  "Hoş geldin ziyaretinde",
  "Sebepsiz bir günde",
];
