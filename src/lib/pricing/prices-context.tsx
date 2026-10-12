"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { CatalogProduct } from "../data";
import { applyPrice, type PriceMap } from "./prices";

/**
 * The current prices a page read on the server (`getDisplayPriceMap`), for
 * the client components that build product lists from the code catalog
 * (cards, quick order rows, catalog / search sorting). Without a provider a
 * product keeps the price it was given.
 */
const PricesContext = createContext<PriceMap | null>(null);

export function PricesProvider({ prices, children }: { prices: PriceMap; children: ReactNode }) {
  return <PricesContext.Provider value={prices}>{children}</PricesContext.Provider>;
}

/** The page's price map (null without a provider) — for sizes priced with `pricedSizes`. */
export function usePriceMap(): PriceMap | null {
  return useContext(PricesContext);
}

export function usePricedProduct<T extends CatalogProduct>(product: T): T {
  const map = useContext(PricesContext);
  return useMemo(() => applyPrice(product, map), [product, map]);
}

export function usePricedProducts<T extends CatalogProduct>(products: T[]): T[] {
  const map = useContext(PricesContext);
  return useMemo(() => (map ? products.map((p) => applyPrice(p, map)) : products), [products, map]);
}
