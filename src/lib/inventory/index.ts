/**
 * Inventory domain — per-branch sale state for a single product record.
 *
 * There is ONE product (`src/lib/data.ts`). Per branch it has:
 *   - `active` — general publish status: the branch carries it at all
 *     (from product data; not edited in the ops panel);
 *   - `status` — branch stock availability, set by the branch team:
 *       "active"  deliverable from today,
 *       "passive" still listed and orderable, earliest delivery tomorrow.
 *     A passive product stays passive until someone changes it.
 * That status is the only product rule for delivery dates (D44): no
 * preparation time, production day or per-product wait. The older
 * quantity/capacity figures are kept as data (and used once to derive the
 * initial status) but no longer drive availability.
 */

import { catalogProducts, allCatalogProducts, publishedProduct, type CatalogProduct } from "../data";
import { listBranches } from "../branch";
import { getInventoryOverride, type BranchStockStatus, type InventoryOverride } from "./overrides";

export {
  getInventoryOverride,
  saveInventoryStatuses,
  allInventoryOverrides,
  InventoryStoreError,
  type InventoryOverride,
  type BranchStockStatus,
  type StockStatusWrite,
} from "./overrides";

export type StockMode = "quantity" | "daily_capacity" | "made_to_order";

export type BranchProduct = {
  branchId: string;
  productId: string;
  /** general publish status at this branch (the branch carries the product) */
  active: boolean;
  /** branch stock availability — see the module note */
  status: BranchStockStatus;
  stockMode: StockMode;
  /** meaningful for "quantity" */
  stockQuantity: number;
  /** meaningful for "daily_capacity" (units/day) */
  dailyCapacity: number;
  /** overrides the product base price at this branch, when set */
  priceOverride: number | null;
  /**
   * capacity units one unit of this product consumes. v1 = 1 for every
   * variant; the field exists so a "20 kişilik" cake can later cost 2 units.
   */
  capacityUnits: number;
};

/* -------------------------------------------------------------------------- */
/* Derivation rules + demo overrides — SAMPLE DATA (see ./source.ts)            */
/* -------------------------------------------------------------------------- */

const SERVING_CATEGORIES = new Set(["yas-pastalar", "ozel-gun"]);

const BRANCH_DAILY_CAPACITY: Record<string, number> = {
  gop: 26,
  panora: 18,
  incek: 12,
};

function hash(seed: string, max: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % max;
}

function baseStockMode(p: CatalogProduct): StockMode {
  if (p.customizable) return "made_to_order";
  if (SERVING_CATEGORIES.has(p.categorySlug)) return "daily_capacity";
  return "quantity";
}

/** Scripted per-(branch, product) overrides that make the demo deterministic. */
const OVERRIDES: Record<string, Partial<BranchProduct>> = {
  "incek:p1": { stockMode: "daily_capacity", dailyCapacity: 12 },
  "panora:p1": { stockMode: "made_to_order" },
  // a ready product that ran out at GOP -> starts passive (see statusFromQuantity)
  "gop:p8": { stockMode: "quantity", stockQuantity: 0 },
  "incek:p10": { stockMode: "quantity", stockQuantity: 40 },
};

function deriveBranchProduct(branchId: string, p: CatalogProduct): BranchProduct {
  const mode = baseStockMode(p);

  const derived: Omit<BranchProduct, "status"> = {
    branchId,
    productId: p.id,
    active: (p.availableBranches?.includes(branchId) ?? true) && p.priceValue > 0,
    stockMode: mode,
    stockQuantity: mode === "quantity" ? 4 + hash(`${branchId}:${p.id}:q`, 22) : 0,
    dailyCapacity:
      mode === "daily_capacity"
        ? (BRANCH_DAILY_CAPACITY[branchId] ?? 16) - hash(`${branchId}:${p.id}:c`, 5)
        : mode === "made_to_order"
          ? 6
          : 0,
    priceOverride: null,
    capacityUnits: 1,
  };

  const override = OVERRIDES[`${branchId}:${p.id}`];
  const merged = override ? { ...derived, ...override } : derived;
  return { ...merged, status: statusFromQuantity(merged) };
}

/** One-time migration from the quantity model: an empty shelf starts "passive". */
function statusFromQuantity(bp: Pick<BranchProduct, "stockMode" | "stockQuantity">): BranchStockStatus {
  return bp.stockMode === "quantity" && bp.stockQuantity <= 0 ? "passive" : "active";
}

/**
 * Effective status: an explicit panel choice wins; otherwise an edit saved
 * under the old model is translated (off-sale or empty shelf -> passive).
 */
function effectiveStatus(seed: BranchProduct, o: InventoryOverride): BranchStockStatus {
  if (o.status) return o.status;
  if (o.active === false) return "passive";
  if (o.stockQuantity !== undefined) return statusFromQuantity({ stockMode: seed.stockMode, stockQuantity: o.stockQuantity });
  return seed.status;
}

/* -------------------------------------------------------------------------- */
/* Repository                                                                  */
/* -------------------------------------------------------------------------- */

/** Merge the ops-panel override onto a seed row. Legacy figures are carried, not used. */
function withOverride(bp: BranchProduct): BranchProduct {
  const o = getInventoryOverride(bp.branchId, bp.productId);
  if (!o) return bp;
  return {
    ...bp,
    status: effectiveStatus(bp, o),
    stockQuantity: o.stockQuantity ?? bp.stockQuantity,
    dailyCapacity: o.dailyCapacity ?? bp.dailyCapacity,
  };
}

export interface InventoryRepository {
  /** raw seed value, no override applied */
  getSeed(branchId: string, productId: string): BranchProduct | null;
  get(branchId: string, productId: string): BranchProduct | null;
  forBranch(branchId: string): BranchProduct[];
  forProduct(productId: string): BranchProduct[];
}

/**
 * A published product added in the panel (D45): every branch carries it; its
 * status is the branch's own row (the panel's choice is written there at the
 * first publish), else the choice saved on the product. Quantities: none.
 */
function addedBranchProduct(branchId: string, productId: string): BranchProduct | null {
  const p = publishedProduct(productId);
  const product = p ? allCatalogProducts().find((c) => c.id === productId) : undefined;
  if (!p || !product) return null;
  return {
    branchId,
    productId,
    active: true,
    status: p.branchStock[branchId] === false ? "passive" : "active",
    stockMode: baseStockMode(product),
    stockQuantity: 0,
    dailyCapacity: 0,
    priceOverride: null,
    capacityUnits: 1,
  };
}

class InMemoryInventoryRepository implements InventoryRepository {
  private readonly rows: Map<string, BranchProduct>;

  /** seed rows of the code products, then rows of published panel products */
  private seedOf(branchId: string, productId: string): BranchProduct | null {
    return this.rows.get(`${branchId}:${productId}`) ?? addedBranchProduct(branchId, productId);
  }

  private addedRows(filter: (branchId: string, productId: string) => boolean): BranchProduct[] {
    const out: BranchProduct[] = [];
    for (const product of allCatalogProducts()) {
      if (!publishedProduct(product.id)) continue;
      for (const branch of listBranches()) {
        if (!filter(branch.id, product.id)) continue;
        const row = addedBranchProduct(branch.id, product.id);
        if (row) out.push(row);
      }
    }
    return out;
  }

  constructor() {
    this.rows = new Map();
    for (const branch of listBranches()) {
      for (const product of catalogProducts) {
        this.rows.set(`${branch.id}:${product.id}`, deriveBranchProduct(branch.id, product));
      }
    }
  }

  getSeed(branchId: string, productId: string): BranchProduct | null {
    return this.seedOf(branchId, productId);
  }
  get(branchId: string, productId: string): BranchProduct | null {
    const base = this.seedOf(branchId, productId);
    return base ? withOverride(base) : null;
  }
  forBranch(branchId: string): BranchProduct[] {
    return [...[...this.rows.values()].filter((r) => r.branchId === branchId), ...this.addedRows((b) => b === branchId)].map(withOverride);
  }
  forProduct(productId: string): BranchProduct[] {
    return [...[...this.rows.values()].filter((r) => r.productId === productId), ...this.addedRows((_, p) => p === productId)].map(withOverride);
  }
}

let repo: InventoryRepository = new InMemoryInventoryRepository();
export function setInventoryRepository(next: InventoryRepository): void {
  repo = next;
}
export function getInventoryRepository(): InventoryRepository {
  return repo;
}

export function getBranchProduct(branchId: string, productId: string): BranchProduct | null {
  return repo.get(branchId, productId);
}

/** current price for a branch product (override or product base) */
export function branchUnitPrice(bp: BranchProduct, basePrice: number): number {
  return bp.priceOverride ?? basePrice;
}
