/**
 * Products Merkez adds in the admin panel (SUPABASE_PLAN.md D45, D46; table
 * `catalog_products`, migration 0013). The 18 products in `lib/data.ts` are
 * not these: they stay in code with their ids.
 */

export type ProductStatus = "draft" | "published" | "unpublished";

export const BRANCH_IDS = ["gop", "panora", "incek"] as const;
export type BranchId = (typeof BRANCH_IDS)[number];

/** one price: a size id of the category's kind, or "" for a single-price product */
export type SizePrice = { key: string; price: number | null };

/** What the panel edits. A draft may be incomplete; publishing needs all of it (`publishProblems`). */
export type ProductFields = {
  name: string;
  categorySlug: string | null;
  shortDescription: string;
  /** a registered upload (`catalog_product_images.id`) */
  imageId: string | null;
  sizes: SizePrice[];
  /** branch -> active (true) / passive (false); no quantities (D44) */
  branchStock: Partial<Record<BranchId, boolean>>;
  /** only what Merkez enters; null = not entered */
  allergens: string | null;
  /** the customer may write a message on it (pasta yazısı), per product */
  cakeMessage: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  isGift: boolean;
};

/** One product as the panel sees it (drafts included). Merkez only. */
export type AdminProduct = ProductFields & {
  id: string;
  slug: string;
  status: ProductStatus;
  /** optimistic lock: every save / status change bumps it */
  version: number;
  imageUrl: string | null;
  /** slug no longer follows the name once published the first time */
  slugLocked: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  publishedAt: string | null;
  publishedBy: string | null;
  unpublishedAt: string | null;
  unpublishedBy: string | null;
};

/** A registered product image (an object in the `product-images` bucket). */
export type ProductImage = {
  id: string;
  url: string;
  width: number;
  height: number;
  bytes: number;
  mime: "image/jpeg" | "image/png" | "image/webp";
};
