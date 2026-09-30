"use client";

/**
 * Session-wide shopping context.
 *
 * Address first: the customer enters district + neighbourhood and the serving
 * branch is derived from the delivery zones (`resolveZone`) — never chosen,
 * never guessed. An address with no zone is kept but has no branch
 * ("not served"). Pickup is the exception: there the customer picks the
 * store. Stock and delivery options everywhere (catalog, quick order, product
 * page, cart) are evaluated for the resulting branch.
 *
 * Persisted to localStorage, so reloads and later visits restore it; a
 * stored choice is re-derived on load, so it can't outlive the zone/branch
 * data. (Earlier builds kept it in sessionStorage — migrated once.)
 * Also owns the open/closed state of the shared address picker dialog.
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
import { deliverableDistricts, deliverableNeighborhoods, resolveZone } from "./zones";
import { getBranch, type Branch } from "@/lib/branch";

const STORAGE_KEY = "funda-delivery-context";

/** why the picker was opened — lets it explain the interruption */
export type SelectorReason = "cart" | "stock";

/** delivery address state: nothing entered / served by a branch / outside every zone */
export type AddressStatus = "none" | "served" | "unserved";

type DeliveryContextApi = {
  context: DeliveryContextValue;
  /** false until the stored choice has been read on the client */
  isHydrated: boolean;
  /** true once a branch is known — branch-specific stock can be shown */
  isResolved: boolean;
  addressStatus: AddressStatus;
  branch: Branch | null;
  branchName: string | null;
  /** increments whenever the resolved branch changes — cue for cart re-check */
  branchChangeToken: number;
  /** delivery: set the address; the branch follows from the zone map */
  setDeliveryAddress: (district: string, neighborhood: string) => void;
  /** delivery: a new district clears the neighbourhood (null clears both) */
  setDeliveryDistrict: (district: string | null) => void;
  /** pickup: choose the store */
  selectPickupBranch: (branchId: string) => void;
  setFulfillmentType: (type: FulfillmentType) => void;
  reset: () => void;
  selector: { open: boolean; reason: SelectorReason | null };
  openSelector: (reason?: SelectorReason) => void;
  closeSelector: () => void;
};

const Ctx = createContext<DeliveryContextApi | null>(null);

/**
 * Re-derives the branch from the rest of the context: delivery -> the zone of
 * the address (or none); pickup -> the chosen store if it still takes pickups.
 * The address is kept in both modes so switching back restores it.
 */
function derive(input: Partial<DeliveryContextValue>): DeliveryContextValue {
  const district = input.district || null;
  const neighborhood = input.neighborhood || null;

  if (input.fulfillmentType === "pickup") {
    const store = getBranch(input.branchId);
    return {
      ...EMPTY_DELIVERY_CONTEXT,
      fulfillmentType: "pickup",
      district,
      neighborhood,
      branchId: store?.active && store.pickupEnabled ? store.id : null,
    };
  }

  const zone = district && neighborhood ? resolveZone(district, neighborhood) : null;
  const branch = zone ? getBranch(zone.branchId) : null;
  const served = Boolean(zone && branch?.active && branch.deliveryEnabled);
  return {
    fulfillmentType: "delivery",
    district,
    neighborhood,
    deliveryZoneId: served ? zone!.id : null,
    branchId: served ? branch!.id : null,
  };
}

/**
 * A stored district / neighbourhood is restored only while the picker still
 * offers it; a neighbourhood that no longer belongs to its district is dropped
 * (and an unknown district drops both).
 */
function validAddress(stored: Partial<DeliveryContextValue>): Partial<DeliveryContextValue> {
  const district = stored.district && deliverableDistricts().includes(stored.district) ? stored.district : null;
  const neighborhood =
    district && stored.neighborhood && deliverableNeighborhoods(district).includes(stored.neighborhood)
      ? stored.neighborhood
      : null;
  return { ...stored, district, neighborhood };
}

function readStored(): DeliveryContextValue {
  if (typeof window === "undefined") return EMPTY_DELIVERY_CONTEXT;
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) window.localStorage.setItem(STORAGE_KEY, raw);
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
    if (!raw) return EMPTY_DELIVERY_CONTEXT;
    return derive(validAddress(JSON.parse(raw) as Partial<DeliveryContextValue>));
  } catch {
    return EMPTY_DELIVERY_CONTEXT;
  }
}

export function DeliveryProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<DeliveryContextValue>(EMPTY_DELIVERY_CONTEXT);
  const [isHydrated, setIsHydrated] = useState(false);
  const [branchChangeToken, setBranchChangeToken] = useState(0);
  const [selector, setSelector] = useState<{ open: boolean; reason: SelectorReason | null }>({
    open: false,
    reason: null,
  });
  const lastBranch = useRef<string | null>(null);
  const hydrated = useRef(false);

  // hydrate once on mount (client only) — avoids an SSR/client mismatch since
  // storage is unavailable during server render.
  useEffect(() => {
    const stored = readStored();
    hydrated.current = true;
    lastBranch.current = stored.branchId;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContext(stored);
    setIsHydrated(true);
  }, []);

  const commit = useCallback((next: DeliveryContextValue) => {
    setContext(next);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable — session-only, non-fatal */
      }
    }
    if (hydrated.current && next.branchId !== lastBranch.current) {
      lastBranch.current = next.branchId;
      setBranchChangeToken((t) => t + 1);
    }
  }, []);

  const setDeliveryAddress = useCallback(
    (district: string, neighborhood: string) => commit(derive({ fulfillmentType: "delivery", district, neighborhood })),
    [commit],
  );

  const setDeliveryDistrict = useCallback(
    (district: string | null) => commit(derive({ fulfillmentType: "delivery", district, neighborhood: null })),
    [commit],
  );

  const selectPickupBranch = useCallback(
    (branchId: string) => commit(derive({ ...context, fulfillmentType: "pickup", branchId })),
    [commit, context],
  );

  const setFulfillmentType = useCallback(
    (type: FulfillmentType) => commit(derive({ ...context, fulfillmentType: type })),
    [commit, context],
  );

  const reset = useCallback(() => commit(EMPTY_DELIVERY_CONTEXT), [commit]);

  const openSelector = useCallback(
    (reason?: SelectorReason) => setSelector({ open: true, reason: reason ?? null }),
    [],
  );
  const closeSelector = useCallback(() => setSelector({ open: false, reason: null }), []);

  const value = useMemo<DeliveryContextApi>(() => {
    const branch = getBranch(context.branchId);
    const hasAddress = Boolean(context.district && context.neighborhood);
    const addressStatus: AddressStatus = !hasAddress
      ? "none"
      : context.fulfillmentType === "delivery" && !context.branchId
        ? "unserved"
        : "served";
    return {
      context,
      isHydrated,
      isResolved: Boolean(branch),
      addressStatus,
      branch,
      branchName: branch?.name ?? null,
      branchChangeToken,
      setDeliveryAddress,
      setDeliveryDistrict,
      selectPickupBranch,
      setFulfillmentType,
      reset,
      selector,
      openSelector,
      closeSelector,
    };
  }, [
    context,
    isHydrated,
    branchChangeToken,
    setDeliveryAddress,
    setDeliveryDistrict,
    selectPickupBranch,
    setFulfillmentType,
    reset,
    selector,
    openSelector,
    closeSelector,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDelivery(): DeliveryContextApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDelivery must be used within <DeliveryProvider>");
  return ctx;
}
