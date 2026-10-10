/**
 * Server-only bootstrap for delivery fees (SUPABASE_PLAN.md, D15): picks
 * where they live, once per process, and offers `refreshDeliveryFees()`.
 *
 *   Supabase configured     -> table `delivery_zone_fees` (migration 0008)
 *   serverless, no Supabase -> "unavailable": reads fail (delivery answers
 *                              "Teslimat bilgisi şu an alınamıyor"), saves 503
 *   otherwise (local dev)   -> JSON file under `.data/` (gitignored;
 *                              `DELIVERY_FEES_FILE` points it elsewhere)
 *
 * Nothing is seeded: the sample fees in the old zone list are not approved
 * prices, so every zone starts "unset" until Merkez sets it.
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { isSupabaseConfigured, supabaseRest } from "../supabase-server";
import {
  DeliveryFeeStoreError,
  deliveryFeeStoreKind,
  setDeliveryFeeStore,
  syncDeliveryFees,
  type DeliveryFeeState,
  type DeliveryFeeStore,
  type ZoneFeeRecord,
} from "./fees";

if (typeof window !== "undefined") {
  throw new Error("delivery/fees-server.ts must never be imported on the client");
}

type Row = { zone_id: string; state: DeliveryFeeState; fee: number | string | null; updated_by: string | null; updated_at: string | null };

const toRecord = (r: Row): ZoneFeeRecord => ({
  zoneId: r.zone_id,
  state: r.state,
  fee: r.fee === null ? null : Number(r.fee),
  updatedBy: r.updated_by,
  updatedAt: r.updated_at,
});

class SupabaseDeliveryFeeStore implements DeliveryFeeStore {
  readonly kind = "supabase" as const;

  async loadAll(): Promise<ZoneFeeRecord[]> {
    try {
      const rows = await supabaseRest<Row[]>("/delivery_zone_fees?select=zone_id,state,fee,updated_by,updated_at");
      return rows.map(toRecord);
    } catch (err) {
      throw new DeliveryFeeStoreError("READ_FAILED", `delivery_zone_fees read: ${(err as Error).message}`);
    }
  }

  async save(zoneId: string, state: DeliveryFeeState, fee: number | null, updatedBy: string): Promise<ZoneFeeRecord> {
    try {
      const rows = await supabaseRest<Row[]>("/delivery_zone_fees?on_conflict=zone_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify({ zone_id: zoneId, state, fee, updated_by: updatedBy }),
      });
      if (!rows[0]) throw new Error("no row returned");
      return toRecord(rows[0]);
    } catch (err) {
      throw new DeliveryFeeStoreError("WRITE_FAILED", `delivery_zone_fees upsert: ${(err as Error).message}`);
    }
  }
}

class FileDeliveryFeeStore implements DeliveryFeeStore {
  readonly kind = "file" as const;
  constructor(private readonly file: string) {}

  private read(): Record<string, ZoneFeeRecord> {
    try {
      return JSON.parse(readFileSync(this.file, "utf8")) as Record<string, ZoneFeeRecord>;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return {};
      throw new DeliveryFeeStoreError("READ_FAILED", `file ${this.file}: ${(err as Error).message}`);
    }
  }

  async loadAll() {
    return Object.values(this.read());
  }

  async save(zoneId: string, state: DeliveryFeeState, fee: number | null, updatedBy: string) {
    try {
      const all = this.read();
      const record: ZoneFeeRecord = { zoneId, state, fee, updatedBy, updatedAt: new Date().toISOString() };
      all[zoneId] = record;
      mkdirSync(dirname(this.file), { recursive: true });
      const tmp = `${this.file}.${process.pid}.tmp`;
      writeFileSync(tmp, JSON.stringify(all, null, 2));
      renameSync(tmp, this.file); // atomic
      return record;
    } catch (err) {
      throw new DeliveryFeeStoreError("WRITE_FAILED", `file ${this.file}: ${(err as NodeJS.ErrnoException).code ?? (err as Error).message}`);
    }
  }
}

class UnavailableDeliveryFeeStore implements DeliveryFeeStore {
  readonly kind = "unavailable" as const;
  async loadAll(): Promise<ZoneFeeRecord[]> {
    throw new DeliveryFeeStoreError("NOT_CONFIGURED", "serverless deployment without SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — delivery fees cannot be read");
  }
  async save(): Promise<ZoneFeeRecord> {
    throw new DeliveryFeeStoreError("NOT_CONFIGURED", "serverless deployment without Supabase — delivery fees cannot be saved");
  }
}

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

setDeliveryFeeStore(
  isSupabaseConfigured()
    ? new SupabaseDeliveryFeeStore()
    : isServerless
      ? new UnavailableDeliveryFeeStore()
      : new FileDeliveryFeeStore(process.env.DELIVERY_FEES_FILE || join(process.cwd(), ".data", "delivery-fees.json")),
);

/**
 * Loads the fees before availability / quote / order work.
 *   strict: a failed read is rethrown (admin screen).
 *   lenient (default): logged; the cache is already "unavailable", so delivery
 *   answers DELIVERY_INFO_UNAVAILABLE while pickup keeps working.
 */
export async function refreshDeliveryFees({ strict = false, maxAgeMs = 0 }: { strict?: boolean; maxAgeMs?: number } = {}): Promise<void> {
  try {
    await syncDeliveryFees({ maxAgeMs });
  } catch (err) {
    const code = err instanceof DeliveryFeeStoreError ? err.code : "UNKNOWN";
    console.error(`[delivery-fees] read failed code=${code} store=${deliveryFeeStoreKind()}`, { store: deliveryFeeStoreKind(), error: (err as Error).message });
    if (strict) throw err;
  }
}
