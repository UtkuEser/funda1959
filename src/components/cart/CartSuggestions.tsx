"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { addToCart } from "@/lib/cart";
import { useCart } from "@/lib/use-cart";
import { formatTL } from "@/lib/cart-utils";
import { cartDeliveryPlan, planLineAtCartTime, type CartLinePlan } from "@/lib/cart-fulfillment";
import { SUGGESTION_LIMIT, suggestionCandidates } from "@/lib/cart-suggestions";
import {
  allCatalogProducts,
  catalogVersion,
  setPublishedProducts,
  type CatalogProduct,
  type ProductVariant,
  type PublishedProduct,
} from "@/lib/data";
import type { CatalogAvailabilityVerdict, DeliveryContext } from "@/lib/availability";
import { applyPrice, pricedSizes, type PriceMap } from "@/lib/pricing/prices";
import { getQuickOrderMode } from "@/lib/quick-order-utils";
import { dateSlotText } from "@/lib/delivery/labels";
import { slotHasStarted } from "@/lib/delivery/slots";
import { istanbulDateISO } from "@/lib/time/istanbul";
import { useNow } from "@/lib/time/use-now";

/** "10:00 – 11:00" -> "10:00" */
const slotStartOf = (label: string | null) => label?.match(/(\d{2}:\d{2})/)?.[1];

/** One of the product at the cart's shipping time, through the cart like any other line — only after the server check. */
async function addSuggestion(
  product: CatalogProduct,
  size: ProductVariant | null,
  context: DeliveryContext,
): Promise<CartLinePlan> {
  const plan = await planLineAtCartTime({
    productId: product.id,
    productSlug: product.slug,
    variantId: size?.id ?? null,
    quantity: 1,
    context,
  });
  if (!plan.ok) return plan;
  addToCart({
    productId: product.id,
    slug: product.slug,
    productName: product.name,
    categoryName: product.categoryName,
    image: product.image ?? product.gradient,
    selectedVariant: size?.id ?? null,
    variantLabel: size?.label ?? null,
    unitPrice: size ? size.price : product.priceValue,
    quantity: 1,
    quantityEnabled: true,
    customization: { extras: [] },
    deliveryType: plan.deliveryType,
    deliveryDate: plan.date,
    deliveryTime: plan.slotLabel,
    branch: plan.branchId,
    addedAt: Date.now(),
  });
  return plan;
}

function SuggestionCard({
  product: base,
  prices,
  context,
  linkToProduct,
  onAdded,
}: {
  product: CatalogProduct;
  prices: PriceMap;
  context: DeliveryContext;
  linkToProduct: boolean;
  onAdded: (name: string, date: string, slotLabel: string) => void;
}) {
  // the current price (D5); the cart confirms it again once the line is in (useCartPriceSync)
  const product = useMemo(() => applyPrice(base, prices), [base, prices]);
  const mode = useMemo(() => getQuickOrderMode(product), [product]);
  const sizes = useMemo(() => (mode.kind === "variant" ? pricedSizes(product.id, mode.variants, prices) : []), [mode, product.id, prices]);
  // never chosen for the customer
  const [variantId, setVariantId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = sizes.find((s) => s.id === variantId) ?? null;

  const add = async () => {
    setError(null);
    if (mode.kind === "variant" && !selected) {
      setError(`Önce ${mode.label.toLocaleLowerCase("tr")} seçin.`);
      return;
    }
    setBusy(true);
    const plan = await addSuggestion(product, selected, context);
    setBusy(false);
    if (!plan.ok) {
      setError(plan.message);
      return;
    }
    onAdded(product.name, plan.date, plan.slotLabel);
  };

  const name = (
    <span className="font-sans text-[13.5px] font-semibold leading-snug text-espresso line-clamp-2">{product.name}</span>
  );

  return (
    <li className="flex gap-3 rounded-lg border border-sand-light bg-cream-light p-3">
      <div className={`relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-md bg-gradient-to-br ${product.gradient}`}>
        {product.image ? (
          <Image src={product.image} alt="" fill sizes="56px" className="object-cover" />
        ) : (
          <span className="font-serif text-xl leading-none text-espresso/25 select-none">{product.name.charAt(0)}</span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          {linkToProduct ? (
            <Link href={`/urunler/${product.slug}`} className="min-w-0 hover:text-burgundy">
              {name}
            </Link>
          ) : (
            <div className="min-w-0">{name}</div>
          )}
          <span className="shrink-0 font-sans text-[13.5px] font-semibold text-burgundy">
            {selected ? formatTL(selected.price) : product.displayPrice}
          </span>
        </div>
        <p className="font-sans text-[11.5px] text-taupe">{product.categoryName}</p>

        {mode.kind === "variant" && (
          <div className="mt-2 flex flex-wrap gap-1" role="group" aria-label={mode.label}>
            {sizes.map((s) => {
              const on = s.id === variantId;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setVariantId(s.id);
                    setError(null);
                  }}
                  className={`rounded-md border px-2 py-0.5 font-sans text-[12px] transition-colors ${
                    on
                      ? "border-burgundy bg-burgundy/[0.06] font-medium text-burgundy"
                      : "border-sand bg-white/60 text-warm-brown hover:border-taupe"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-2">
          <button
            type="button"
            onClick={add}
            disabled={busy}
            className="inline-flex h-8 items-center rounded-md border border-burgundy px-3 font-sans text-[12.5px] font-semibold text-burgundy transition-colors hover:bg-burgundy hover:text-cream-light disabled:opacity-60"
          >
            {busy ? "Kontrol ediliyor…" : "Sepete Ekle"}
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-1.5 font-sans text-[12px] leading-snug text-chocolate-light">
            {error}
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * "Siparişinize eşlik etsin" (/sepet under the lines, /checkout before the
 * summary): up to four products that go with the cart (`lib/cart-suggestions`
 * — the pairings), only those the server says can be prepared at the cart's
 * branch for the cart's shipping time. Refreshed when the cart, the address /
 * store or that time changes; the order is fixed per cart (no reshuffling).
 * Adding goes through the cart like any other line, at the cart's shipping
 * time — the time never moves; the totals, the delivery minimum and the
 * shipping check follow the cart. Hidden when nothing fits, before an address
 * / store is known, or while the cart's time itself isn't valid.
 */
export function CartSuggestions({
  context,
  linkToProducts = false,
  className = "",
}: {
  /** the context the order is checked with on this page; null = not known yet */
  context: DeliveryContext | null;
  /** product names link to their page (not on checkout: the form stays) */
  linkToProducts?: boolean;
  className?: string;
}) {
  const items = useCart();
  const now = useNow();
  const titleId = useId();

  // the storefront catalog + current prices, read once: published panel products (D45) join, products off the site (D48) leave
  const [catalog, setCatalog] = useState<{ key: string; prices: PriceMap } | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/prices", { signal: ctrl.signal })
      .then((r) => (r.ok ? (r.json() as Promise<{ prices?: PriceMap; products?: PublishedProduct[]; hidden?: string[] }>) : null))
      .then((data) => {
        // without the current catalog nothing is offered (a product off the site must not show)
        if (!data || !Array.isArray(data.products)) return;
        setPublishedProducts(data.products, Array.isArray(data.hidden) ? data.hidden : []);
        setCatalog({ key: catalogVersion(), prices: data.prices ?? {} });
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  const cartKey = [...new Set(items.map((i) => i.productId))].sort().join(",");
  const pool = useMemo(
    () => (catalog ? suggestionCandidates(items, allCatalogProducts()) : []),
    // which products are in the cart matters, not quantities or times
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cartKey, catalog?.key],
  );
  const poolIds = pool.map((p) => p.id).join(",");

  // a time that has passed is the cart's own problem (moved there, blocked at checkout) — nothing is offered for it
  const plan = cartDeliveryPlan(items);
  const planStart = slotStartOf(plan.slotLabel);
  const timeOk = Boolean(
    now && plan.date && planStart && !plan.incomplete && plan.date >= istanbulDateISO(now) && !slotHasStarted(plan.date, planStart, now),
  );
  const scope = context && timeOk ? JSON.stringify([context, plan.date, plan.slotLabel]) : null;

  // which candidates the branch can prepare for that day (stock, lead time, product offered there)
  const [answer, setAnswer] = useState<{ scope: string; available: Set<string> } | null>(null);
  useEffect(() => {
    if (!scope || !poolIds) return;
    const [ctx, date] = JSON.parse(scope) as [DeliveryContext, string];
    const ctrl = new AbortController();
    fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "catalog", context: ctx, date, items: poolIds.split(",").map((productId) => ({ productId, quantity: 1 })) }),
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? (r.json() as Promise<{ products?: Record<string, CatalogAvailabilityVerdict> }>) : null))
      .then((data) => {
        if (!data) return;
        const available = new Set(Object.entries(data.products ?? {}).filter(([, v]) => v.available).map(([id]) => id));
        setAnswer({ scope, available });
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [scope, poolIds]);

  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
  }, []);
  const onAdded = (name: string, date: string, slotLabel: string) => {
    setNotice(`${name} sepetinize eklendi. Gönderim zamanınız değişmedi: ${dateSlotText(date, slotLabel)}.`);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 6000);
  };

  // an answer for another address / time is never used; while the cart changes the last one for this scope stays
  const shown =
    context && catalog && answer && answer.scope === scope
      ? pool.filter((p) => answer.available.has(p.id)).slice(0, SUGGESTION_LIMIT)
      : [];

  const status = (
    <p aria-live="polite" className={notice ? "mt-2 font-sans text-[12.5px] leading-relaxed text-burgundy" : "sr-only"}>
      {notice}
    </p>
  );

  if (shown.length === 0 || !context || !catalog) return notice ? <div className={className}>{status}</div> : null;

  return (
    <section aria-labelledby={titleId} className={className}>
      <h2 id={titleId} className="font-serif text-[20px] font-semibold leading-tight text-burgundy md:text-[22px]">
        Siparişinize eşlik etsin
      </h2>
      <p className="mt-1 font-sans text-[12.5px] leading-relaxed text-warm-brown">
        Siparişinizle aynı gönderim zamanında hazırlanabilecek lezzetler.
      </p>
      {status}
      <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {shown.map((p) => (
          <SuggestionCard
            key={p.id}
            product={p}
            prices={catalog.prices}
            context={context}
            linkToProduct={linkToProducts}
            onAdded={onAdded}
          />
        ))}
      </ul>
    </section>
  );
}
