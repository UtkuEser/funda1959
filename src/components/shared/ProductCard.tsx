import { Figure } from "@/components/ui/Figure";
import type { Product } from "@/content/menu";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group flex h-full flex-col">
      <Figure
        asset={product.image}
        ratio="4 / 5"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 45vw, 30vw"
        zoom
      />

      <div className="flex flex-1 flex-col pt-6">
        {product.isSignature ? (
          <p className="mb-3 font-sans text-[12px] uppercase tracking-[0.16em] text-bordo/80">
            İmza Lezzet
          </p>
        ) : null}

        <h3 className="t-h3 font-serif text-ink">{product.name}</h3>

        <p className="mt-2 font-sans text-[16px] text-ink-mute">{product.short}</p>

        <p className="mt-4 flex-1 font-sans text-[16px] leading-[1.65] text-ink-soft">
          {product.description}
        </p>

        {product.notes.length > 0 ? (
          <p className="mt-5 font-sans text-[14px] text-ink-mute">
            {product.notes.join(" · ")}
          </p>
        ) : null}
      </div>
    </article>
  );
}
