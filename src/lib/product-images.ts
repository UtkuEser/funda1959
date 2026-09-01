/**
 * Demo product photography map.
 *
 * No per-product folders yet — each category folder under /public/products
 * holds a few real photos directly. Products are matched to photos by
 * CATEGORY only (a "Yaş Pastalar" product gets any yaş-pasta photo), and the
 * photos cycle when a category has fewer images than products.
 *
 * The filename lists below mirror the actual files on disk (verified, not
 * guessed). Pure data — safe to import from client components.
 */

/** folder under /public/products  ->  real filenames present there */
const FOLDER_IMAGES: Record<string, string[]> = {
  "yas-pastalar": ["yaspasta1.jpg", "yaspasta2.jpg", "yaspasta3.jpg"],
  "adet-pastalar": ["adetpasta1.jpg", "adetpasta4.jpg", "adetpasta10.jpg"],
  "mini-lezzetler": ["minilezzet1.jpg"],
  "kuru-pastalar": ["kurupasta4.jpg"],
  "borekler-ve-mayalilar": ["borek2.jpg"],
  kekler: ["kekler3.jpg"],
  "sutlu-tatlilar": ["sutlu3.jpg"],
  "serbetli-tatlilar": ["serbetli4.jpg"],
  cikolatalar: ["cikolatalar1-detay.jpg"],
  atistirmaliklar: ["atistirmaliklar3.jpg"],
  "ozel-gun-pastalari": [], // not shot yet
};

/** product `categorySlug` -> /public/products folder (identical unless listed) */
const CATEGORY_TO_FOLDER: Record<string, string> = {
  "ozel-gun": "ozel-gun-pastalari",
};

/** category-appropriate stand-in when a folder has no photos yet */
const FOLDER_FALLBACK: Record<string, string> = {
  // celebration cakes are, visually, yaş pastalar
  "ozel-gun-pastalari": "yas-pastalar",
};

function imagesForFolder(folder: string): string[] {
  const direct = FOLDER_IMAGES[folder] ?? [];
  if (direct.length > 0) return direct.map((f) => `/products/${folder}/${f}`);

  const fb = FOLDER_FALLBACK[folder];
  const fbImages = fb ? (FOLDER_IMAGES[fb] ?? []) : [];
  if (fbImages.length > 0) return fbImages.map((f) => `/products/${fb}/${f}`);

  return [];
}

/** All demo photos available for a product category (already public paths). */
export function productImagesForCategory(categorySlug: string): string[] {
  return imagesForFolder(CATEGORY_TO_FOLDER[categorySlug] ?? categorySlug);
}

/**
 * The nth product in a category gets the nth photo, wrapping around when the
 * category has fewer photos than products. Returns null only when a category
 * (and its fallback) genuinely has no photo — the UI then keeps its gradient.
 */
export function productImage(categorySlug: string, indexInCategory: number): string | null {
  const imgs = productImagesForCategory(categorySlug);
  if (imgs.length === 0) return null;
  return imgs[indexInCategory % imgs.length];
}
