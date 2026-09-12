"use client";

/**
 * Session-wide delivery context.
 *
 * Holds the customer's fulfilment choice (delivery + location, or pickup +
 * branch) for the whole visit. Persisted to sessionStorage as a convenience —
 * the domain engines never read storage themselves, they take a plain
 * `DeliveryContext` object.
 *
 * TODO: hydrate from the customer's default address once Supabase Auth lands.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  EMPTY_DELIVERY_CONTEXT,
  type DeliveryContext as DeliveryContextValue,
  type FulfillmentType,
} from "@/lib/availability/types";
import { resolveZone } from "./zones";
import { getBranch } from "@/lib/branch";

const STORAGE_KEY = "funda-delivery-context";

type DeliveryContextApi = {
  context: DeliveryContextValue;
  /** true once the customer has enough info to get real availability */
  isResolved: boolean;
  branchName: string | null;
  /** increments whenever the resolved branch changes — cue for cart re-check */
  branchChangeToken: number;
  setFulfillmentType: (type: FulfillmentType) => void;
  setDeliveryLocation: (district: string, neighborhood: string) => void;
  setPickupBranch: (branchId: string) => void;
  reset: () => void;
};

const Ctx = createContext<DeliveryContextApi | null>(null);

function readStored(): DeliveryContextValue {
  if (typeof window === "undefined") return EMPTY_DELIVERY_CONTEXT;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DELIVERY_CONTEXT;
    const parsed = JSON.parse(raw) as Partial<DeliveryContextValue>;
    return { ...EMPTY_DELIVERY_CONTEXT, ...parsed };
  } catch {
    return EMPTY_DELIVERY_CONTEXT;
  }
}

function resolveDelivery(district: string, neighborhood: string): Partial<DeliveryContextValue> {
  const zone = resolveZone(district, neighborhood);
  return {
    fulfillmentType: "delivery",
    district,
    neighborhood,
    deliveryZoneId: zone?.id ?? null,
    branchId: zone?.branchId ?? null,
  };
}

export function DeliveryProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<DeliveryContextValue>(EMPTY_DELIVERY_CONTEXT);
  const [branchChangeToken, setBranchChangeToken] = useState(0);
  const lastBranch = useRef<string | null>(null);
  const hydrated = useRef(false);

  // hydrate once on mount (client only) — avoids an SSR/client mismatch since
  // sessionStorage is unavailable during server render.
  useEffect(() => {
    const stored = readStored();
    hydrated.current = true;
    lastBranch.current = stored.branchId;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContext(stored);
  }, []);

  const commit = useCallback((next: DeliveryContextValue) => {
    setContext(next);
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable — session-only, non-fatal */
      }
    }
    if (hydrated.current && next.branchId !== lastBranch.current) {
      lastBranch.current = next.branchId;
      setBranchChangeToken((t) => t + 1);
    }
  }, []);

  const setFulfillmentType = useCallback(
    (type: FulfillmentType) => {
      commit(
        type === "pickup"
          ? { ...EMPTY_DELIVERY_CONTEXT, fulfillmentType: "pickup", branchId: context.branchId }
          : { ...EMPTY_DELIVERY_CONTEXT, fulfillmentType: "delivery" },
      );
    },
    [commit, context.branchId],
  );

  const setDeliveryLocation = useCallback(
    (district: string, neighborhood: string) => {
      commit({ ...EMPTY_DELIVERY_CONTEXT, ...resolveDelivery(district, neighborhood) });
    },
    [commit],
  );

  const setPickupBranch = useCallback(
    (branchId: string) => {
      commit({ ...EMPTY_DELIVERY_CONTEXT, fulfillmentType: "pickup", branchId });
    },
    [commit],
  );

  const reset = useCallback(() => commit(EMPTY_DELIVERY_CONTEXT), [commit]);

  const value = useMemo<DeliveryContextApi>(() => {
    const branch = getBranch(context.branchId);
    const isResolved =
      context.fulfillmentType === "pickup"
        ? Boolean(context.branchId)
        : Boolean(context.district && context.neighborhood && context.branchId);
    return {
      context,
      isResolved,
      branchName: branch?.name ?? null,
      branchChangeToken,
      setFulfillmentType,
      setDeliveryLocation,
      setPickupBranch,
      reset,
    };
  }, [context, branchChangeToken, setFulfillmentType, setDeliveryLocation, setPickupBranch, reset]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDelivery(): DeliveryContextApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDelivery must be used within <DeliveryProvider>");
  return ctx;
}
