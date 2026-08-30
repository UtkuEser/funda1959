"use client";

import { useSyncExternalStore } from "react";
import { getCart, subscribeCart, type CartItem } from "./cart";

const SERVER_SNAPSHOT: CartItem[] = [];

export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribeCart, getCart, () => SERVER_SNAPSHOT);
}

export function useCartCount(): number {
  const items = useCart();
  return items.reduce((n, i) => n + i.quantity, 0);
}
