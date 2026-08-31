"use client";

import type { CatalogCategory } from "@/lib/data";

export function QuickOrderCategories({
  categories,
  active,
  onSelect,
}: {
  categories: CatalogCategory[];
  active: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <nav aria-label="Kategoriler">
      {/* Mobile: horizontal scroll strip */}
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8 lg:hidden">
        {categories.map((c) => {
          const on = c.slug === active;
          return (
            <button
              key={c.slug}
              type="button"
              aria-pressed={on}
              onClick={() => onSelect(c.slug)}
              className={`shrink-0 rounded-md border px-3 py-1.5 font-sans text-[13px] transition-colors ${
                on
                  ? "border-burgundy bg-burgundy/[0.05] font-semibold text-burgundy"
                  : "border-sand text-warm-brown hover:border-taupe"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Desktop: vertical list */}
      <ul className="hidden rounded-lg border border-sand-light bg-cream-light p-1.5 lg:block">
        {categories.map((c) => {
          const on = c.slug === active;
          return (
            <li key={c.slug}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onSelect(c.slug)}
                className={`w-full rounded-md px-3 py-2 text-left font-sans text-[13.5px] transition-colors ${
                  on
                    ? "bg-burgundy/[0.06] font-semibold text-burgundy"
                    : "text-warm-brown hover:bg-cream"
                }`}
              >
                {c.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
