"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { CatalogProduct } from "@/lib/data";
import { addToCart } from "@/lib/cart";
import { formatTL } from "@/lib/cart-utils";
import { cartHasBranchConflict } from "@/lib/cart-fulfillment";
import { getQuickOrderMode } from "@/lib/quick-order-utils";
import { useDelivery } from "@/lib/delivery/context";
import {
  reasonMessage,
  type CatalogAvailabilityVerdict,
  type AvailabilityResult,
} from "@/lib/availability";

/** Frontend-only quantity ceiling — mirrors the cart's own clamp (cart.ts). */
const MAX_QTY = 20;

function Stepper({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex items-center rounded-md border border-sand">
      <button
        type="button"
        aria-label="Adedi azalt"
        disabled={disabled || value <= 1}
        onClick={() => onChange(value - 1)}
        className="flex h-9 w-9 items-center justify-center font-sans text-[16px] leading-none text-espresso transition-colors hover:text-burgundy disabled:opacity-30"
      >
        −
      </button>
      <span className="min-w-[2ch] text-center font-sans text-[13px] font-medium tabular-nums text-espresso">
        {value}
      </span>
      <button
        type="button"
        aria-label="Adedi artır"
        disabled={disabled || value >= MAX_QTY}
        onClick={() => onChange(value + 1)}
        className="flex h-9 w-9 items-center justify-center font-sans text-[16px] leading-none text-espresso transition-colors hover:text-burgundy disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}

function AvailabilityLine({ v, todayISO }: { v: CatalogAvailabilityVerdict; todayISO: string }) {
  if (v.reason === "PRODUCT_DISABLED_AT_BRANCH" || v.reason === "OUT_OF_STOCK") {
    return <span className="text-chocolate-light">{reasonMessage(v.reason)}</span>;
  }
  if (v.available) {
    return (
      <span className="text-burgundy">
        Bugün teslim edilebilir{v.slotLabel ? ` · en erken ${v.slotLabel}` : ""}
      </span>
    );
  }
  if (v.earliestDate) {
    const label = v.earliestDate === todayISO ? "bugün" : "yarın ve sonrası";
    return (
      <span className="text-taupe">
        Bugün uygun değil · {label} teslim edilebilir
        {v.earliestLabel ? ` (${v.earliestLabel})` : ""}
      </span>
    );
  }
  return <span className="text-taupe">{reasonMessage(v.reason)}</span>;
}

export function QuickOrderProductRow({
  product,
  verdict,
}: {
  product: CatalogProduct;
  verdict: CatalogAvailabilityVerdict | null;
}) {
  const mode = useMemo(() => getQuickOrderMode(product), [product]);
  const { context, isResolved } = useDelivery();

  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variantId, setVariantId] = useState<string | null>(
    mode.kind === "variant" ? mode.variants[0].id : null,
  );

  const selectedVariant =
    mode.kind === "variant"
      ? mode.variants.find((v) => v.id === variantId) ?? mode.variants[0]
      : null;

  const unitPrice = selectedVariant ? selectedVariant.price : product.priceValue;
  const priceLabel = selectedVariant ? formatTL(unitPrice) : product.displayPrice;

  const pad = (n: number) => String(n).padStart(2, "0");
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const handleAdd = async () => {
    setError(null);

    let branch: string | null = null;
    let deliveryDate: string | null = null;
    let deliveryTime: string | null = null;
    let deliveryType: "address" | "pickup" | null = null;

    if (isResolved) {
      setBusy(true);
      // authoritative check (reservation- + ops-panel-override-aware)
      const check = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "product",
          productId: product.id,
          productSlug: product.slug,
          variantId: selectedVariant?.id ?? null,
          quantity: qty,
          context,
        }),
      })
        .then((r) => r.json() as Promise<AvailabilityResult>)
        .catch(() => null);
      setBusy(false);

      if (!check) {
        setError("Uygunluk kontrol edilemedi. Lütfen tekrar deneyin.");
        return;
      }
      if (check.reason === "PRODUCT_DISABLED_AT_BRANCH" || check.reason === "OUT_OF_STOCK") {
        setError(reasonMessage(check.reason));
        return;
      }
      if (cartHasBranchConflict(check.branchId)) {
        setError("Sepetinizde başka bir şubeden ürün var. Önce mevcut siparişi tamamlayın.");
        return;
      }
      const target = check.available
        ? { date: check.requestedDate, slot: check.slots.find((s) => s.available) ?? null }
        : check.earliestAvailableSlot
          ? { date: check.earliestAvailableSlot.date, slot: check.earliestAvailableSlot }
          : null;
      if (!target || !target.slot) {
        setError(reasonMessage(check.reason));
        return;
      }
      branch = check.branchId;
      deliveryDate = target.date;
      deliveryTime = target.slot.label;
      deliveryType = context.fulfillmentType === "delivery" ? "address" : "pickup";
    }

    addToCart({
      productId: product.id,
      slug: product.slug,
      productName: product.name,
      categoryName: product.categoryName,
      image: product.image ?? product.gradient,
      selectedVariant: selectedVariant ? selectedVariant.id : null,
      variantLabel: selectedVariant ? selectedVariant.label : null,
      unitPrice,
      quantity: qty,
      quantityEnabled: true,
      customization: { extras: [] },
      deliveryType,
      deliveryDate,
      deliveryTime,
      branch,
      addedAt: Date.now(),
    });
    setAdded(true);
    setQty(1);
    window.setTimeout(() => setAdded(false), 1600);
  };

  const helper = product.sameDayDelivery
    ? `${product.categoryName} · Aynı gün`
    : product.categoryName;

  return (
    <article className="border-b border-sand-light py-4 last:border-b-0">
      <div className="flex gap-3 sm:gap-4">
        <div
          className={`relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-md bg-gradient-to-br sm:h-[84px] sm:w-[84px] ${product.gradient}`}
        >
          {product.image ? (
            <Image src={product.image} alt={product.name} fill sizes="84px" className="object-cover" />
          ) : (
            <span className="font-serif text-2xl leading-none text-espresso/25 select-none sm:text-3xl">
              {product.name.charAt(0)}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-sans text-[14px] font-semibold leading-snug text-espresso line-clamp-2">
                {product.name}
              </h3>
              <p className="mt-0.5 font-sans text-[12px] text-taupe">{helper}</p>
            </div>
            <span className="shrink-0 font-sans text-[14px] font-semibold text-burgundy">
              {priceLabel}
            </span>
          </div>

          {/* Inline variant chips */}
          {mode.kind === "variant" && (
            <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label={mode.label}>
              {mode.variants.map((v) => {
                const on = v.id === selectedVariant?.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setVariantId(v.id)}
                    className={`rounded-md border px-2.5 py-1 font-sans text-[12.5px] transition-colors ${
                      on
                        ? "border-burgundy bg-burgundy/[0.06] font-medium text-burgundy"
                        : "border-sand bg-cream-light text-warm-brown hover:border-taupe hover:bg-cream"
                    }`}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Availability line */}
          {mode.kind !== "detailed" && isResolved && verdict && (
            <p className="mt-2 font-sans text-[12px] leading-snug">
              <AvailabilityLine v={verdict} todayISO={todayISO} />
            </p>
          )}

          {/* Controls */}
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            {mode.kind === "detailed" ? (
              <Link
                href={`/urunler/${product.slug}`}
                className="inline-flex h-9 items-center gap-1 font-sans text-[13px] font-semibold text-burgundy transition-colors hover:text-chocolate-light"
              >
                Detaylı Sipariş <span aria-hidden>→</span>
              </Link>
            ) : (
              <>
                <Stepper value={qty} onChange={setQty} disabled={added || busy} />
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={busy}
                  className="inline-flex h-9 items-center rounded-md bg-burgundy px-4 font-sans text-[13px] font-semibold text-cream-light transition-colors hover:bg-chocolate-light disabled:opacity-60"
                >
                  {added ? "Sepete Eklendi ✓" : busy ? "Kontrol ediliyor…" : "Sepete Ekle"}
                </button>
              </>
            )}
          </div>
          {error && (
            <p role="alert" className="mt-1.5 font-sans text-[12px] text-chocolate-light">
              {error}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
