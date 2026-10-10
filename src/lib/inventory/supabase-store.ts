/**
 * Branch stock status in Supabase — table `public.branch_product_status`
 * (supabase/migrations/0003_branch_product_status.sql). One row per
 * branch + product, a boolean `is_active`; no quantities. Server-only: goes
 * through the service-role REST client, the table itself has RLS on and no
 * policies.
 */
import { supabaseRest } from "../supabase-server";
import { InventoryStoreError, type InventoryOverride, type InventoryStore, type StockStatusWrite } from "./overrides";

if (typeof window !== "undefined") {
  throw new Error("inventory/supabase-store.ts must never be imported on the client");
}

type Row = {
  branch_slug: string;
  product_id: string;
  is_active: boolean;
  updated_by: string | null;
  updated_at: string;
};

const TABLE = "branch_product_status";

export class SupabaseInventoryStore implements InventoryStore {
  readonly kind = "supabase" as const;

  async loadAll(): Promise<Record<string, InventoryOverride>> {
    let rows: Row[];
    try {
      rows = await supabaseRest<Row[]>(`/${TABLE}?select=branch_slug,product_id,is_active,updated_by,updated_at`);
    } catch (err) {
      throw new InventoryStoreError("READ_FAILED", `${TABLE} read: ${(err as Error).message}`);
    }
    const out: Record<string, InventoryOverride> = {};
    for (const r of rows ?? []) {
      out[`${r.branch_slug}:${r.product_id}`] = {
        status: r.is_active ? "active" : "passive",
        updatedAt: Date.parse(r.updated_at) || Date.now(),
        updatedBy: r.updated_by ?? undefined,
      };
    }
    return out;
  }

  /** One upsert request for the whole batch — PostgREST runs it as a single statement (all or nothing). */
  async saveStatuses(branchId: string, rows: StockStatusWrite[], updatedBy: string): Promise<void> {
    const body = rows.map((r) => ({
      branch_slug: branchId,
      product_id: r.productId,
      is_active: r.active,
      updated_by: updatedBy,
    }));
    try {
      await supabaseRest<null>(`/${TABLE}?on_conflict=branch_slug,product_id`, {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new InventoryStoreError("WRITE_FAILED", `${TABLE} upsert: ${(err as Error).message}`);
    }
  }
}
