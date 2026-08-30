import Link from "next/link";
import type { Product } from "@/lib/data";

type ProductCardProps = {
  product: Product;
  size?: "default" | "large";
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/lezzetlerimiz/${product.categorySlug}`}
      className="group flex flex-col"
    >
      {/* Image — the primary element */}
      <div
        className={`w-full aspect-[4/5] overflow-hidden rounded-lg bg-gradient-to-br ${product.gradient} relative`}
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.1] group-hover:opacity-[0.16] transition-opacity duration-500">
          <span className="font-serif text-6xl text-espresso select-none leading-none">
            {product.name.charAt(0)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="pt-3.5">
        <h3 className="font-serif text-[16px] font-medium text-burgundy leading-snug">
          {product.name}
        </h3>
        <p className="mt-0.5 font-sans text-[12px] text-taupe">{product.categoryName}</p>
        <p className="mt-2 font-sans text-[14px] font-semibold text-espresso">
          {product.price ?? "Fiyat için sorunuz"}
        </p>
      </div>
    </Link>
  );
}
