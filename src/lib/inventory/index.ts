/**
 * Inventory domain — per-branch sale state for a single product record.
 *
 * There is ONE product (`src/lib/data.ts`). Its availability, stock and
 * capacity differ per branch and live here as `BranchProduct` rows. Three
 * stock models are supported:
 *
 *   "quantity"       ready physical stock (chocolate boxes, dry pastries)
 *   "daily_capacity" units producible per day (yaş pasta)
 *   "made_to_order"  built on order; no quantity, gated by preparation time
 */

import { catalogProducts, getProductDetail, type CatalogProduct } from "../data";
import { listBranches } from "../branch";
import { getInventoryOverride } from "./overrides";

export {
  getInventoryOverride,
  setInventoryOverride,
  clearInventoryOverride,
  allInventoryOverrides,
  type InventoryOverride,
} from "./overrides";

export type StockMode = "quantity" | "daily_capacity" | "made_to_order";

export type BranchProduct = {
  branchId: string;
  productId: string;
  active: boolean;
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
/* Derivation rules + demo overrides                                           */
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

  const derived: BranchProduct = {
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
  return override ? { ...derived, ...override } : derived;
}

/* -------------------------------------------------------------------------- */
/* Repository                                                                  */
/* -------------------------------------------------------------------------- */

/** Merge the ops-panel override onto a seed row (v1: active + stock + capacity). */
function withOverride(bp: BranchProduct): BranchProduct {
  const o = getInventoryOverride(bp.branchId, bp.productId);
  if (!o) return bp;
  return {
    ...bp,
    active: o.active ?? bp.active,
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

/* -------------------------------------------------------------------------- */
/* Demo per-day capacity consumption ("confirmed")                             */
/* -------------------------------------------------------------------------- */

/** deterministic confirmed units for a daily_capacity product on a date */
export function dailyConfirmedUnits(bp: BranchProduct, isoDate: string): number {
  if (bp.stockMode !== "daily_capacity") return 0;
  return hash(`${bp.branchId}|${bp.productId}|${isoDate}`, Math.max(1, Math.ceil(bp.dailyCapacity * 0.7)));
}

/** current price for a branch product (override or product base) */
export function branchUnitPrice(bp: BranchProduct, basePrice: number): number {
  return bp.priceOverride ?? basePrice;
}
