import Link from "next/link";
import Image from "next/image";
import type { CatalogProduct } from "@/lib/data";

/** Compact autocomplete row — image, name, category, price. */
export function SearchResultItem({
  product,
  onSelect,
}: {
  product: CatalogProduct;
  onSelect: () => void;
}) {
  return (
    <Link
      href={`/urunler/${product.slug}`}
      onClick={onSelect}
      className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-cream"
    >
      <div
        className={`relative h-14 w-12 shrink-0 overflow-hidden rounded-md bg-gradient-to-br ${product.gradient}`}
      >
        {product.image ? (
          <Image src={product.image} alt={product.name} fill sizes="48px" className="object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-serif text-lg text-espresso/15">
            {product.name.charAt(0)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-sans text-[14px] font-medium text-espresso">{product.name}</p>
        <p className="font-sans text-[12px] text-taupe">{product.categoryName}</p>
      </div>
      <span className="shrink-0 font-sans text-[13px] font-semibold text-burgundy">
        {product.displayPrice}
      </span>
    </Link>
  );
}
