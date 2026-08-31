"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { useCart } from "@/lib/use-cart";
import { formatTL, quantityTotal, subtotal } from "@/lib/cart-utils";
import {
  catalogCategories,
  catalogProductsForCategory,
  type CatalogProduct,
} from "@/lib/data";
import { normalize } from "@/lib/search";
import { QuickOrderCategories } from "./QuickOrderCategories";
import { QuickOrderProductRow } from "./QuickOrderProductRow";
import { QuickOrderCartSummary } from "./QuickOrderCartSummary";

type QuickFilter = "all" | "bestseller" | "sameday";

const QUICK_FILTERS: { value: QuickFilter; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "bestseller", label: "Çok Satanlar" },
  { value: "sameday", label: "Aynı Gün" },
];

function filterProducts(
  category: string,
  quick: QuickFilter,
  query: string,
): CatalogProduct[] {
  let list = catalogProductsForCategory(category);

  if (quick === "bestseller") list = list.filter((p) => p.isBestSeller);
  else if (quick === "sameday") list = list.filter((p) => p.sameDayDelivery);

  const q = normalize(query);
  if (q) {
    const tokens = q.split(" ").filter(Boolean);
    list = list.filter((p) => {
      const hay = normalize(
        `${p.name} ${p.categoryName} ${(p.tags ?? []).join(" ")} ${p.shortDescription ?? ""}`,
      );
      return tokens.every((t) => hay.includes(t));
    });
  }

  return list;
}

export function QuickOrderPage() {
  const [category, setCategory] = useState("tumu");
  const [quick, setQuick] = useState<QuickFilter>("all");
  const [query, setQuery] = useState("");

  const products = useMemo(
    () => filterProducts(category, quick, query),
    [category, quick, query],
  );

  const items = useCart();
  const count = quantityTotal(items);
  const sub = subtotal(items);

  return (
    <>
      <Container className="pt-24 pb-28 md:pt-28 lg:pb-16">
        <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-burgundy/55">
          Hızlı Sipariş
        </p>
        <h1 className="mt-2 font-serif text-[27px] font-semibold leading-[1.12] text-burgundy md:text-[36px]">
          Lezzetleri hızlıca seçin.
        </h1>
        <p className="mt-2 max-w-xl font-sans text-[14px] leading-relaxed text-warm-brown md:text-[15px]">
          Günlük Funda lezzetlerini pratik şekilde sepete ekleyin ve siparişinizi kolayca
          tamamlayın.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)_320px] lg:gap-10">
          {/* Left — categories */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <QuickOrderCategories
              categories={catalogCategories}
              active={category}
              onSelect={setCategory}
            />
          </aside>

          {/* Middle — search + products */}
          <div className="min-w-0">
            <label htmlFor="qo-search" className="sr-only">
              Ürün ara
            </label>
            <input
              id="qo-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ürün ara..."
              className="h-11 w-full rounded-md border border-sand bg-cream-light px-4 font-sans text-[14px] text-espresso transition-colors placeholder:text-taupe focus:border-burgundy focus:outline-none"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_FILTERS.map((f) => {
                const on = f.value === quick;
                return (
                  <button
                    key={f.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setQuick(f.value)}
                    className={`rounded-md border px-3 py-1.5 font-sans text-[12.5px] transition-colors ${
                      on
                        ? "border-burgundy bg-burgundy/[0.05] font-semibold text-burgundy"
                        : "border-sand text-warm-brown hover:border-taupe"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 font-sans text-[12px] text-taupe">{products.length} ürün</p>

            {products.length > 0 ? (
              <div className="mt-1">
                {products.map((p) => (
                  <QuickOrderProductRow key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-lg border border-sand-light bg-cream-light p-6 text-center">
                <p className="font-sans text-[14px] text-warm-brown">
                  Aramanıza uygun ürün bulunamadı.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setQuick("all");
                    setCategory("tumu");
                  }}
                  className="mt-3 font-sans text-[13px] font-semibold text-burgundy transition-colors hover:text-chocolate-light"
                >
                  Filtreleri temizle
                </button>
              </div>
            )}
          </div>

          {/* Right — sticky cart (desktop only) */}
          <aside className="hidden lg:block">
            <div className="lg:sticky lg:top-24">
              <QuickOrderCartSummary />
            </div>
          </aside>
        </div>
      </Container>

      {/* Mobile — sticky mini cart bar */}
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-sand-light bg-cream-light/95 px-4 py-3 backdrop-blur lg:hidden">
          <Link href="/sepet" className="flex items-center justify-between gap-3">
            <span className="font-sans text-[13px] font-medium text-espresso">
              {count} ürün · {formatTL(sub)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-burgundy px-4 py-2 font-sans text-[13px] font-semibold text-cream-light">
              Sepete Git <span aria-hidden>→</span>
            </span>
          </Link>
        </div>
      )}
    </>
  );
}
