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
 *   - preparation time and same-day eligibility.
 * The older quantity/capacity figures are kept as data (and used once to
 * derive the initial status) but no longer drive availability.
 */

import { catalogProducts, getProductDetail, type CatalogProduct } from "../data";
import { listBranches } from "../branch";
import { getInventoryOverride, type BranchStockStatus, type InventoryOverride } from "./overrides";

export {
  getInventoryOverride,
  setInventoryOverride,
  setInventoryOverrides,
  clearInventoryOverride,
  allInventoryOverrides,
  type InventoryOverride,
  type BranchStockStatus,
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
  /** total minutes from order to ready */
  prepTimeMinutes: number;
  sameDayEnabled: boolean;
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
  // demo centrepiece: "Çikolatalı Çilekli Pasta" is same-day at İncek
  "incek:p1": { stockMode: "daily_capacity", dailyCapacity: 12, sameDayEnabled: true, prepTimeMinutes: 120 },
  // ...but a normal made-to-order cake at Panora
  "panora:p1": { stockMode: "made_to_order", sameDayEnabled: false, prepTimeMinutes: 24 * 60 },
  // a ready product that ran out at GOP
  "gop:p8": { stockMode: "quantity", stockQuantity: 0 },
  // İncek keeps baklava well stocked
  "incek:p10": { stockMode: "quantity", stockQuantity: 40, sameDayEnabled: true },
};

function deriveBranchProduct(branchId: string, p: CatalogProduct): BranchProduct {
  const detail = getProductDetail(p.slug);
  const prepHours = detail?.preparationTimeHours ?? 24;
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
    prepTimeMinutes: mode === "made_to_order" ? Math.max(prepHours, 24) * 60 : prepHours * 60,
    sameDayEnabled: p.sameDayDelivery ?? mode === "quantity",
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

class InMemoryInventoryRepository implements InventoryRepository {
  private readonly rows: Map<string, BranchProduct>;

  constructor() {
    this.rows = new Map();
    for (const branch of listBranches()) {
      for (const product of catalogProducts) {
        this.rows.set(`${branch.id}:${product.id}`, deriveBranchProduct(branch.id, product));
      }
    }
  }

  getSeed(branchId: string, productId: string): BranchProduct | null {
    return this.rows.get(`${branchId}:${productId}`) ?? null;
  }
  get(branchId: string, productId: string): BranchProduct | null {
    const base = this.rows.get(`${branchId}:${productId}`);
    return base ? withOverride(base) : null;
  }
  forBranch(branchId: string): BranchProduct[] {
    return [...this.rows.values()].filter((r) => r.branchId === branchId).map(withOverride);
  }
  forProduct(productId: string): BranchProduct[] {
    return [...this.rows.values()].filter((r) => r.productId === productId).map(withOverride);
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
