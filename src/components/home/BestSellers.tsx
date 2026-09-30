"use client";

import { useMemo } from "react";
import { catalogProducts, type CatalogProduct } from "@/lib/data";
import { getBranchProduct } from "@/lib/inventory";
import { useDelivery } from "@/lib/delivery/context";
import { useCatalogVerdicts } from "@/lib/delivery/use-catalog-verdicts";
import { ProductGridCard } from "@/components/catalog/ProductGridCard";
import { Container } from "@/components/shared/Container";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { SampleDataNote } from "@/components/delivery/SampleDataNote";

const LIMIT = 4;

/**
 * `isBestSeller` is a sample flag in the product seed — there is no sales
 * ranking yet. Order: flagged products in data order, one per category first
 * so the row isn't four cakes, then the rest. With a chosen branch, only
 * products that branch carries.
 */
function pickBestSellers(branchId: string | null): CatalogProduct[] {
  const flagged = catalogProducts.filter(
    (p) => p.isBestSeller && (!branchId || getBranchProduct(branchId, p.id)?.active),
  );
  const seen = new Set<string>();
  const firstPerCategory = flagged.filter((p) => !seen.has(p.categorySlug) && seen.add(p.categorySlug));
  const rest = flagged.filter((p) => !firstPerCategory.includes(p));
  return [...firstPerCategory, ...rest].slice(0, LIMIT);
}

export function BestSellers() {
  const { isHydrated, branch } = useDelivery();
  const branchId = isHydrated ? (branch?.id ?? null) : null;
  const products = useMemo(() => pickBestSellers(branchId), [branchId]);
  const verdicts = useCatalogVerdicts(useMemo(() => products.map((p) => p.id), [products]));
  if (products.length === 0) return null;

  return (
    <section aria-label="Çok Satanlar" className="bg-cream py-14 md:py-20">
      <Container>
        <SectionHeader
          centered={false}
          eyebrow={branch && isHydrated ? `${branch.shortName} şubesi` : "Funda'nın favorileri"}
          title="Çok Satanlar"
          subtitle={
            branch && isHydrated
              ? "Seçtiğiniz şubede bulunan, en çok tercih edilen lezzetler."
              : "Şubelerimizde en çok tercih edilen lezzetler."
          }
          action={{ label: "Tüm ürünler", href: "/lezzetlerimiz" }}
        />

        <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-5 md:grid-cols-4 lg:gap-x-6">
          {products.map((product) => (
            <ProductGridCard key={product.id} product={product} showBadges={false} verdict={verdicts[product.id]} />
          ))}
        </div>

        <SampleDataNote about="satış sıralaması, fiyat ve teslimat bilgileri" className="mt-8" />
      </Container>
    </section>
  );
}
