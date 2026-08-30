"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AUTOCOMPLETE_CATEGORY_LIMIT,
  AUTOCOMPLETE_PRODUCT_LIMIT,
  MIN_QUERY_LENGTH,
  POPULAR_SEARCHES,
  search,
  searchOverlayCategories,
} from "@/lib/search";
import { SearchResultItem } from "./SearchResultItem";

const DEBOUNCE_MS = 250;

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  const handleClose = useCallback(() => {
    setQuery("");
    setDebounced("");
    onClose();
  }, [onClose]);

  const onQueryChange = (value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebounced(value), DEBOUNCE_MS);
  };

  // Single source of truth for "go to the results page for a term".
  const runSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    router.push(`/arama?q=${encodeURIComponent(trimmed)}`);
    handleClose();
  };

  const submitSearch = () => runSearch(query);

  // Focus on open, clear debounce timer on unmount.
  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 40);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // ESC + body scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, handleClose]);

  const results = useMemo(() => search(debounced), [debounced]);
  const hasQuery = debounced.trim().length >= MIN_QUERY_LENGTH;

  if (!open) return null;

  const products = results.products.slice(0, AUTOCOMPLETE_PRODUCT_LIMIT);
  const cats = results.categories.slice(0, AUTOCOMPLETE_CATEGORY_LIMIT);

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-espresso/25"
        onClick={handleClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ürün arama"
        className="fixed inset-x-0 top-0 z-[61] sm:top-[68px] md:top-[76px]"
      >
        <div className="mx-auto flex h-[100dvh] w-full flex-col bg-cream-light sm:h-auto sm:max-h-[72vh] sm:max-w-[820px] sm:rounded-b-xl sm:border sm:border-t-0 sm:border-sand-light sm:shadow-[0_24px_60px_-28px_rgba(42,35,32,0.35)]">
          {/* Input row — real search form so Enter / mobile "Search" submit natively */}
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch();
            }}
            className="flex shrink-0 items-center gap-2 border-b border-sand-light px-4 py-3 sm:px-5"
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label="Aramayı kapat"
              className="p-1 text-warm-brown hover:text-burgundy sm:hidden"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <svg
              className="hidden h-[18px] w-[18px] shrink-0 text-taupe sm:block"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 21l-4.3-4.3M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              aria-label="Ürün ara"
              placeholder="Çikolatalı pasta, baklava, doğum günü pastası..."
              className="h-11 w-full bg-transparent font-sans text-[15px] text-espresso placeholder:text-taupe/60 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleClose}
              aria-label="Aramayı kapat"
              className="hidden p-1 text-taupe hover:text-burgundy sm:block"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </form>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {!hasQuery ? (
              <div className="space-y-6">
                <div>
                  <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-burgundy/50">
                    Popüler Aramalar
                  </p>
                  <ul className="mt-2.5 flex flex-col">
                    {POPULAR_SEARCHES.map((term) => (
                      <li key={term}>
                        <button
                          type="button"
                          onClick={() => runSearch(term)}
                          className="w-full rounded-md px-2 py-2 text-left font-sans text-[14px] text-warm-brown transition-colors hover:bg-cream hover:text-burgundy"
                        >
                          {term}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-burgundy/50">
                    Kategoriler
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {searchOverlayCategories.map((c) => (
                      <Link
                        key={c.slug}
                        href={c.href}
                        onClick={handleClose}
                        className="rounded-md border border-sand-light px-3 py-1.5 font-sans text-[13px] font-medium text-warm-brown transition-colors hover:border-burgundy/40 hover:text-burgundy"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : results.total === 0 && cats.length === 0 ? (
              <div className="py-8 text-center">
                <p className="font-sans text-[14px] text-warm-brown">
                  &ldquo;{debounced.trim()}&rdquo; için sonuç bulunamadı.
                </p>
                <Link
                  href="/lezzetlerimiz"
                  onClick={handleClose}
                  className="mt-3 inline-flex font-sans text-[13px] font-semibold text-burgundy hover:text-chocolate-light"
                >
                  Tüm lezzetleri keşfet →
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                {products.length > 0 && (
                  <div>
                    <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-burgundy/50">
                      Ürünler
                    </p>
                    <ul className="mt-1.5">
                      {products.map((p) => (
                        <li key={p.id}>
                          <SearchResultItem product={p} onSelect={handleClose} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {cats.length > 0 && (
                  <div>
                    <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-burgundy/50">
                      Kategoriler
                    </p>
                    <ul className="mt-1.5">
                      {cats.map((c) => (
                        <li key={c.slug}>
                          <Link
                            href={c.href}
                            onClick={handleClose}
                            className="block rounded-md px-2 py-2 font-sans text-[14px] text-warm-brown transition-colors hover:bg-cream hover:text-burgundy"
                          >
                            {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  onClick={submitSearch}
                  className="w-full border-t border-sand-light pt-4 text-left font-sans text-[13px] font-semibold text-burgundy transition-colors hover:text-chocolate-light"
                >
                  &ldquo;{debounced.trim()}&rdquo; için tüm sonuçları gör →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
