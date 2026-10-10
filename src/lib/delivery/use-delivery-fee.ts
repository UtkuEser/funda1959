"use client";

import { useEffect, useState } from "react";
import { reasonMessage, type ReasonCode } from "@/lib/availability/reasons";
import type { DeliveryFeeAnswer } from "./fees";

/**
 * The delivery fee the cart and checkout show (SUPABASE_PLAN.md, D15), asked
 * from the server for the selected address (POST /api/delivery-fee) — the
 * zone list in the browser carries no fees. Pickup is always ₺0. A fee that
 * is not set, an address outside every zone or an unreadable fee store is a
 * "refused" answer with the customer-facing reason; never a guessed 0.
 */
export type DeliveryFeeView =
  | { status: "pickup" }
  | { status: "no_address" }
  | { status: "loading" }
  | { status: "ready"; state: "paid" | "free"; fee: number; branchName: string }
  | { status: "refused"; reason: ReasonCode | null; message: string };

/** the fee to add to the products, when it is known */
export function feeAmount(view: DeliveryFeeView): number | null {
  return view.status === "pickup" ? 0 : view.status === "ready" ? view.fee : null;
}

export function useDeliveryFee(
  fulfillmentType: "delivery" | "pickup",
  district: string | null | undefined,
  neighborhood: string | null | undefined,
  /** false until the stored address has been read (no request for the empty default) */
  enabled = true,
): DeliveryFeeView {
  const key = enabled && fulfillmentType === "delivery" && district && neighborhood ? `${district}|${neighborhood}` : null;
  const [answer, setAnswer] = useState<{ key: string; view: DeliveryFeeView } | null>(null);

  useEffect(() => {
    if (!key) return;
    const ctrl = new AbortController();
    const [d, n] = key.split("|");
    fetch("/api/delivery-fee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ district: d, neighborhood: n }),
      signal: ctrl.signal,
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as DeliveryFeeAnswer | null;
        const view: DeliveryFeeView =
          data?.ok === true
            ? { status: "ready", state: data.state, fee: data.fee, branchName: data.branchName }
            : {
                status: "refused",
                reason: data?.reason ?? "DELIVERY_INFO_UNAVAILABLE",
                message: data?.error || reasonMessage("DELIVERY_INFO_UNAVAILABLE"),
              };
        setAnswer({ key, view });
      })
      .catch(() => {
        if (ctrl.signal.aborted) return;
        setAnswer({ key, view: { status: "refused", reason: "DELIVERY_INFO_UNAVAILABLE", message: reasonMessage("DELIVERY_INFO_UNAVAILABLE") } });
      });
    return () => ctrl.abort();
  }, [key]);

  if (!enabled) return { status: "loading" };
  if (fulfillmentType === "pickup") return { status: "pickup" };
  if (!key) return { status: "no_address" };
  return answer?.key === key ? answer.view : { status: "loading" };
}
