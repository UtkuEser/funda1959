/** Ana sayfadaki hikâye bloğu. Hikayemiz sayfası src/content/storyPage.ts kullanır. */

import { images } from "./images";

export const storyTeaser = {
  eyebrow: "1959’dan Bugüne",
  title: "Bir tatlı hafızanın hikayesi.",
  description:
    "1959’da başlayan yolculuk, bugün de sıcak sofralara, özel günlere ve günlük küçük mutluluklara eşlik etmeye devam ediyor.",
  image: images.arsiv4,
  cta: { href: "/hikayemiz", label: "Hikayemizi Keşfedin" },
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

