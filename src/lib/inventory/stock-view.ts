/**
 * Read model for the ops panel "Şube Stokları" screen: one row per product
 * the branch carries, with its branch-level status (active / passive).
 * Quantities are no longer shown or used for availability.
 */

import { catalogProducts, categories } from "../data";
import { getInventoryRepository, getInventoryOverride, type BranchStockStatus } from "./index";

export type BranchStockRow = {
  productId: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  isGift: boolean;
  /** public path of a product photo, or null (the panel shows an initial) */
  image: string | null;
  status: BranchStockStatus;
  /** last panel change, if any */
  updatedAt: number | null;
  updatedBy: string | null;
};

export type BranchStockView = {
  rows: BranchStockRow[];
  /** products this branch doesn't carry at all (general publish status) — not editable here */
  notCarried: number;
};

export function getBranchStockView(branchId: string): BranchStockView {
  const all = getInventoryRepository().forBranch(branchId);
  const carried = all.filter((bp) => bp.active);
  const rows = carried
    .map((bp) => {
      const product = catalogProducts.find((p) => p.id === bp.productId);
      const override = getInventoryOverride(branchId, bp.productId);
      return {
        productId: bp.productId,
        name: product?.name ?? bp.productId,
        categorySlug: product?.categorySlug ?? "",
        categoryName: categories.find((c) => c.slug === product?.categorySlug)?.name ?? product?.categoryName ?? "",
        isGift: Boolean(product?.isGift),
        image: product?.image ?? null,
        status: bp.status,
        updatedAt: override?.status ? override.updatedAt : null,
        updatedBy: override?.status ? (override.updatedBy ?? null) : null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  return { rows, notCarried: all.length - carried.length };
}
