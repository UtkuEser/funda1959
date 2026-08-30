/**
 * Minimal, extensible cart state. localStorage-backed, no global provider.
 * A `funda-cart-change` event (same tab) plus the native `storage` event
 * (other tabs) let `useCart()` stay in sync. Client-only — every read/write
 * is guarded against SSR.
 */

export type CartCustomization = {
  message?: string;
  note?: string;
  extras: string[];
};

export type CartDeliveryType = "address" | "pickup";

export type CartItem = {
  id: string; // stable line id
  productId: string;
  slug: string;
  productName: string;
  categoryName: string;
  image: string; // gradient fragment placeholder
  selectedVariant: string | null;
  variantLabel: string | null;
  unitPrice: number;
  quantity: number;
  quantityEnabled: boolean;
  customization: CartCustomization;
  deliveryType: CartDeliveryType | null;
  deliveryDate: string | null;
  deliveryTime: string | null;
  branch: string | null;
  addedAt: number;
};

const KEY = "funda-cart";
export const CART_EVENT = "funda-cart-change";

const EMPTY: CartItem[] = [];
let cache: CartItem[] = EMPTY;
let cacheRaw: string | null | undefined;

function read(): CartItem[] {
  if (typeof window === "undefined") return EMPTY;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
      cache = Array.isArray(parsed) ? parsed : [];
    } catch {
      cache = [];
    }
  }
  return cache;
}

function write(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(items);
    window.localStorage.setItem(KEY, raw);
    cacheRaw = raw;
    cache = items;
    window.dispatchEvent(new CustomEvent(CART_EVENT));
  } catch {
    /* storage unavailable — ignore */
  }
}

export function getCart(): CartItem[] {
  return read();
}

export function subscribeCart(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CART_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CART_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function makeId(input: {
  productId: string;
  selectedVariant: string | null;
  addedAt: number;
}): string {
  return `${input.productId}-${input.selectedVariant ?? "base"}-${input.addedAt}`;
}

export function addToCart(input: Omit<CartItem, "id">): void {
  const item: CartItem = { ...input, id: makeId(input) };
  write([...read(), item]);
}

export function updateQuantity(id: string, quantity: number): void {
  const q = Math.max(1, Math.min(20, Math.round(quantity)));
  write(read().map((i) => (i.id === id ? { ...i, quantity: q } : i)));
}

export function removeItem(id: string): void {
  write(read().filter((i) => i.id !== id));
}

export function clearCart(): void {
  write([]);
}

export function cartCount(): number {
  return read().reduce((n, i) => n + i.quantity, 0);
}
