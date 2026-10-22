"use client";

import type { ReactNode } from "react";
import { setPublishedProducts, type PublishedProduct } from "../data";

/**
 * Hands the published products added in the panel (D45) to the browser's
 * catalog before anything below renders, so listings, search and product
 * pages see the same catalog the server used. Published products only — the
 * server never sends drafts. Registering the same list again is a no-op.
 */
export function CatalogProvider({
  products,
  hidden = [],
  children,
}: {
  products: PublishedProduct[];
  /** code products off the site (D48) */
  hidden?: string[];
  children: ReactNode;
}) {
  // deliberately during render: children read the catalog in their own render
  setPublishedProducts(products, hidden);
  return <>{children}</>;
}
