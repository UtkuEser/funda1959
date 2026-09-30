"use client";

import { useMemo } from "react";
import { useDelivery } from "@/lib/delivery/context";
import { pickupBranches } from "@/lib/branch";

/**
 * Pickup only: the customer chooses which store to collect from. (For
 * delivery the branch is never chosen — it follows from the address.)
 */
export function PickupStorePicker({ className = "" }: { className?: string }) {
  const { context, selectPickupBranch } = useDelivery();
  const stores = useMemo(() => pickupBranches(), []);
  return (
    <div role="group" aria-label="Teslim alınacak mağaza" className={`flex flex-wrap gap-2 ${className}`}>
      {stores.map((b) => {
        const on = context.branchId === b.id;
        return (
          <button
            key={b.id}
            type="button"
            aria-pressed={on}
            onClick={() => selectPickupBranch(b.id)}
            className={`min-h-[40px] rounded-md border px-3 py-1.5 font-sans text-[13px] font-medium transition-colors ${
              on ? "border-burgundy bg-burgundy/[0.05] text-burgundy" : "border-sand text-warm-brown hover:border-burgundy/40"
            }`}
          >
            {b.shortName}
          </button>
        );
      })}
    </div>
  );
}
