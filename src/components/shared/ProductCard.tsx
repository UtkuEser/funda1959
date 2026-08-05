import { Figure } from "@/components/ui/Figure";
import type { Product } from "@/content/menu";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group flex h-full flex-col bg-cream">
      <Figure
        asset={product.image}
        ratio="aspect-[4/5]"
        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
      />

      <div className="flex flex-1 flex-col border-x border-b border-stone/25 px-6 py-6">
        {product.isSignature ? (
          <p className="mb-3 font-sans text-[9px] uppercase tracking-[0.28em] text-gold">
            İmza Lezzet
          </p>
        ) : null}

        <h3 className="font-serif text-[1.4rem] leading-snug text-ink transition-colors group-hover:text-bordo">
          {product.name}
        </h3>

        <p className="font-sans text-[13px] uppercase tracking-[0.12em] text-bordo/60 mt-2">
          {product.short}
        </p>

        <p className="mt-4 flex-1 font-sans text-[15px] leading-[1.7] text-ink-soft">
          {product.description}
        </p>

        {product.notes.length > 0 ? (
          <ul className="mt-6 flex flex-wrap gap-2">
            {product.notes.map((note) => (
              <li
                key={note}
                className="border border-stone/40 px-3 py-1.5 font-sans text-[10px] uppercase tracking-[0.14em] text-ink-mute"
              >
                {note}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
