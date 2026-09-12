/**
 * Read model for the ops panel "Şube Stokları" table. One row per product for
 * a branch, with the effective (override-merged) values plus the computed
 * remaining figure the Availability Engine uses.
 */

import { catalogProducts } from "../data";
import { reservedProductUnits } from "../reservations";
import {
  getInventoryRepository,
  dailyConfirmedUnits,
  getInventoryOverride,
  type StockMode,
} from "./index";

export type BranchStockRow = {
  productId: string;
  name: string;
  categoryName: string;
  stockMode: StockMode;
  active: boolean;
  /** meaningful for "quantity" */
  stockQuantity: number;
  /** meaningful for "daily_capacity" / "made_to_order" */
  dailyCapacity: number;
  prepTimeMinutes: number;
  sameDayEnabled: boolean;
  confirmedToday: number;
  reservedToday: number;
  /** what the engine has left right now for `date` */
  remaining: number;
  /** true when a manager has changed this row from the seed */
  edited: boolean;
};

export function getBranchStockRows(branchId: string, date: string): BranchStockRow[] {
  const repo = getInventoryRepository();
  const rows = repo.forBranch(branchId);

  return rows
    .map((bp) => {
      const product = catalogProducts.find((p) => p.id === bp.productId);
      const confirmedToday = dailyConfirmedUnits(bp, date);
      const reservedToday =
        bp.stockMode === "quantity"
          ? reservedProductUnits(branchId, bp.productId, undefined)
          : reservedProductUnits(branchId, bp.productId, date);

      const remaining =
        bp.stockMode === "quantity"
          ? bp.stockQuantity - reservedToday
          : bp.dailyCapacity - confirmedToday - reservedToday;

      return {
        productId: bp.productId,
        name: product?.name ?? bp.productId,
        categoryName: product?.categoryName ?? "",
        stockMode: bp.stockMode,
        active: bp.active,
        stockQuantity: bp.stockQuantity,
        dailyCapacity: bp.dailyCapacity,
        prepTimeMinutes: bp.prepTimeMinutes,
        sameDayEnabled: bp.sameDayEnabled,
        confirmedToday,
        reservedToday,
        remaining: Math.max(0, remaining),
        edited: getInventoryOverride(branchId, bp.productId) != null,
      };
    })
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName, "tr") || a.name.localeCompare(b.name, "tr"));
}
