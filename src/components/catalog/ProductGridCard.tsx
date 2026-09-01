"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { canQuickAddToCart, type CatalogProduct } from "@/lib/data";
import { addToCart } from "@/lib/cart";

function badgesFor(p: CatalogProduct): string[] {
  const out: string[] = [];
  if (p.isBestSeller) out.push("Çok Satan");
  if (p.isNew) out.push("Yeni");
  if (out.length < 2 && p.sameDayDelivery) out.push("Aynı Gün");
  if (out.length < 2 && p.customizable) out.push("Kişiye Özel");
  return out.slice(0, 2);
}

export function ProductGridCard({ product }: { product: CatalogProduct }) {
  const [fav, setFav] = useState(false);
  const [added, setAdded] = useState(false);
  const href = `/urunler/${product.slug}`;
  const quickAdd = canQuickAddToCart(product);
  const badges = badgesFor(product);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Simple, single-price product -> add straight to the real cart.
    addToCart({
      productId: product.id,
      slug: product.slug,
      productName: product.name,
      categoryName: product.categoryName,
      image: product.image ?? product.gradient,
      selectedVariant: null,
      variantLabel: null,
      unitPrice: product.priceValue,
      quantity: 1,
      quantityEnabled: true,
      customization: { extras: [] },
      deliveryType: null,
      deliveryDate: null,
      deliveryTime: null,
      branch: null,
      addedAt: Date.now(),
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article className="group relative flex flex-col">
      <Link href={href} className="flex flex-1 flex-col">
        <div
          className={`relative w-full aspect-square overflow-hidden rounded-lg bg-gradient-to-br sm:aspect-[4/5] ${product.gradient}`}
        >
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 300px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.1] transition-opacity duration-500 group-hover:opacity-[0.16]">
              <span className="font-serif text-6xl leading-none text-espresso select-none">
                {product.name.charAt(0)}
              </span>
            </div>
          )}

          {badges.length > 0 && (
            <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
              {badges.map((b) => (
                <span
                  key={b}
                  className="rounded-sm bg-cream-light/95 px-2 py-0.5 font-sans text-[11px] font-semibold tracking-wide text-burgundy"
                >
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="pt-3">
          <h3 className="font-sans text-[15px] font-semibold leading-snug text-espresso transition-colors group-hover:text-burgundy">
            {product.name}
          </h3>
          <p className="mt-0.5 font-sans text-[12px] text-taupe">{product.categoryName}</p>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-sans text-[15px] font-semibold text-burgundy">
              {product.displayPrice}
            </span>
            {product.oldPrice && (
              <span className="font-sans text-[12px] text-taupe line-through">
                {product.oldPrice}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Favorite — visually quiet */}
      <button
        type="button"
        onClick={() => setFav((v) => !v)}
        aria-pressed={fav}
        aria-label={fav ? "Favorilerden çıkar" : "Favorilere ekle"}
        className="absolute right-2 top-2 p-1.5 text-espresso/45 transition-colors hover:text-burgundy"
      >
        <svg
          className="h-[18px] w-[18px]"
          viewBox="0 0 24 24"
          fill={fav ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={1.6}
        >
          <path d="M12 21s-6.7-4.35-9.33-8.02C.7 10.3 1.6 6.5 4.9 5.4c2.2-.73 4.3.25 5.6 2.02C11.8 5.65 13.9 4.67 16.1 5.4c3.3 1.1 4.2 4.9 2.23 7.58C18.7 16.65 12 21 12 21z" />
        </svg>
      </button>

      {/* Single action */}
      {!quickAdd ? (
        <Link
          href={href}
          className="mt-2.5 inline-flex items-center gap-1 self-start font-sans text-[13px] font-semibold text-burgundy transition-colors hover:text-chocolate-light"
        >
          Seçenekleri Gör
          <span aria-hidden>→</span>
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleQuickAdd}
          className="mt-2.5 inline-flex self-start rounded-md bg-burgundy px-4 py-2 font-sans text-[13px] font-semibold text-cream-light transition-colors hover:bg-chocolate-light"
        >
          {added ? "Sepete Eklendi ✓" : "Sepete Ekle"}
        </button>
      )}
    </article>
  );
}
