import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/data";
import { productImagesForCategory } from "@/lib/product-images";

type ProductCardProps = {
  product: Product;
  size?: "default" | "large";
  /** explicit demo photo; when omitted the category's first photo is used */
  image?: string | null;
};

export function ProductCard({ product, image }: ProductCardProps) {
  const src = image ?? productImagesForCategory(product.categorySlug)[0] ?? null;

  return (
    <Link
      href={`/lezzetlerimiz/${product.categorySlug}`}
      className="group flex flex-col"
    >
      {/* Image — the primary element */}
      <div
        className={`relative w-full aspect-[4/5] overflow-hidden rounded-lg bg-gradient-to-br ${product.gradient}`}
      >
        {src ? (
          <Image
            src={src}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 300px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.1] group-hover:opacity-[0.16] transition-opacity duration-500">
            <span className="font-serif text-6xl text-espresso select-none leading-none">
              {product.name.charAt(0)}
            </span>
          </div>
        )}
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
