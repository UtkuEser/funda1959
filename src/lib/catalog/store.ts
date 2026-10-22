/**
 * Products added in the panel — the database side (migration 0013). Server-only.
 *
 * Every call goes through `supabaseRest` (service role + environment marker,
 * D3). The storefront reads ONLY the view `catalog_storefront_products`
 * (published products); drafts are read only through the Merkez RPCs. Without
 * Supabase there is no stand-in: nothing is listed, nothing is saved.
 */

import { isSupabaseConfigured, SupabaseRestError, supabaseRest } from "../supabase-server";

if (typeof window !== "undefined") {
  throw new Error("catalog/store.ts must never be imported on the client");
}

/** Migration 0013 isn't applied to the connected project. */
export class ProductNotReadyError extends Error {
  constructor(detail: string) {
    super(`catalog_products tables/functions missing (0013) — ${detail}`);
    this.name = "ProductNotReadyError";
  }
}

/** No Supabase on this deployment: products can't be stored. */
export class ProductStoreUnavailableError extends Error {
  constructor() {
    super("catalog products: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
    this.name = "ProductStoreUnavailableError";
  }
}

/** A rule the database refused (`raise exception` text or a constraint), e.g. "version_conflict". */
export class ProductRefusedError extends Error {
  constructor(readonly code: ProductRefusal) {
    super(`catalog product refused: ${code}`);
    this.name = "ProductRefusedError";
  }
}

export type ProductRefusal =
  | "forbidden"
  | "invalid_fields"
  | "image_not_found"
  | "invalid_request_id"
  | "slug_taken"
  | "not_found"
  | "version_conflict"
  | "invalid_status"
  | "incomplete"
  | "not_published"
  | "invalid_upload_id"
  | "upload_id_reused";

const KNOWN_REFUSALS = new Set<string>([
  "forbidden",
  "invalid_fields",
  "image_not_found",
  "invalid_request_id",
  "slug_taken",
  "not_found",
  "version_conflict",
  "invalid_status",
  "incomplete",
  "not_published",
  "invalid_upload_id",
  "upload_id_reused",
]);

const isMissing = (err: unknown) =>
  err instanceof SupabaseRestError &&
  (err.status === 404 || err.code === "PGRST202" || err.code === "PGRST205" || err.code === "42P01" || err.code === "42883");

function refusalOf(err: unknown): ProductRefusedError | null {
  if (!(err instanceof SupabaseRestError)) return null;
  const msg = err.dbMessage ?? "";
  if (KNOWN_REFUSALS.has(msg)) return new ProductRefusedError(msg as ProductRefusal);
  if (err.code === "23514") return new ProductRefusedError(msg.includes("catalog_products_complete") ? "incomplete" : "invalid_fields");
  if (err.code === "23505") return new ProductRefusedError(msg.includes("slug") ? "slug_taken" : "invalid_fields");
  if (err.code === "23503") return new ProductRefusedError("image_not_found");
  if (err.code === "22P02") return new ProductRefusedError("invalid_fields");
  return null;
}

async function call<T>(name: string, run: () => Promise<T>): Promise<T> {
  if (!isSupabaseConfigured()) throw new ProductStoreUnavailableError();
  try {
    return await run();
  } catch (err) {
    if (isMissing(err)) throw new ProductNotReadyError(`${name}: ${(err as Error).message.slice(0, 160)}`);
    throw refusalOf(err) ?? err;
  }
}

const rpc = <T>(name: string, args: Record<string, unknown>) =>
  call(name, () => supabaseRest<T>(`/rpc/${name}`, { method: "POST", body: JSON.stringify(args) }));

/** One published product as the storefront view returns it. */
export type StorefrontRow = {
  id: string;
  slug: string;
  name: string;
  category_slug: string;
  short_description: string;
  image_path: string;
  sizes: { key: string; price: number }[];
  allergens: string | null;
  cake_message: boolean;
  is_new: boolean;
  is_best_seller: boolean;
  is_gift: boolean;
  branch_stock: Record<string, boolean>;
  updated_at: string;
};

/** One product for the panel (any status), as `catalog_product_json` returns it. */
export type AdminRow = {
  id: string;
  slug: string;
  status: "draft" | "published" | "unpublished";
  name: string;
  category_slug: string | null;
  short_description: string;
  image_id: string | null;
  image_path: string | null;
  sizes: { key: string; price: number | null }[];
  branch_stock: Record<string, boolean>;
  branch_status: Record<string, boolean> | null;
  allergens: string | null;
  cake_message: boolean;
  is_new: boolean;
  is_best_seller: boolean;
  is_gift: boolean;
  version: number;
  slug_locked: boolean;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  published_at: string | null;
  published_by: string | null;
  unpublished_at: string | null;
  unpublished_by: string | null;
};

export type ImageRow = {
  id: string;
  object_path: string;
  sha256: string;
  mime: "image/jpeg" | "image/png" | "image/webp";
  width: number;
  height: number;
  bytes: number;
  created_at: string;
};

/** Who acts: always Merkez (the session's admin), never a request field. */
export type Actor = { account: "merkez"; name: string };

export type SaveFields = {
  name: string;
  category_slug: string | null;
  short_description: string;
  image_id: string | null;
  sizes: { key: string; price: number | null }[];
  branch_stock: Record<string, boolean>;
  allergens: string | null;
  cake_message: boolean;
  is_new: boolean;
  is_best_seller: boolean;
  is_gift: boolean;
};

const STOREFRONT_COLUMNS =
  "id,slug,name,category_slug,short_description,image_path,sizes,allergens,cake_message,is_new,is_best_seller,is_gift,branch_stock,updated_at";

export const productStore = {
  /** Published products only. Before 0013 there are none (not an error: the code catalog is the catalog). */
  async listPublished(): Promise<{ rows: StorefrontRow[]; tableMissing: boolean }> {
    if (!isSupabaseConfigured()) return { rows: [], tableMissing: false };
    try {
      const rows = await supabaseRest<StorefrontRow[]>(
        `/catalog_storefront_products?select=${STOREFRONT_COLUMNS}&order=published_at.asc,id.asc`,
      );
      return { rows: rows ?? [], tableMissing: false };
    } catch (err) {
      if (isMissing(err)) return { rows: [], tableMissing: true };
      throw err;
    }
  },

  /** Every product (drafts included), or one. Merkez only — the caller checks the session. */
  async listAll(id: string | null = null): Promise<AdminRow[]> {
    return (await rpc<AdminRow[] | null>("catalog_list_products", { p_id: id })) ?? [];
  },

  async save(input: {
    actor: Actor;
    clientRequestId: string | null;
    id: string | null;
    expectedVersion: number | null;
    slug: string;
    fields: SaveFields;
  }): Promise<{ product: AdminRow; duplicate: boolean }> {
    const r = await rpc<{ product: AdminRow | null; duplicate: boolean } | null>("catalog_save_product", {
      p_payload: {
        actor_account: input.actor.account,
        actor: input.actor.name,
        client_request_id: input.clientRequestId,
        id: input.id,
        expected_version: input.expectedVersion,
        slug: input.slug,
        fields: input.fields,
      },
    });
    if (!r?.product?.id) throw new Error("catalog_save_product returned no product");
    return { product: r.product, duplicate: Boolean(r.duplicate) };
  },

  async setStatus(input: { actor: Actor; id: string; expectedVersion: number; status: "published" | "unpublished" }): Promise<AdminRow> {
    const r = await rpc<AdminRow | null>("catalog_set_product_status", {
      p_payload: {
        actor_account: input.actor.account,
        actor: input.actor.name,
        id: input.id,
        expected_version: input.expectedVersion,
        status: input.status,
      },
    });
    if (!r?.id) throw new Error("catalog_set_product_status returned no product");
    return r;
  },

  /** The registry row of an earlier attempt with the same upload id, if any. */
  async findImageByUpload(clientUploadId: string): Promise<ImageRow | null> {
    const rows = await call("catalog_product_images", () =>
      supabaseRest<ImageRow[]>(
        `/catalog_product_images?select=id,object_path,sha256,mime,width,height,bytes,created_at&client_upload_id=eq.${encodeURIComponent(clientUploadId)}&limit=1`,
      ),
    );
    return rows?.[0] ?? null;
  },

  async registerImage(input: {
    actor: Actor;
    clientUploadId: string;
    objectPath: string;
    sha256: string;
    mime: string;
    width: number;
    height: number;
    bytes: number;
  }): Promise<ImageRow> {
    const r = await rpc<ImageRow | null>("catalog_register_image", {
      p_payload: {
        actor_account: input.actor.account,
        actor: input.actor.name,
        client_upload_id: input.clientUploadId,
        object_path: input.objectPath,
        sha256: input.sha256,
        mime: input.mime,
        width: input.width,
        height: input.height,
        bytes: input.bytes,
      },
    });
    if (!r?.id) throw new Error("catalog_register_image returned no row");
    return r;
  },

  /** Registry rows of photos no product uses, older than the given age — removed; their object paths returned. */
  async claimOrphanImages(actor: Actor, minAgeMinutes: number): Promise<string[]> {
    return (await rpc<string[] | null>("catalog_claim_orphan_images", { p_actor_account: actor.account, p_min_age_minutes: minAgeMinutes })) ?? [];
  },

  /** Which of these object paths still have a registry row. */
  async registeredPaths(paths: string[]): Promise<string[]> {
    if (paths.length === 0) return [];
    return (await rpc<string[] | null>("catalog_registered_image_paths", { p_paths: paths })) ?? [];
  },
};
