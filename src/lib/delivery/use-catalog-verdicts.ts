"use client";

import { useEffect, useMemo, useState } from "react";
import { useDelivery } from "./context";
import type { CatalogAvailabilityVerdict } from "@/lib/availability";

type Verdicts = Record<string, CatalogAvailabilityVerdict>;

/**
 * Server verdicts (reservations + ops-panel edits included) for a set of
 * products at the customer's current branch. Empty until an address resolves
 * to a branch; refetched whenever the location changes.
 */
export function useCatalogVerdicts(productIds: string[]): Verdicts {
  const { context, isResolved } = useDelivery();
  const key = useMemo(() => [...new Set(productIds)].sort().join(","), [productIds]);
  const [state, setState] = useState<{ for: string; verdicts: Verdicts }>({ for: "", verdicts: {} });
  const requestKey = isResolved && key ? `${JSON.stringify(context)}|${key}` : "";

  useEffect(() => {
    if (!requestKey) return;
    const ctrl = new AbortController();
    fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "catalog", context, items: key.split(",").map((productId) => ({ productId, quantity: 1 })) }),
      signal: ctrl.signal,
    })
      .then((r) => r.json() as Promise<{ products?: Verdicts }>)
      .then((data) => setState({ for: requestKey, verdicts: data.products ?? {} }))
      .catch(() => {});
    return () => ctrl.abort();
    // requestKey already encodes context + ids
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  // never show verdicts computed for a previous address
  return state.for === requestKey ? state.verdicts : {};
}
