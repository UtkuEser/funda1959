/**
 * Product management for the panel (D45, D46) — server-only.
 *
 * Every function checks, whoever calls it: the panel is open on this
 * deployment (test data only, `isProductManagementOpen`) and the session is
 * Merkez (SUPER_ADMIN). Hiding a menu is not the boundary; the database
 * refuses any actor but "merkez" as well.
 */

import { createHash, randomUUID } from "node:crypto";
import type { AdminScope } from "../admin/access";
import { readImageHeader } from "../image-header";
import { catalogProducts } from "../data";
import { setCodeProductVisibility } from "./visibility";
import { isProductManagementOpen } from "./config";
import { checkDraft, imageProblem, IMAGE_RULES, isUuid, publishProblems, type FieldErrors } from "./rules";
import { invalidateCatalog } from "./server";
import { productStore, ProductRefusedError, type Actor, type AdminRow, type ImageRow } from "./store";
import { imageStorage, productImageUrl } from "./storage";
import { BRANCH_IDS, type AdminProduct, type BranchId, type ProductFields, type ProductImage } from "./types";

if (typeof window !== "undefined") {
  throw new Error("catalog/admin.ts must never be imported on the client");
}

export class ProductAccessError extends Error {
  constructor() {
    super("product management: Merkez only");
    this.name = "ProductAccessError";
  }
}

export class ProductManagementClosedError extends Error {
  constructor() {
    super("product management is closed on this deployment (D46)");
    this.name = "ProductManagementClosedError";
  }
}

export class ProductValidationError extends Error {
  constructor(readonly errors: FieldErrors) {
    super(`product fields refused: ${Object.keys(errors).join(", ")}`);
    this.name = "ProductValidationError";
  }
}

export class ImageRejectedError extends Error {
  constructor(readonly reason: string) {
    super(`image refused: ${reason}`);
    this.name = "ImageRejectedError";
  }
}

function actorOf(scope: AdminScope): Actor {
  if (!isProductManagementOpen()) throw new ProductManagementClosedError();
  if (scope.user.role !== "SUPER_ADMIN") throw new ProductAccessError();
  return { account: "merkez", name: scope.user.name };
}

function toAdminProduct(r: AdminRow): AdminProduct {
  // after the first publish the branches' own rows are the stock
  const stock = { ...(r.branch_stock ?? {}), ...(r.published_at ? r.branch_status ?? {} : {}) } as Record<string, boolean>;
  const branchStock: Partial<Record<BranchId, boolean>> = {};
  for (const b of BRANCH_IDS) if (typeof stock[b] === "boolean") branchStock[b] = stock[b];
  return {
    id: r.id,
    slug: r.slug,
    status: r.status,
    version: r.version,
    name: r.name,
    categorySlug: r.category_slug,
    shortDescription: r.short_description,
    imageId: r.image_id,
    imageUrl: r.image_path ? productImageUrl(r.image_path) : null,
    sizes: (r.sizes ?? []).map((s) => ({ key: s.key, price: s.price === null || s.price === undefined ? null : Number(s.price) })),
    branchStock,
    allergens: r.allergens,
    cakeMessage: r.cake_message,
    isNew: r.is_new,
    isBestSeller: r.is_best_seller,
    isGift: r.is_gift,
    slugLocked: r.slug_locked,
    createdAt: r.created_at,
    createdBy: r.created_by,
    updatedAt: r.updated_at,
    updatedBy: r.updated_by,
    publishedAt: r.published_at,
    publishedBy: r.published_by,
    unpublishedAt: r.unpublished_at,
    unpublishedBy: r.unpublished_by,
  };
}

const toImage = (r: ImageRow): ProductImage => ({
  id: r.id,
  url: productImageUrl(r.object_path),
  width: r.width,
  height: r.height,
  bytes: r.bytes,
  mime: r.mime,
});

const toStoreFields = (f: ProductFields) => ({
  name: f.name,
  category_slug: f.categorySlug,
  short_description: f.shortDescription,
  image_id: f.imageId,
  sizes: f.sizes,
  branch_stock: f.branchStock as Record<string, boolean>,
  allergens: f.allergens,
  cake_message: f.cakeMessage,
  is_new: f.isNew,
  is_best_seller: f.isBestSeller,
  is_gift: f.isGift,
});

/* -------------------------------------------------------------------------- */

export async function listProducts(scope: AdminScope): Promise<AdminProduct[]> {
  actorOf(scope);
  return (await productStore.listAll()).map(toAdminProduct);
}

export async function getProduct(scope: AdminScope, id: string): Promise<AdminProduct | null> {
  actorOf(scope);
  if (!/^n[0-9a-f]{12}$/.test(id)) return null;
  const rows = await productStore.listAll(id);
  return rows[0] ? toAdminProduct(rows[0]) : null;
}

/**
 * Create a draft (`clientRequestId`: the same id twice gives the same draft)
 * or update a product (`id` + the version the panel loaded). A published
 * product stays complete (the database refuses otherwise) and keeps its address.
 */
export async function saveProduct(
  scope: AdminScope,
  input: { clientRequestId?: unknown; id?: unknown; expectedVersion?: unknown; fields?: unknown },
): Promise<{ product: AdminProduct; duplicate: boolean }> {
  const actor = actorOf(scope);
  const checked = checkDraft(input.fields);
  if (!checked.ok) throw new ProductValidationError(checked.errors);

  const id = input.id === undefined || input.id === null ? null : input.id;
  if (id === null) {
    const req = typeof input.clientRequestId === "string" ? input.clientRequestId.trim() : "";
    if (req.length < 8 || req.length > 80) throw new ProductValidationError({ form: "İstek kimliği geçersiz; sayfayı yenileyin." });
    const saved = await productStore.save({ actor, clientRequestId: req, id: null, expectedVersion: null, slug: checked.slug, fields: toStoreFields(checked.value) });
    return { product: toAdminProduct(saved.product), duplicate: saved.duplicate };
  }

  if (typeof id !== "string" || !/^n[0-9a-f]{12}$/.test(id)) throw new ProductRefusedError("not_found");
  const version = Number(input.expectedVersion);
  if (!Number.isInteger(version) || version < 1) throw new ProductValidationError({ form: "Sürüm bilgisi eksik; sayfayı yenileyin." });
  const saved = await productStore.save({ actor, clientRequestId: null, id, expectedVersion: version, slug: checked.slug, fields: toStoreFields(checked.value) });
  const product = toAdminProduct(saved.product);
  if (product.status !== "draft") invalidateCatalog();
  return { product, duplicate: false };
}

/** Publish (all required fields complete) or unpublish. There is no delete (D45). */
export async function setProductStatus(
  scope: AdminScope,
  input: { id?: unknown; expectedVersion?: unknown; status?: unknown },
): Promise<AdminProduct> {
  const actor = actorOf(scope);
  const status = input.status;
  if (status !== "published" && status !== "unpublished") throw new ProductValidationError({ form: "Geçersiz durum." });
  const id = typeof input.id === "string" ? input.id : "";
  if (!/^n[0-9a-f]{12}$/.test(id)) throw new ProductRefusedError("not_found");
  const version = Number(input.expectedVersion);
  if (!Number.isInteger(version) || version < 1) throw new ProductValidationError({ form: "Sürüm bilgisi eksik; sayfayı yenileyin." });

  if (status === "published") {
    // the same checks the form shows, with field messages (the database checks again)
    const current = (await productStore.listAll(id))[0];
    if (!current) throw new ProductRefusedError("not_found");
    const problems = publishProblems(toAdminProduct(current));
    if (Object.keys(problems).length > 0) throw new ProductValidationError(problems);
  }
  const row = await productStore.setStatus({ actor, id, expectedVersion: version, status });
  invalidateCatalog();
  return toAdminProduct(row);
}

/**
 * A photo from the panel. Its CONTENT is checked (type from the bytes,
 * pixel size, square, at most 4 MB, not animated) before anything is stored;
 * a file that doesn't fit is refused, never cropped. The same upload id
 * again (a retry) returns the first upload instead of storing another copy;
 * if recording it fails, the stored object is removed again.
 */
export async function uploadProductImage(
  scope: AdminScope,
  input: { clientUploadId: unknown; bytes: Uint8Array; declaredType: string | null },
): Promise<{ image: ProductImage; duplicate: boolean }> {
  const actor = actorOf(scope);
  if (!isUuid(input.clientUploadId)) throw new ImageRejectedError("Yükleme kimliği geçersiz; görseli yeniden seçin.");
  const bytes = input.bytes;
  if (bytes.length === 0) throw new ImageRejectedError("Dosya boş.");
  if (bytes.length > IMAGE_RULES.maxBytes) throw new ImageRejectedError("Görsel en fazla 4 MB olabilir.");
  const header = readImageHeader(bytes);
  if (!header) throw new ImageRejectedError("Yalnızca JPEG, PNG veya WebP görsel yüklenebilir.");
  const mime = header.type === "jpeg" ? "image/jpeg" : header.type === "png" ? "image/png" : "image/webp";
  if (input.declaredType && input.declaredType !== mime) throw new ImageRejectedError("Dosyanın türü içeriğiyle uyuşmuyor.");
  const problem = imageProblem({ width: header.width, height: header.height, bytes: bytes.length, animated: header.animated });
  if (problem) throw new ImageRejectedError(problem);

  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const earlier = await productStore.findImageByUpload(input.clientUploadId);
  if (earlier) {
    if (earlier.sha256 !== sha256) throw new ProductRefusedError("upload_id_reused");
    return { image: toImage(earlier), duplicate: true };
  }

  // a fresh path per attempt: an object being cleaned up is never overwritten or reused
  const objectPath = `img/${randomUUID()}.${header.type === "jpeg" ? "jpg" : header.type}`;
  await imageStorage.upload(objectPath, bytes, mime);
  let row: ImageRow;
  try {
    row = await productStore.registerImage({
      actor,
      clientUploadId: input.clientUploadId,
      objectPath,
      sha256,
      mime,
      width: header.width,
      height: header.height,
      bytes: bytes.length,
    });
  } catch (err) {
    await imageStorage.remove([objectPath]).catch((e) => console.error("[catalog] upload rollback failed", { objectPath, error: (e as Error).message }));
    throw err;
  }
  // the same upload id sent twice at once: the first one recorded wins, our copy goes
  if (row.object_path !== objectPath) {
    await imageStorage.remove([objectPath]).catch((e) => console.error("[catalog] duplicate upload not removed", { objectPath, error: (e as Error).message }));
    return { image: toImage(row), duplicate: true };
  }
  return { image: toImage(row), duplicate: false };
}

/** Uploads younger than this are never cleaned up (a form may still be about to use them). */
export const IMAGE_CLEANUP_MIN_AGE_MINUTES = 24 * 60;

/**
 * Removes photos no product uses. Two kinds, both older than `minAgeMinutes`:
 *   1. registry rows no product (any status) points to — the database hands
 *      them over only when unused (and a foreign key forbids the rest);
 *   2. objects with no registry row at all (an upload whose recording failed).
 * A photo used by any product, this one or another, is never touched.
 */
export async function cleanupProductImages(
  scope: AdminScope,
  { minAgeMinutes = IMAGE_CLEANUP_MIN_AGE_MINUTES }: { minAgeMinutes?: number } = {},
): Promise<{ removed: string[] }> {
  const actor = actorOf(scope);
  const age = Math.max(0, Math.floor(minAgeMinutes));
  const claimed = await productStore.claimOrphanImages(actor, age);
  // if this fails the objects become kind 2 and go next time
  await imageStorage.remove(claimed).catch((e) => console.error("[catalog] cleanup: objects not removed", { count: claimed.length, error: (e as Error).message }));

  const cutoff = Date.now() - age * 60_000;
  const old = (await imageStorage.list("img")).filter((o) => o.createdAt !== null && Date.parse(o.createdAt) <= cutoff).map((o) => o.path);
  const registered = new Set(await productStore.registeredPaths(old));
  const strays = old.filter((p) => !registered.has(p) && !claimed.includes(p));
  await imageStorage.remove(strays);
  return { removed: [...claimed, ...strays] };
}

/**
 * "Yayında" in the "Ürün Bilgisi" list (D48) — the product's general publish
 * state for every branch; branch stock is not touched.
 *   code product (p1–p18): on / off the site (`product_visibility`, 0014);
 *   panel product: publish (only when complete — the reasons come back as
 *   field errors) / unpublish (0013).
 * Returns the state the database confirmed.
 */
export async function setProductPublished(scope: AdminScope, input: { productId?: unknown; published?: unknown }): Promise<{ published: boolean }> {
  const actor = actorOf(scope);
  const id = typeof input.productId === "string" ? input.productId : "";
  if (typeof input.published !== "boolean") throw new ProductValidationError({ form: "Geçersiz durum." });
  const published = input.published;

  if (catalogProducts.some((p) => p.id === id)) {
    const confirmed = await setCodeProductVisibility(actor, id, published);
    invalidateCatalog();
    return { published: confirmed };
  }

  if (!/^n[0-9a-f]{12}$/.test(id)) throw new ProductRefusedError("not_found");
  const current = (await productStore.listAll(id))[0];
  if (!current) throw new ProductRefusedError("not_found");
  if (published === (current.status === "published")) return { published };
  // a draft that is unticked is already off the site
  if (!published && current.status === "draft") return { published: false };
  const product = await setProductStatus(scope, { id, expectedVersion: current.version, status: published ? "published" : "unpublished" });
  return { published: product.status === "published" };
}
