/**
 * Funda Defteri — blog değil, editorial ilham alanı.
 * Kartlar kısa metnin tamamını gösterir; ayrı yazı sayfası yoktur.
 */

import { images, type ImageAsset } from "./images";

export type JournalEntry = {
  id: string;
  label: string;
  title: string;
  excerpt: string;
  image: ImageAsset;
};

export const journalIntro = {
  eyebrow: "Funda Defteri",
  title: "Tatlı ritüeller üzerine notlar.",
  description:
    "Pastane kültürü küçük alışkanlıklardan oluşur: kahvenin yanına ne konur, misafirliğe ne götürülür, bir kutu nasıl hazırlanır. Defterimizde bunları yazıyoruz.",
};

export const journalEntries: JournalEntry[] = [
  {
    id: "kahvenin-yanina",
    label: "Ritüel",
    title: "Kahvenin yanına ne iyi gider?",
    excerpt:
      "Sert bir espresso yanında tuzlu karamel, sütlü kahve yanında kuru pasta. Kural değil ama iyi bir başlangıç: kahve ne kadar yoğunsa, tatlı o kadar sade olsun.",
    image: images.defter1,
  },
  {
    id: "misafirlik",
    label: "Adab",
    title: "Misafirliğe giderken ne alınır?",
    excerpt:
      "Sofrada ne olduğunu bilmiyorsanız paylaşılabilir bir kutu seçin. Kuru pasta ve çikolata her masaya uyar; şerbetli tatlı ise akşam yemeğinden sonra yerini bulur.",
    image: images.defter2,
  },
  {
    id: "ozel-gunler",
    label: "Kutlama",
    title: "Özel günlerde küçük tatlı ritüeller",
    excerpt:
      "Pastanın büyüklüğü davetli sayısına, tadı ise günün sahibine göre seçilir. Kalabalık masalarda iki küçük pasta, tek büyük pastadan daha iyi iş görür.",
    image: images.defter3,
  },
  {
    id: "tatli-mola",
    label: "Mola",
    title: "Funda ile tatlı mola önerileri",
    excerpt:
      "Sabah bir kek dilimi, öğleden sonra tek servislik bir tatlı, akşamüstü kutuya dizilmiş birkaç kurabiye. Günü bölmenin en zarif yolu.",
    image: images.defter4,
  },
];
