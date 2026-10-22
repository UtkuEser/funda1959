/**
 * Where the branch stock shown on the storefront comes from.
 *
 *   "sample" — design phase. Branch stock statuses are the deterministic
 *              seed in ./index.ts (plus the demo zones/branches).
 *              The UI labels them as sample data and makes no firm promise.
 *   "live"   — the real branch stock service is connected.
 *
 * INTEGRATION POINT — to go live:
 *   1. implement `InventoryRepository` (./index.ts) against the branch stock
 *      service and register it on the server with `setInventoryRepository()`;
 *      zones are Merkez's district + neighbourhood map (D49, `delivery/areas-server.ts`); branches
 *      (`setBranchRepository`) if their source changes;
 *   2. set INVENTORY_SOURCE to "live".
 * `/api/availability`, cart revalidation, quick order, product pages and the
 * catalog already read stock only through those repositories, keyed by the
 * branch chosen in the delivery context — none of them change.
 */
export type InventorySource = "sample" | "live";

export const INVENTORY_SOURCE: InventorySource = "sample";

export const isSampleInventory = INVENTORY_SOURCE === "sample";
