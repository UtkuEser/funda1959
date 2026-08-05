/** Marka hikayesi: ana sayfa özeti, dönemler ve marka değerleri. */

import { images } from "./images";

export const storyTeaser = {
  eyebrow: "1959’dan Bugüne",
  title: "Bir tatlı hafızanın hikayesi.",
  description:
    "1959’da başlayan yolculuk, bugün de sıcak sofralara, özel günlere ve günlük küçük mutluluklara eşlik etmeye devam ediyor.",
  image: images.hikaye,
  cta: { href: "/hikayemiz", label: "Hikayemizi Keşfedin" },
};

export const storyIntro = {
  lead: "Funda 1959, bir şehrin tatlı alışkanlığı.",
  paragraphs: [
    "Her şey küçük bir vitrinle başladı. Tezgahın arkasında bir usta, önünde her gün aynı saatte gelen birkaç müşteri vardı. Zamanla o vitrin büyüdü; ama alışkanlık değişmedi.",
    "Bugün Funda; kahve molasının, misafirliğe giderken uğranan durağın, doğum günü masasına gelen pastanın adı. Yıllar içinde tarifler tazelendi, ustalar çoğaldı, şubeler eklendi.",
    "Değişmeyen şey şu: bir pastane yalnızca ürün satmaz. Bir mahallenin hafızasını taşır, kutlamalarına ortak olur, sıradan bir salı gününü bile tatlandırır.",
  ],
};

export type StoryChapter = {
  year: string;
  title: string;
  description: string;
};

export const storyChapters: StoryChapter[] = [
  {
    year: "1959",
    title: "İlk vitrin",
    description:
      "Ankara’da küçük bir dükkanda, aile ustalığıyla açılan ilk vitrin. Günlük üretim, sınırlı çeşit, sınırsız özen.",
  },
  {
    year: "1970’ler",
    title: "Pastacılığa açılan kapı",
    description:
      "Geleneksel tatlıların yanına Avrupa pastacılığı eklendi. Kremalı pastalar ve el yapımı çikolatalar vitrine girdi.",
  },
  {
    year: "1990’lar",
    title: "Mahallenin buluşma noktası",
    description:
      "Pastane artık yalnızca alışveriş yeri değil; oturulan, sohbet edilen, randevu verilen bir adres haline geldi.",
  },
  {
    year: "2010’lar",
    title: "Yeni şubeler",
    description:
      "Şehrin farklı noktalarına açılırken üretim disiplini ve karşılama biçimi aynı kaldı.",
  },
  {
    year: "Bugün",
    title: "Pastane kültürünün sıcak hali",
    description:
      "Üç şube, onlarca çeşit ve her gün yeniden kurulan aynı ritüel: bir kahve, bir tatlı, bir kutu mutluluk.",
  },
];

export const storyValues = [
  {
    title: "Günlük üretim",
    description:
      "Vitrine çıkan her ürün o gün hazırlanır. Kalan ürünle ertesi güne başlanmaz.",
  },
  {
    title: "Değişmeyen tarifler",
    description:
      "İmza ürünlerin tarifi yıllardır aynı. Yenilik, klasiğin yerine değil yanına gelir.",
  },
  {
    title: "Karşılama biçimi",
    description:
      "Bir pastanenin lezzeti kadar kapıdaki karşılaması da hatırlanır. Sıcaklık, servisin parçasıdır.",
  },
  {
    title: "Paylaşma kültürü",
    description:
      "Ürünlerimiz çoğu zaman tek başına değil, birlikte tüketilmek için hazırlanır.",
  },
];
