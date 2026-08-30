import Link from "next/link";
import type { CartItem as CartItemType } from "@/lib/cart";
import { deliverySummary, formatTL, itemTotal } from "@/lib/cart-utils";

function QtyControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-md border border-sand">
      <button
        type="button"
        aria-label="Adedi azalt"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        className="flex h-9 w-9 items-center justify-center text-[16px] text-burgundy transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-35"
      >
        −
      </button>
      <span className="w-8 text-center font-sans text-[14px] font-semibold text-espresso">
        {value}
      </span>
      <button
        type="button"
        aria-label="Adedi artır"
        disabled={value >= 20}
        onClick={() => onChange(value + 1)}
        className="flex h-9 w-9 items-center justify-center text-[16px] text-burgundy transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-35"
      >
        +
      </button>
    </div>
  );
}

function Actions({ slug, onRemove }: { slug: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 font-sans text-[13px]">
      <Link
        href={`/urunler/${slug}`}
        className="font-semibold text-burgundy transition-colors hover:text-chocolate-light"
      >
        Düzenle
      </Link>
      <span className="text-sand" aria-hidden>
        ·
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="text-taupe transition-colors hover:text-burgundy"
      >
        Kaldır
      </button>
    </div>
  );
}

export function CartItemRow({
  item,
  onQuantity,
  onRemove,
}: {
  item: CartItemType;
  onQuantity: (next: number) => void;
  onRemove: () => void;
}) {
  const total = itemTotal(item);
  const delivery = deliverySummary(item);
  const { message, note, extras } = item.customization;

  return (
    <div className="flex gap-4 border-b border-sand-light py-6">
      {/* Image */}
      <Link href={`/urunler/${item.slug}`} className="shrink-0">
        <div
          className={`relative h-[104px] w-[86px] overflow-hidden rounded-md bg-gradient-to-br sm:h-[130px] sm:w-[108px] ${item.image}`}
        >
          <span className="absolute inset-0 flex items-center justify-center font-serif text-3xl text-espresso/15 select-none">
            {item.productName.charAt(0)}
          </span>
        </div>
      </Link>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link href={`/urunler/${item.slug}`}>
              <h3 className="font-sans text-[15px] font-semibold leading-snug text-espresso transition-colors hover:text-burgundy">
                {item.productName}
              </h3>
            </Link>
            {item.variantLabel && (
              <p className="mt-0.5 font-sans text-[13px] text-warm-brown">{item.variantLabel}</p>
            )}
          </div>

          {/* Desktop price */}
          <span className="hidden shrink-0 font-sans text-[15px] font-semibold text-burgundy lg:block">
            {formatTL(total)}
          </span>
        </div>

        {/* Customization */}
        {(message || (extras && extras.length > 0) || note) && (
          <div className="mt-2 space-y-0.5 font-sans text-[13px] text-warm-brown">
            {message && (
              <p>
                Pasta yazısı: <span className="text-espresso">&ldquo;{message}&rdquo;</span>
              </p>
            )}
            {extras && extras.length > 0 && <p>Ek: {extras.join(", ")}</p>}
            {note && <p className="text-taupe">Not: {note}</p>}
          </div>
        )}

        {/* Delivery */}
        {delivery.length > 0 && (
          <div className="mt-2 font-sans text-[12.5px] leading-relaxed text-taupe">
            {delivery.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}

        {/* Controls — desktop */}
        <div className="mt-3 hidden items-center gap-5 lg:flex">
          {item.quantityEnabled ? (
            <QtyControl value={item.quantity} onChange={onQuantity} />
          ) : (
            <span className="font-sans text-[13px] text-taupe">Adet: {item.quantity}</span>
          )}
          <Actions slug={item.slug} onRemove={onRemove} />
        </div>

        {/* Controls — mobile */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 lg:hidden">
          {item.quantityEnabled ? (
            <QtyControl value={item.quantity} onChange={onQuantity} />
          ) : (
            <span className="font-sans text-[13px] text-taupe">Adet: {item.quantity}</span>
          )}
          <span className="font-sans text-[14px] font-semibold text-burgundy">{formatTL(total)}</span>
          <Actions slug={item.slug} onRemove={onRemove} />
        </div>
      </div>
    </div>
  );
}
