/**
 * Hikayemiz sayfasının arşiv görselleri.
 *
 * Kaynak klasör: public/Hikayemiz — dosya adları birebir kullanılır.
 * Görseller sayfada bu sırayla, tekrar etmeden yerleştirilir.
 *
 * Yeni bir arşiv görseli eklemek için: dosyayı public/Hikayemiz içine koyup
 * aşağıya sırasına uygun bir kayıt ekleyin.
 */

export type StoryImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Kadraj — her görsel için ayrı ayarlanabilir. */
  objectPosition: string;
};

export const storyImages: StoryImage[] = [
  {
    src: "/Hikayemiz/img-hakkimizda-1.jpg",
    alt: "Funda 1959 aile arşivinden bir kare",
    width: 675,
    height: 770,
    objectPosition: "center",
  },
  {
    src: "/Hikayemiz/img-hakkimizda-2.jpg",
    alt: "Funda 1959 aile arşivinden bir kare",
    width: 675,
    height: 770,
    objectPosition: "center",
  },
  {
    src: "/Hikayemiz/img-hakkimizda-3.jpg",
    alt: "Tarakçı ailesinin pastacılık yıllarından bir arşiv karesi",
    width: 675,
    height: 770,
    objectPosition: "center",
  },
  {
    src: "/Hikayemiz/img-hakkimizda-4.jpg",
    alt: "Funda Pastanesi’nin ilk yıllarından bir arşiv karesi",
    width: 675,
    height: 770,
    objectPosition: "center",
  },
];

/** Akıştaki kullanım sırası — aynı görsel iki kez kullanılmaz. */
export const [storyImageOne, storyImageTwo, storyImageThree, storyImageFour] =
  storyImages;
