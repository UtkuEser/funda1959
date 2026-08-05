/**
 * Hikayemiz sayfasının arşiv görselleri.
 *
 * Kaynak: public/Hikayemiz — dosya adı sırasıyla, tekrar edilmeden kullanılır.
 * Görsel verisi merkezi kayıttan (src/content/images.ts) gelir.
 */

import { images, type ImageAsset } from "./images";

export const storyImages: ImageAsset[] = [
  images.arsiv1,
  images.arsiv2,
  images.arsiv3,
  images.arsiv4,
];

export const [storyImageOne, storyImageTwo, storyImageThree, storyImageFour] =
  storyImages;
