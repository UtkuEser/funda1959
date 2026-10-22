/**
 * Product rules for the panel (D45, D46) — pure, client-safe: the form and
 * the server run the same checks; migration 0013 checks the stored shape
 * again. The catalog structure is the code's (`lib/data.ts`): its 11
 * categories, the size kind a category implies and that kind's size ids.
 */

import { categories, isCodeProductSlug, SIZE_OPTIONS, slugify, variantKindFor } from "../data";
import { BRANCH_IDS, type BranchId, type ProductFields, type SizePrice } from "./types";

export const PRODUCT_LIMITS = {
  nameMin: 2,
  nameMax: 80,
  shortMin: 10,
  shortMax: 300,
  allergensMax: 500,
  maxPrice: 100_000,
} as const;

/**
 * Product photos (D46): the existing ones are square (1280 × 1280), so a new
 * one is square too — within 1 % — from 800 to 1600 px a side, at most 4 MB,
 * JPEG / PNG / WebP, not animated. Never cropped without a preview: an image
 * that doesn't fit is refused, not altered.
 */
export const IMAGE_RULES = {
  maxBytes: 4 * 1024 * 1024,
  minSide: 800,
  maxSide: 1600,
  squareTolerance: 0.01,
  types: ["image/jpeg", "image/png", "image/webp"] as const,
} as const;

export type FieldErrors = Partial<Record<keyof ProductFields | "slug" | "form", string>>;

/** The URL slug a name gets — the same rule as the code catalog's. */
export function productSlug(name: string): string {
  return slugify(name).slice(0, 80).replace(/-+$/g, "");
}

/** "" for a single-price category, else the category's size ids, smallest first. */
export function sizeKeysFor(categorySlug: string): string[] {
  const kind = variantKindFor(categorySlug);
  return kind === "none" ? [""] : SIZE_OPTIONS[kind].map((o) => o.id);
}

export const isCategory = (slug: unknown): slug is string => typeof slug === "string" && categories.some((c) => c.slug === slug);

/** > 0, ≤ 100.000 TL, at most two decimals (kuruş) */
export function isValidPrice(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v > 0 && v <= PRODUCT_LIMITS.maxPrice && Math.abs(Math.round(v * 100) - v * 100) < 1e-6;
}

const text = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

/**
 * A draft as sent by the panel -> clean fields, or field errors. A draft may
 * be incomplete (no category, image, prices yet) but never malformed: what
 * is there must be valid. The name is needed from the start (it makes the
 * address).
 */
export function checkDraft(raw: unknown): { ok: true; value: ProductFields; slug: string } | { ok: false; errors: FieldErrors } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: FieldErrors = {};

  const name = text(r.name);
  const slug = productSlug(name);
  if (name.length < PRODUCT_LIMITS.nameMin || name.length > PRODUCT_LIMITS.nameMax || !slug) {
    errors.name = `Ürün adı ${PRODUCT_LIMITS.nameMin}–${PRODUCT_LIMITS.nameMax} karakter olmalı.`;
  } else if (isCodeProductSlug(slug)) {
    errors.name = "Bu adla bir ürün zaten var.";
  }

  const categorySlug = r.categorySlug === null || r.categorySlug === undefined || r.categorySlug === "" ? null : r.categorySlug;
  if (categorySlug !== null && !isCategory(categorySlug)) errors.categorySlug = "Geçerli bir kategori seçin.";

  const shortDescription = text(r.shortDescription);
  if (shortDescription.length > PRODUCT_LIMITS.shortMax) errors.shortDescription = `Kısa açıklama en fazla ${PRODUCT_LIMITS.shortMax} karakter olabilir.`;

  const imageId = r.imageId === null || r.imageId === undefined || r.imageId === "" ? null : r.imageId;
  if (imageId !== null && !isUuid(imageId)) errors.imageId = "Görsel geçersiz; yeniden yükleyin.";

  const sizes: SizePrice[] = [];
  if (!Array.isArray(r.sizes)) {
    if (r.sizes !== undefined) errors.sizes = "Fiyatlar geçersiz.";
  } else {
    const allowed = isCategory(categorySlug) ? sizeKeysFor(categorySlug) : null;
    const seen = new Set<string>();
    for (const item of r.sizes) {
      const s = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
      const key = typeof s.key === "string" ? s.key : null;
      const price = s.price === null || s.price === undefined || s.price === "" ? null : s.price;
      if (key === null || seen.has(key) || (allowed && !allowed.includes(key)) || (!allowed && key !== "" && !/^[0-9a-z.-]{1,10}$/.test(key))) {
        errors.sizes = "Seçilen boyutlar bu kategoriye uymuyor.";
        break;
      }
      if (price !== null && !isValidPrice(price)) {
        errors.sizes = `Fiyat 0'dan büyük, en fazla ${PRODUCT_LIMITS.maxPrice.toLocaleString("tr-TR")} TL ve en fazla iki ondalık olmalı.`;
        break;
      }
      seen.add(key);
      sizes.push({ key, price: price as number | null });
    }
    if (!errors.sizes && seen.has("") && sizes.length > 1) errors.sizes = "Tek fiyatlı üründe tek fiyat olur.";
  }
  // smallest first, the order the storefront uses
  if (isCategory(categorySlug)) {
    const order = sizeKeysFor(categorySlug);
    sizes.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  }

  const branchStock: Partial<Record<BranchId, boolean>> = {};
  if (r.branchStock !== undefined && r.branchStock !== null) {
    if (typeof r.branchStock !== "object" || Array.isArray(r.branchStock)) errors.branchStock = "Şube stok seçimi geçersiz.";
    else {
      for (const [k, v] of Object.entries(r.branchStock as Record<string, unknown>)) {
        if (!(BRANCH_IDS as readonly string[]).includes(k) || typeof v !== "boolean") {
          errors.branchStock = "Şube stok seçimi geçersiz.";
          break;
        }
        branchStock[k as BranchId] = v;
      }
    }
  }

  const allergensText = text(r.allergens);
  const allergens = allergensText ? allergensText : null;
  if (allergens && allergens.length > PRODUCT_LIMITS.allergensMax) errors.allergens = `Alerjen bilgisi en fazla ${PRODUCT_LIMITS.allergensMax} karakter olabilir.`;

  const flag = (k: string): boolean => {
    if (r[k] === undefined) return false;
    if (typeof r[k] !== "boolean") errors.form = "Seçenekler geçersiz.";
    return r[k] === true;
  };
  const value: ProductFields = {
    name,
    categorySlug: categorySlug as string | null,
    shortDescription,
    imageId: imageId as string | null,
    sizes,
    branchStock,
    allergens,
    cakeMessage: flag("cakeMessage"),
    isNew: flag("isNew"),
    isBestSeller: flag("isBestSeller"),
    isGift: flag("isGift"),
  };
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, value, slug };
}

/** What is still missing before the product can be published (empty = publishable). */
export function publishProblems(f: ProductFields): FieldErrors {
  const errors: FieldErrors = {};
  if (!isCategory(f.categorySlug)) errors.categorySlug = "Kategori seçin.";
  if (f.shortDescription.length < PRODUCT_LIMITS.shortMin) errors.shortDescription = `Kısa açıklama en az ${PRODUCT_LIMITS.shortMin} karakter olmalı.`;
  if (!f.imageId) errors.imageId = "Ürün görseli yükleyin.";
  if (isCategory(f.categorySlug)) {
    const allowed = sizeKeysFor(f.categorySlug);
    const single = allowed.length === 1 && allowed[0] === "";
    if (f.sizes.length === 0) errors.sizes = single ? "Fiyat girin." : "En az bir boyut seçip fiyatını girin.";
    else if (f.sizes.some((s) => !allowed.includes(s.key))) errors.sizes = "Seçilen boyutlar bu kategoriye uymuyor.";
    else if (f.sizes.some((s) => !isValidPrice(s.price))) errors.sizes = "Her boyutun fiyatını girin.";
  }
  if (BRANCH_IDS.some((b) => typeof f.branchStock[b] !== "boolean")) errors.branchStock = "Her şube için stok durumunu seçin.";
  return errors;
}

/** Is an uploaded image's header acceptable? (type, size, square, not animated) — null = fine. */
export function imageProblem(info: { width: number; height: number; bytes: number; animated: boolean }): string | null {
  if (info.bytes > IMAGE_RULES.maxBytes) return "Görsel en fazla 4 MB olabilir.";
  if (info.animated) return "Hareketli görsel yüklenemez.";
  const long = Math.max(info.width, info.height);
  const short = Math.min(info.width, info.height);
  if (short < IMAGE_RULES.minSide) return `Görsel en az ${IMAGE_RULES.minSide} × ${IMAGE_RULES.minSide} piksel olmalı.`;
  if (long > IMAGE_RULES.maxSide) return `Görselin uzun kenarı en fazla ${IMAGE_RULES.maxSide} piksel olabilir.`;
  if (long - short > long * IMAGE_RULES.squareTolerance) return "Görsel kare olmalı (mevcut ürün fotoğrafları gibi). Kırpma, önizlemeyle sizin onayınızla yapılır.";
  return null;
}
