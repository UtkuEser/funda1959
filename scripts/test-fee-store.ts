/**
 * In-memory delivery-fee store for the verify-* scripts. Registered before
 * anything else picks a store, so a script never reads or writes the real
 * fee table or the local `.data/delivery-fees.json`. The fees set here are
 * TEST FIXTURES, not approved prices (SUPABASE_PLAN.md D15).
 */
import {
  DeliveryFeeStoreError,
  setDeliveryFeeStore,
  syncDeliveryFees,
  type DeliveryFeeState,
  type ZoneFeeRecord,
} from "@/lib/delivery/fees";

export function installMemoryFeeStore() {
  const rows = new Map<string, ZoneFeeRecord>();
  let failing = false;
  setDeliveryFeeStore({
    kind: "memory",
    async loadAll() {
      if (failing) throw new DeliveryFeeStoreError("READ_FAILED", "simulated outage");
      return [...rows.values()];
    },
    async save(zoneId, state, fee, updatedBy) {
      if (failing) throw new DeliveryFeeStoreError("WRITE_FAILED", "simulated outage");
      const record: ZoneFeeRecord = { zoneId, state, fee, updatedBy, updatedAt: new Date().toISOString() };
      rows.set(zoneId, record);
      return record;
    },
  });
  return {
    /** sets a fee and re-reads, like an admin save followed by the next request */
    async set(zoneId: string, state: DeliveryFeeState, fee: number | null) {
      rows.set(zoneId, { zoneId, state, fee, updatedBy: "test", updatedAt: new Date().toISOString() });
      await syncDeliveryFees();
    },
    /** makes every read / write fail until reset; the next sync marks fees unavailable */
    async fail(on: boolean) {
      failing = on;
      await syncDeliveryFees().catch(() => undefined);
    },
  };
}
