"use client";

import { useMemo } from "react";
import type { CatalogProduct } from "@/lib/data";
import { useCatalogVerdicts } from "@/lib/delivery/use-catalog-verdicts";
import { ProductGridCard } from "./ProductGridCard";

/** A product-card grid that carries each product's delivery label for the saved address. */
export function ProductCardGrid({ products, className }: { products: CatalogProduct[]; className: string }) {
  const verdicts = useCatalogVerdicts(useMemo(() => products.map((p) => p.id), [products]));
  return (
    <div className={className}>
      {products.map((p) => (
        <ProductGridCard key={p.id} product={p} verdict={verdicts[p.id]} />
      ))}
    </div>
  );
}
