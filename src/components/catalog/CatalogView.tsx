"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/shared/Container";
import { ProductGridCard } from "./ProductGridCard";
import {
  catalogCategories,
  catalogPastaOccasions,
  catalogProductsForCategory,
  catalogServingOptions,
  cakeCatalogSlugs,
  type CatalogProduct,
} from "@/lib/data";

type SortKey = "recommended" | "bestsellers" | "new" | "price-asc" | "price-desc";
type QuickKey = "same-day" | "customizable";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "recommended", label: "Önerilen" },
  { value: "bestsellers", label: "Çok Satanlar" },
  { value: "new", label: "Yeni Ürünler" },
  { value: "price-asc", label: "Fiyat: Artan" },
  { value: "price-desc", label: "Fiyat: Azalan" },
];

const QUICK: { value: QuickKey; label: string }[] = [
  { value: "same-day", label: "Aynı Gün" },
  { value: "customizable", label: "Kişiye Özel" },
];

const PAGE_SIZE = 12;

export function CatalogView() {
  const [category, setCategory] = useState("tumu");
  const [occasion, setOccasion] = useState("all");
  const [serving, setServing] = useState("all");
  const [quick, setQuick] = useState<QuickKey[]>([]);
  const [sort, setSort] = useState<SortKey>("recommended");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const showPastaFilters = cakeCatalogSlugs.includes(category);

  const results = useMemo(() => {
    let list: CatalogProduct[] = catalogProductsForCategory(category);

    if (quick.includes("same-day")) list = list.filter((p) => p.sameDayDelivery);
    if (quick.includes("customizable")) list = list.filter((p) => p.customizable);

    if (showPastaFilters && occasion !== "all") {
      list = list.filter((p) => p.occasions?.includes(occasion));
    }
    if (showPastaFilters && serving !== "all") {
      list = list.filter((p) => p.servingOptions?.includes(serving));
    }

    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => a.priceValue - b.priceValue);
    else if (sort === "price-desc") sorted.sort((a, b) => b.priceValue - a.priceValue);
    else if (sort === "bestsellers") sorted.sort((a, b) => Number(!!b.isBestSeller) - Number(!!a.isBestSeller));
    else if (sort === "new") sorted.sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
    else sorted.sort((a, b) => Number(!!b.isFeatured) - Number(!!a.isFeatured));

    return sorted;
  }, [category, occasion, serving, quick, sort, showPastaFilters]);

  // Reset pagination when the result set changes (render-phase state adjust).
  const signature = `${category}|${occasion}|${serving}|${quick.join(",")}|${sort}`;
  const [prevSignature, setPrevSignature] = useState(signature);
  if (signature !== prevSignature) {
    setPrevSignature(signature);
    setVisible(PAGE_SIZE);
  }

  const selectCategory = (slug: string) => {
    setCategory(slug);
    setOccasion("all");
    setServing("all");
  };

  const toggleQuick = (value: QuickKey) =>
    setQuick((cur) => (cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]));

  const resetAll = () => {
    selectCategory("tumu");
    setQuick([]);
  };

  const hasActiveFilters = quick.length > 0 || occasion !== "all" || serving !== "all";

  return (
    <>
      {/* Compact header — offset clears the fixed site header */}
      <section className="border-b border-sand-light bg-cream-light">
        <Container className="pt-24 pb-8 md:pt-28 md:pb-10">
          <h1 className="font-serif text-[32px] md:text-[40px] font-semibold leading-[1.1] text-burgundy">
            Lezzetlerimiz
          </h1>
          <p className="mt-3 max-w-xl font-sans text-[15px] leading-relaxed text-warm-brown">
            Funda&apos;nın günlük üretiminden kutlama pastalarına, tüm lezzetleri keşfedin.
          </p>
        </Container>
      </section>

      {/* Category quick nav */}
      <div className="border-b border-sand-light bg-cream-light">
        <Container>
          <div className="-mx-1 flex gap-1 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {catalogCategories.map((c) => {
              const active = category === c.slug;
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => selectCategory(c.slug)}
                  className={`shrink-0 whitespace-nowrap rounded-md px-3.5 py-2 font-sans text-[14px] transition-colors ${
                    active
                      ? "bg-burgundy/[0.07] font-semibold text-burgundy"
                      : "font-medium text-warm-brown hover:text-burgundy"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </Container>
      </div>

      <Container className="py-8 md:py-12">
        {/* Contextual filters — pasta only */}
        {showPastaFilters && (
          <div className="mb-6 space-y-2">
            <ChipRow
              options={catalogPastaOccasions}
              value={occasion}
              onChange={setOccasion}
            />
            <ChipRow
              options={[{ value: "all", label: "Tüm boyutlar" }, ...catalogServingOptions.map((s) => ({ value: s, label: s }))]}
              value={serving}
              onChange={setServing}
              muted
            />
          </div>
        )}

        {/* Toolbar */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-sand-light pb-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="font-sans text-[14px] text-warm-brown">
              <span className="font-semibold text-espresso">{results.length}</span> ürün
            </p>
            <div className="flex items-center gap-1.5">
              {QUICK.map((q) => {
                const on = quick.includes(q.value);
                return (
                  <button
                    key={q.value}
                    type="button"
                    onClick={() => toggleQuick(q.value)}
                    aria-pressed={on}
                    className={`rounded-md px-2.5 py-1 font-sans text-[13px] transition-colors ${
                      on
                        ? "bg-burgundy/[0.07] font-semibold text-burgundy"
                        : "font-medium text-taupe hover:text-burgundy"
                    }`}
                  >
                    {q.label}
                  </button>
                );
              })}
            </div>
          </div>

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

        {/* Grid */}
        {results.length === 0 ? (
          <div className="rounded-lg border border-sand-light bg-cream-light px-6 py-16 text-center">
            <p className="font-serif text-[20px] font-medium text-burgundy">
              Bu filtrelere uygun ürün bulunamadı.
            </p>
            <button
              type="button"
              onClick={resetAll}
              className="mt-4 inline-flex rounded-md bg-burgundy px-5 py-2.5 font-sans text-[13px] font-semibold text-cream-light hover:bg-chocolate-light"
            >
              Filtreleri Temizle
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-5 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
              {results.slice(0, visible).map((p) => (
                <ProductGridCard key={p.id} product={p} />
              ))}
            </div>

            {visible < results.length && (
              <div className="mt-12 text-center">
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="inline-flex rounded-md border border-burgundy/30 px-8 py-3 font-sans text-[14px] font-semibold text-burgundy transition-colors hover:bg-burgundy hover:text-cream-light"
                >
                  Daha Fazla Göster
                </button>
                <p className="mt-3 font-sans text-[12px] text-taupe">
                  {Math.min(visible, results.length)} / {results.length}
                </p>
              </div>
            )}

            {hasActiveFilters && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={resetAll}
                  className="font-sans text-[13px] font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-4 hover:decoration-burgundy"
                >
                  Filtreleri Temizle
                </button>
              </div>
            )}
          </>
        )}
      </Container>
    </>
  );
}

function ChipRow({
  options,
  value,
  onChange,
  muted = false,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  muted?: boolean;
}) {
  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 font-sans transition-colors ${
              muted ? "text-[12.5px]" : "text-[13px]"
            } ${
              active
                ? "bg-burgundy/[0.07] font-semibold text-burgundy"
                : `font-medium ${muted ? "text-taupe" : "text-warm-brown"} hover:text-burgundy`
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
