import { branches } from "./data";
import type { CartItem } from "./cart";

/** All amounts are whole Lira, so integer math is exact. */
/** "₺1.050" / "₺59,90" — kuruş shown whenever there is any, so no display rounds away a difference. */
export const formatTL = (n: number): string => {
  const v = Math.round(n * 100) / 100;
  const digits = Number.isInteger(v) ? 0 : 2;
  return `₺${v.toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: 2 })}`;
};

export const itemTotal = (item: CartItem): number => item.unitPrice * item.quantity;

export const subtotal = (items: CartItem[]): number =>
  items.reduce((sum, i) => sum + itemTotal(i), 0);

export const quantityTotal = (items: CartItem[]): number =>
  items.reduce((sum, i) => sum + i.quantity, 0);

const TR_MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export function formatCartDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d || m < 1 || m > 12) return iso;
  return `${d} ${TR_MONTHS[m - 1]} ${y}`;
}

export function branchName(id: string): string {
  return branches.find((b) => b.id === id)?.shortName ?? id;
}

/** Human-readable delivery lines for a cart item (empty if nothing chosen). */
export function deliverySummary(item: CartItem): string[] {
  const lines: string[] = [];
  if (item.deliveryType === "pickup") {
    lines.push("Mağazadan Teslim");
    if (item.branch) lines.push(branchName(item.branch));
  } else if (item.deliveryType === "address") {
    lines.push("Adrese Teslim");
  }
  const date = item.deliveryDate ? formatCartDate(item.deliveryDate) : null;
  if (date && item.deliveryTime) lines.push(`${date} · ${item.deliveryTime}`);
  else if (date) lines.push(date);
  else if (item.deliveryTime) lines.push(item.deliveryTime);
  return lines;
}

export function hasMixedDelivery(items: CartItem[]): boolean {
  const sigs = new Set(
    items
      .filter((i) => i.deliveryType || i.deliveryDate || i.deliveryTime || i.branch)
      .map(
        (i) =>
          `${i.deliveryType ?? ""}|${i.deliveryDate ?? ""}|${i.deliveryTime ?? ""}|${i.branch ?? ""}`,
      ),
  );
  return sigs.size > 1;
}

export function hasPickup(items: CartItem[]): boolean {
  return items.some((i) => i.deliveryType === "pickup");
}
