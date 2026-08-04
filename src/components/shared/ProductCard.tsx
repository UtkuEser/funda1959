import Link from "next/link";
import type { Product } from "@/lib/data";

type ProductCardProps = {
  product: Product;
  size?: "default" | "large";
};

export function ProductCard({ product, size = "default" }: ProductCardProps) {
  return (
    <div className="group bg-cream-light rounded-2xl overflow-hidden border border-sand-light hover:border-gold/30 hover:shadow-xl hover:shadow-sand/30 transition-all duration-400 flex flex-col">
      {/* Image */}
      <div
        className={`w-full overflow-hidden ${size === "large" ? "aspect-[4/3]" : "aspect-[3/2]"} bg-gradient-to-br ${product.gradient} relative`}
      >
        {/* Category pill */}
        <span className="absolute top-3 left-3 bg-cream-light/90 backdrop-blur-sm text-chocolate text-xs font-sans font-semibold px-3 py-1 rounded-full">
          {product.categoryName}
        </span>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Decorative inner content */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity">
          <p className="font-serif text-8xl font-bold text-espresso select-none leading-none">
            {product.name.charAt(0)}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-serif text-lg font-semibold text-chocolate group-hover:text-warm-brown transition-colors mb-2 leading-snug">
          {product.name}
        </h3>
        <p className="font-sans text-sm text-mocha leading-relaxed flex-1 line-clamp-2 mb-4">
          {product.shortDescription}
        </p>

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {product.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="font-sans text-xs text-warm-brown bg-cream px-2.5 py-0.5 rounded-full border border-sand-light"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <Link
            href={`/lezzetlerimiz/${product.categorySlug}`}
            className="flex-1 text-center px-4 py-2.5 bg-cream text-chocolate border border-sand text-sm font-sans font-semibold rounded-xl hover:bg-cream-dark hover:border-chocolate/30 transition-all duration-200"
          >
            Detayları Gör
          </Link>
          <a
            href="tel:+903124470000"
            className="flex items-center justify-center px-4 py-2.5 bg-chocolate text-cream-light text-sm font-sans font-semibold rounded-xl hover:bg-chocolate-light transition-colors duration-200"
            title="Sipariş için ara"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
