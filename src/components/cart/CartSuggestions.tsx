"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { addToCart } from "@/lib/cart";
import { useCart } from "@/lib/use-cart";
import { formatTL } from "@/lib/cart-utils";
import { cartDeliveryPlan, planLineAtCartTime, type CartLinePlan } from "@/lib/cart-fulfillment";
import { SUGGESTION_LIMIT, cartHasSuggestionRule, type CartSuggestion } from "@/lib/cart-suggestions";
import type { DeliveryContext } from "@/lib/availability";
import { dateSlotText } from "@/lib/delivery/labels";
import { slotHasStarted } from "@/lib/delivery/slots";
import { istanbulDateISO } from "@/lib/time/istanbul";
import { useNow } from "@/lib/time/use-now";

/** "10:00 – 11:00" -> "10:00" */
const slotStartOf = (label: string | null) => label?.match(/(\d{2}:\d{2})/)?.[1];

type Size = CartSuggestion["sizes"][number];

/**
 * The server's answers in this tab, per cart + place + shipping time — /sepet
 * and /checkout share them, so the same cart shows its suggestions at once on
 * the next page; asked again once older than FRESH_MS.
 */
const answers = new Map<string, { at: number; suggestions: CartSuggestion[] }>();
const FRESH_MS = 10_000;

/** The place the server resolves the branch from: the address for delivery, the store for pickup. */
function placeOf(c: DeliveryContext): DeliveryContext {
  return c.fulfillmentType === "pickup"
    ? { fulfillmentType: "pickup", district: null, neighborhood: null, deliveryZoneId: null, branchId: c.branchId }
    : { fulfillmentType: "delivery", district: c.district, neighborhood: c.neighborhood, deliveryZoneId: null, branchId: null };
}

/** One of the product at the cart's shipping time, through the cart like any other line — only after the server check. */
async function addSuggestion(product: CartSuggestion, size: Size | null, context: DeliveryContext): Promise<CartLinePlan> {
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
    unitPrice: size ? size.price : product.price,
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
  product,
  context,
  linkToProduct,
  onAdded,
}: {
  product: CartSuggestion;
  context: DeliveryContext;
  linkToProduct: boolean;
  onAdded: (name: string, date: string, slotLabel: string) => void;
}) {
  // never chosen for the customer
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = product.sizes.find((s) => s.id === sizeId) ?? null;

  const add = async () => {
    setError(null);
    if (product.sizeLabel && !selected) {
      setError(`Önce ${product.sizeLabel.toLocaleLowerCase("tr")} seçin.`);
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

        {product.sizeLabel && (
          <div className="mt-2 flex flex-wrap gap-1" role="group" aria-label={product.sizeLabel}>
            {product.sizes.map((s) => {
              const on = s.id === sizeId;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setSizeId(s.id);
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

/** A card's outline while the server answers — about a card's size, so the section doesn't jump when they arrive. */
function SkeletonCard() {
  return (
    <li aria-hidden className="flex gap-3 rounded-lg border border-sand-light bg-cream-light p-3">
      <div className="h-14 w-14 shrink-0 animate-pulse rounded-md bg-sand-light motion-reduce:animate-none" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
        <div className="h-3.5 w-3/4 animate-pulse rounded bg-sand-light motion-reduce:animate-none" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-sand-light/70 motion-reduce:animate-none" />
        <div className="mt-1.5 h-8 w-[104px] animate-pulse rounded-md bg-sand-light/70 motion-reduce:animate-none" />
      </div>
    </li>
  );
}

/**
 * "Siparişinize eşlik etsin" (/sepet under the lines, /checkout before the
 * summary): up to four products that go with the cart, picked by the server
 * in one request (POST /api/cart-suggestions — published, current prices,
 * the branch's stock and the cart's shipping day). Asked as soon as the cart,
 * the place and the time are known, never holding the page; an answer is
 * only shown for the cart + place + time it was asked for (a newer question
 * cancels the older one). While it loads, card outlines hold the place.
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

  // a time that has passed is the cart's own problem (moved there, blocked at checkout) — nothing is offered for it
  const plan = cartDeliveryPlan(items);
  const planStart = slotStartOf(plan.slotLabel);
  const planKnown = Boolean(context && plan.date && planStart && !plan.incomplete);
  const timeOk = Boolean(
    planKnown && now && plan.date! >= istanbulDateISO(now) && !slotHasStarted(plan.date!, planStart!, now),
  );
  // which products are in the cart (in the order they were added) matters, not quantities or sizes
  const productIds = [...new Set(items.map((i) => i.productId))];
  const scope = timeOk && context ? JSON.stringify([placeOf(context), plan.date, plan.slotLabel]) : null;
  const key = scope ? JSON.stringify([scope, productIds]) : null;

  const [answer, setAnswer] = useState<{ key: string; scope: string; suggestions: CartSuggestion[] } | null>(null);
  useEffect(() => {
    if (!key) return;
    const cached = answers.get(key);
    if (cached && Date.now() - cached.at < FRESH_MS) return;
    const [scopeJson, ids] = JSON.parse(key) as [string, string[]];
    const [place, date] = JSON.parse(scopeJson) as [DeliveryContext, string];
    const ctrl = new AbortController();
    fetch("/api/cart-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context: place, date, items: ids.map((productId) => ({ productId })) }),
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? (r.json() as Promise<{ suggestions?: CartSuggestion[] }>) : null))
      .then((data) => {
        const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : [];
        if (data) answers.set(key, { at: Date.now(), suggestions });
        if (!ctrl.signal.aborted) setAnswer({ key, scope: scopeJson, suggestions });
      })
      .catch(() => {
        // a cancelled question changes nothing; a failed one shows no suggestions
        if (!ctrl.signal.aborted) setAnswer({ key, scope: scopeJson, suggestions: [] });
      });
    return () => ctrl.abort();
  }, [key]);

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

  // this question's answer (or the tab's earlier one for the same cart + place + time) — never one for another place or time;
  // only the cart changed (a line added / removed): the last answer, minus what is in the cart now, stays until the new one is in
  const exact = key ? (answer?.key === key ? answer.suggestions : answers.get(key)?.suggestions) : undefined;
  const carried = exact === undefined && scope && answer?.scope === scope ? answer.suggestions.filter((s) => !productIds.includes(s.id)) : [];
  const suggestions = exact ?? (carried.length > 0 ? carried : undefined);
  const shown = (suggestions ?? []).slice(0, SUGGESTION_LIMIT);
  // the answer is on its way (or the clock is about to let it go) and this cart has pairings: hold the place
  const loading = suggestions === undefined && planKnown && (now === null || timeOk) && cartHasSuggestionRule(items);

  const status = (
    <p aria-live="polite" className={notice ? "mt-2 font-sans text-[12.5px] leading-relaxed text-burgundy" : "sr-only"}>
      {notice}
    </p>
  );

  if (!context || (shown.length === 0 && !loading)) return notice ? <div className={className}>{status}</div> : null;

  return (
    <section aria-labelledby={titleId} aria-busy={loading || undefined} className={className}>
      <h2 id={titleId} className="font-serif text-[20px] font-semibold leading-tight text-burgundy md:text-[22px]">
        Siparişinize eşlik etsin
      </h2>
      <p className="mt-1 font-sans text-[12.5px] leading-relaxed text-warm-brown">
        Siparişinizle aynı gönderim zamanında hazırlanabilecek lezzetler.
      </p>
      {status}
      <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {loading
          ? Array.from({ length: SUGGESTION_LIMIT }, (_, i) => <SkeletonCard key={i} />)
          : shown.map((p) => (
              <SuggestionCard key={p.id} product={p} context={context} linkToProduct={linkToProducts} onAdded={onAdded} />
            ))}
      </ul>
    </section>
  );
}
