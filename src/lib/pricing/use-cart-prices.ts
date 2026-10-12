"use client";

import { useEffect, useState } from "react";
import { repriceItems, type CartItem } from "../cart";

/**
 * Keeps the cart's unit prices current (SUPABASE_PLAN.md, D5): the cart
 * stores the price a line was added at, so the cart, quick order and checkout
 * ask the server (POST /api/prices — the same pricing as quotes and orders)
 * and update the lines. "failed": the prices could not be confirmed; the
 * payment step prices the order itself and takes none without a valid quote.
 */
export type CartPriceStatus = "checking" | "ok" | "failed";

export function useCartPriceSync(items: CartItem[]): CartPriceStatus {
  // which lines to ask about — prices themselves are not part of the key
  const key = JSON.stringify([...new Set(items.map((i) => `${i.productId}|${i.selectedVariant ?? ""}`))].sort());
  const [answer, setAnswer] = useState<{ key: string; status: CartPriceStatus } | null>(null);

  useEffect(() => {
    const lines = (JSON.parse(key) as string[]).map((k) => {
      const [productId, variantId] = k.split("|");
      return { productId, variantId: variantId || null };
    });
    if (lines.length === 0) return;
    const ctrl = new AbortController();
    fetch("/api/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines }),
      signal: ctrl.signal,
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as {
          ok?: boolean;
          lines?: { productId: string; variantId: string | null; unitPrice: number | null }[];
        } | null;
        if (!res.ok || !data?.ok || !data.lines) {
          setAnswer({ key, status: "failed" });
          return;
        }
        const current = new Map(data.lines.map((l) => [`${l.productId}|${l.variantId ?? ""}`, l.unitPrice]));
        const updates: Record<string, number> = {};
        for (const item of items) {
          const price = current.get(`${item.productId}|${item.selectedVariant ?? ""}`);
          if (typeof price === "number" && price > 0 && price !== item.unitPrice) updates[item.id] = price;
        }
        repriceItems(updates);
        setAnswer({ key, status: "ok" });
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setAnswer({ key, status: "failed" });
      });
    return () => ctrl.abort();
    // asks again only when the set of lines changes; `items` is read for its line ids
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return answer?.key === key ? answer.status : "checking";
}
