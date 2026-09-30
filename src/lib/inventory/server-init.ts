/**
 * Server-only bootstrap: makes the ops panel's inventory overrides durable.
 * Import for its side effect from server entry points that read or write
 * branch availability (availability / reservations / admin routes, admin page).
 *
 * Local + single-server deployments: a JSON file under `.data/` (gitignored;
 * `INVENTORY_OVERRIDES_FILE` points it elsewhere, e.g. for a test server).
 * Written atomically (temp file + rename). If the file system is read-only
 * (e.g. serverless), writes fail loudly in the log and the change stays in
 * memory only — a database-backed adapter is required there.
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { setOverridePersistence, type InventoryOverride } from "./overrides";

if (typeof window !== "undefined") {
  throw new Error("inventory/server-init.ts must never be imported on the client");
}

const FILE = process.env.INVENTORY_OVERRIDES_FILE || join(process.cwd(), ".data", "inventory-overrides.json");

setOverridePersistence({
  load() {
    try {
      return JSON.parse(readFileSync(FILE, "utf8")) as Record<string, InventoryOverride>;
    } catch {
      return {};
    }
  },
  save(all) {
    mkdirSync(dirname(FILE), { recursive: true });
    const tmp = `${FILE}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(all, null, 2));
    renameSync(tmp, FILE);
  },
});
