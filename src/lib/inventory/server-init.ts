/**
 * Server-only bootstrap: picks where the ops panel's branch stock statuses
 * live, once per process. Import it from server entry points that read or
 * write branch availability, and call `refreshInventory()` before reading.
 *
 *   Supabase configured        -> table `branch_product_status` (production)
 *   serverless, no Supabase    -> "unavailable": reads use the seed, every
 *                                 save fails with NOT_CONFIGURED (the deploy's
 *                                 file system is read-only and per-instance —
 *                                 a file there would silently lose changes)
 *   otherwise (local dev)      -> JSON file under `.data/` (gitignored;
 *                                 `INVENTORY_OVERRIDES_FILE` points it elsewhere)
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { isSupabaseConfigured } from "../supabase-server";
import {
  InventoryStoreError,
  inventoryStoreKind,
  setInventoryStore,
  syncInventoryOverrides,
  type InventoryOverride,
  type InventoryStore,
} from "./overrides";
import { SupabaseInventoryStore } from "./supabase-store";

if (typeof window !== "undefined") {
  throw new Error("inventory/server-init.ts must never be imported on the client");
}

class FileInventoryStore implements InventoryStore {
  readonly kind = "file" as const;
  constructor(private readonly file: string) {}

  private read(): Record<string, InventoryOverride> {
    try {
      return JSON.parse(readFileSync(this.file, "utf8")) as Record<string, InventoryOverride>;
    } catch {
      return {};
    }
  }

  async loadAll() {
    return this.read();
  }

  async saveStatuses(branchId: string, rows: { productId: string; active: boolean }[], updatedBy: string) {
    try {
      const all = this.read();
      const now = Date.now();
      for (const r of rows) {
        const k = `${branchId}:${r.productId}`;
        all[k] = { ...all[k], status: r.active ? "active" : "passive", updatedAt: now, updatedBy };
      }
      mkdirSync(dirname(this.file), { recursive: true });
      const tmp = `${this.file}.${process.pid}.tmp`;
      writeFileSync(tmp, JSON.stringify(all, null, 2));
      renameSync(tmp, this.file); // atomic: the file is either the old or the new version
    } catch (err) {
      throw new InventoryStoreError("WRITE_FAILED", `file ${this.file}: ${(err as NodeJS.ErrnoException).code ?? (err as Error).message}`);
    }
  }
}

class UnavailableInventoryStore implements InventoryStore {
  readonly kind = "unavailable" as const;
  async loadAll() {
    return {};
  }
  async saveStatuses(): Promise<void> {
    throw new InventoryStoreError(
      "NOT_CONFIGURED",
      "serverless deployment without SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — branch stock statuses cannot be persisted",
    );
  }
}

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

setInventoryStore(
  isSupabaseConfigured()
    ? new SupabaseInventoryStore()
    : isServerless
      ? new UnavailableInventoryStore()
      : new FileInventoryStore(process.env.INVENTORY_OVERRIDES_FILE || join(process.cwd(), ".data", "inventory-overrides.json")),
);

/**
 * Loads the saved statuses before a read.
 *   strict (ops panel): a failed read is thrown — the panel must not show stale data as truth.
 *   lenient (customer paths): a failed read is logged and the last known values are served.
 */
export async function refreshInventory({ strict = false, maxAgeMs = 0 }: { strict?: boolean; maxAgeMs?: number } = {}): Promise<void> {
  try {
    await syncInventoryOverrides({ maxAgeMs });
  } catch (err) {
    console.error("[inventory] read failed", { store: inventoryStoreKind(), error: (err as Error).message });
    if (strict) throw err;
  }
}
