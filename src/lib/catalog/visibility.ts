/**
 * "Yayında" for the 18 products in code (D48; table `product_visibility`,
 * migration 0014). Server-only. A row with is_published = false takes the
 * product off the site; no row = on the site. Products added in the panel
 * use their own status instead (0013). Branch stock is a separate thing and
 * is never touched here.
 */

import { isSupabaseConfigured, SupabaseRestError, supabaseRest } from "../supabase-server";
import { ProductNotReadyError, ProductRefusedError, ProductStoreUnavailableError, type Actor } from "./store";

if (typeof window !== "undefined") {
  throw new Error("catalog/visibility.ts must never be imported on the client");
}

const isMissing = (err: unknown) =>
  err instanceof SupabaseRestError &&
  (err.status === 404 || err.code === "PGRST202" || err.code === "PGRST205" || err.code === "42P01" || err.code === "42883");

/** Code products off the site. Before 0014 none are (`tableMissing`), as before. */
export async function readHiddenProducts(): Promise<{ hidden: string[]; tableMissing: boolean }> {
  if (!isSupabaseConfigured()) return { hidden: [], tableMissing: false };
  try {
    const rows = await supabaseRest<{ product_id: string }[]>("/product_visibility?select=product_id&is_published=eq.false");
    return { hidden: (rows ?? []).map((r) => r.product_id), tableMissing: false };
  } catch (err) {
    if (isMissing(err)) return { hidden: [], tableMissing: true };
    throw err;
  }
}

/** Merkez puts a code product on / takes it off the site. */
export async function setCodeProductVisibility(actor: Actor, productId: string, published: boolean): Promise<boolean> {
  if (!isSupabaseConfigured()) throw new ProductStoreUnavailableError();
  try {
    const row = await supabaseRest<{ product_id: string; is_published: boolean } | null>("/rpc/set_product_visibility", {
      method: "POST",
      body: JSON.stringify({ p_payload: { actor_account: actor.account, actor: actor.name, product_id: productId, published } }),
    });
    if (!row || row.product_id !== productId) throw new Error("set_product_visibility returned no row");
    return row.is_published;
  } catch (err) {
    if (isMissing(err)) throw new ProductNotReadyError(`product_visibility (0014): ${(err as Error).message.slice(0, 160)}`);
    if (err instanceof SupabaseRestError && err.dbMessage === "forbidden") throw new ProductRefusedError("forbidden");
    if (err instanceof SupabaseRestError && (err.dbMessage === "invalid_product" || err.dbMessage === "invalid_status")) {
      throw new ProductRefusedError("invalid_fields");
    }
    throw err;
  }
}
