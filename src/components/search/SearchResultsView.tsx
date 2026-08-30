"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/shared/Container";
import { ProductGridCard } from "@/components/catalog/ProductGridCard";
import type { SearchResults } from "@/lib/search";

type SortKey = "relevance" | "bestsellers" | "price-asc" | "price-desc";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Önerilen" },
  { value: "bestsellers", label: "Çok Satanlar" },
  { value: "price-asc", label: "Fiyat: Artan" },
  { value: "price-desc", label: "Fiyat: Azalan" },
];

export function SearchResultsView({
  results,
  query,
}: {
  results: SearchResults;
  query: string;
}) {
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortKey>("relevance");

  const trimmed = query.trim();
  const baseProducts = results.products;

  const categoryChips = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of baseProducts) map.set(p.categorySlug, p.categoryName);
    return [...map.entries()].map(([slug, name]) => ({ slug, name }));
  }, [baseProducts]);

  const list = useMemo(() => {
    let out =
      category === "all"
        ? baseProducts
        : baseProducts.filter((p) => p.categorySlug === category);
    out = [...out];
    if (sort === "price-asc") out.sort((a, b) => a.priceValue - b.priceValue);
    else if (sort === "price-desc") out.sort((a, b) => b.priceValue - a.priceValue);
    else if (sort === "bestsellers")
      out.sort((a, b) => Number(!!b.isBestSeller) - Number(!!a.isBestSeller));
    return out;
  }, [baseProducts, category, sort]);

  if (!trimmed) {
    return (
      <Container className="pt-24 pb-24 md:pt-28">
        <h1 className="font-serif text-[26px] md:text-[32px] font-semibold text-burgundy">
          Arama
        </h1>
        <p className="mt-2 font-sans text-[14px] text-warm-brown">
          Aramak istediğiniz ürünü yazın.
        </p>
      </Container>
    );
  }

  if (results.total === 0) {
    return (
      <Container size="narrow" className="pt-24 pb-24 md:pt-28 text-center">
        <h1 className="font-serif text-[26px] md:text-[32px] font-semibold text-burgundy">
          Aradığınız lezzeti bulamadık.
        </h1>
        <p className="mx-auto mt-3 max-w-md font-sans text-[15px] leading-relaxed text-warm-brown">
          &ldquo;{trimmed}&rdquo; için eşleşen ürün bulunamadı.
        </p>
        <p className="mx-auto mt-1 max-w-md font-sans text-[13px] text-taupe">
          Aramanızı kontrol edebilir veya kategorilerimizi keşfedebilirsiniz.
        </p>
        <Link
          href="/lezzetlerimiz"
          className="mt-6 inline-flex rounded-md bg-burgundy px-6 py-3 font-sans text-[14px] font-semibold text-cream-light hover:bg-chocolate-light"
        >
          Tüm Lezzetleri Keşfet
        </Link>
        {results.categories.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {results.categories.map((c) => (
              <Link
                key={c.slug}
                href={c.href}
                className="rounded-md border border-sand-light px-3 py-1.5 font-sans text-[13px] font-medium text-warm-brown hover:border-burgundy/40 hover:text-burgundy"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </Container>
    );
  }

  return (
    <Container className="pt-24 pb-16 md:pt-28 md:pb-20">
      <h1 className="font-serif text-[26px] md:text-[32px] font-semibold leading-[1.14] text-burgundy">
        &ldquo;{trimmed}&rdquo; için sonuçlar
      </h1>
      <p className="mt-2 font-sans text-[14px] text-warm-brown">
        <span className="font-semibold text-espresso">{list.length}</span> ürün bulundu
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-sand-light pb-4">
        {categoryChips.length > 1 ? (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={`rounded-md px-3 py-1.5 font-sans text-[13px] transition-colors ${
                category === "all"
                  ? "bg-burgundy/[0.07] font-semibold text-burgundy"
                  : "font-medium text-warm-brown hover:text-burgundy"
              }`}
            >
              Tümü
            </button>
            {categoryChips.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setCategory(c.slug)}
                className={`rounded-md px-3 py-1.5 font-sans text-[13px] transition-colors ${
                  category === c.slug
                    ? "bg-burgundy/[0.07] font-semibold text-burgundy"
                    : "font-medium text-warm-brown hover:text-burgundy"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}

        <label className="flex items-center gap-2">
          <span className="hidden font-sans text-[13px] text-taupe sm:inline">Sırala</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-md border border-sand bg-cream-light px-3 py-2 font-sans text-[13px] font-medium text-espresso focus:border-burgundy focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {list.length === 0 ? (
        <p className="mt-8 font-sans text-[14px] text-warm-brown">
          Bu kategoride sonuç yok.
        </p>
      ) : (
        <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-5 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
          {list.map((p) => (
            <ProductGridCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {results.categories.length > 0 && (
        <div className="mt-12 border-t border-sand-light pt-6">
          <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-burgundy/50">
            İlgili Kategoriler
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {results.categories.map((c) => (
              <Link
                key={c.slug}
                href={c.href}
                className="rounded-md border border-sand-light px-3 py-1.5 font-sans text-[13px] font-medium text-warm-brown transition-colors hover:border-burgundy/40 hover:text-burgundy"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}
