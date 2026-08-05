/** Şube bilgileri — kart, harita bağlantısı ve şube sayfası bu veriyi kullanır. */

import { images, type ImageAsset } from "./images";

export type Branch = {
  id: string;
  name: string;
  shortName: string;
  atmosphere: string;
  description: string;
  address: string;
  district: string;
  phone: string;
  phoneHref: string;
  hours: string;
  mapUrl: string;
  features: string[];
  image: ImageAsset;
};

export const branches: Branch[] = [
  {
    id: "gop",
    name: "Funda 1959 GOP",
    shortName: "GOP",
    atmosphere: "Köklü mahalle pastanesi hissi",
    description:
      "Gaziosmanpaşa’nın alışılmış durağı. Sabah kahvesiyle başlayan, akşamüstü kutu kutu tatlıyla biten bir gün burada geçer.",
    address: "Gaziosmanpaşa Mahallesi, Çankaya / Ankara",
    district: "Gaziosmanpaşa",
    phone: "+90 312 447 00 00",
    phoneHref: "tel:+903124470000",
    hours: "Her gün 08.00 – 22.00",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Funda+1959+Gaziosmanpa%C5%9Fa+Ankara",
    features: ["Geniş oturma alanı", "Tam ürün vitrini", "Sabah kahvaltısı"],
    image: images.subeGop,
  },
  {
    id: "panora",
    name: "Funda 1959 Panora",
    shortName: "Panora",
    atmosphere: "Gün içinde tatlı bir mola",
    description:
      "Alışverişin ortasında verilen kısa mola. Kahve, bir dilim pasta ve çıkarken eve götürülen bir kutu.",
    address: "Panora AVM, Oran / Ankara",
    district: "Oran",
    phone: "+90 312 448 00 00",
    phoneHref: "tel:+903124480000",
    hours: "Her gün 10.00 – 22.00",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Funda+1959+Panora+AVM+Ankara",
    features: ["AVM içi", "Hızlı servis", "Paket seçenekleri"],
    image: images.subePanora,
  },
  {
    id: "incek",
    name: "Funda 1959 İncek",
    shortName: "İncek",
    atmosphere: "Modern yaşamın sıcak pastane durağı",
    description:
      "Yeşilin içinde, sakin bir köşe. Uzun sohbetler, hafta sonu buluşmaları ve ferah bir salon.",
    address: "İncek Bulvarı, Gölbaşı / Ankara",
    district: "İncek",
    phone: "+90 312 449 00 00",
    phoneHref: "tel:+903124490000",
    hours: "Her gün 09.00 – 22.00",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Funda+1959+%C4%B0ncek+Ankara",
    features: ["Ferah salon", "Açık alan", "Özel gün siparişi"],
    image: images.subeIncek,
  },
];

export const getBranch = (id: string) => branches.find((branch) => branch.id === id);

export const branchesIntro = {
  eyebrow: "Funda’da Buluşalım",
  title: "Üç şube, aynı sıcaklık.",
  description:
    "Şubelerimiz birbirinin kopyası değil; her biri bulunduğu mahallenin ritmine göre yaşıyor. Ortak olan tek şey masaya gelen tabak ve karşılama.",
};
