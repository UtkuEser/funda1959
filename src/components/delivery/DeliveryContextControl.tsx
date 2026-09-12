"use client";

/**
 * Compact, reusable "where + how" control backed by the session DeliveryContext.
 * Used on /hizli-siparis, /sepet and /checkout. Writes straight to the context;
 * consumers read `useDelivery()` for the resolved branch.
 */

import { useState } from "react";
import { useDelivery } from "@/lib/delivery/context";
import { deliverableDistricts, deliverableNeighborhoods } from "@/lib/delivery/zones";
import { pickupBranches } from "@/lib/branch";
import { reasonMessage } from "@/lib/availability";

export function DeliveryContextControl({ className = "" }: { className?: string }) {
  const { context, isResolved, branchName, setFulfillmentType, setDeliveryLocation, setPickupBranch } =
    useDelivery();

  const [editing, setEditing] = useState(false);
  const [district, setDistrict] = useState(context.district ?? "");
  const [neighborhood, setNeighborhood] = useState(context.neighborhood ?? "");

  const districts = deliverableDistricts();
  const neighborhoods = district ? deliverableNeighborhoods(district) : [];
  const branches = pickupBranches();

  const showForm = editing || !isResolved;

  return (
    <div
      className={`rounded-lg border border-sand-light bg-cream-light px-4 py-3 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-center gap-1.5">
          {(["delivery", "pickup"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setFulfillmentType(t);
                setDistrict("");
                setNeighborhood("");
                setEditing(true);
              }}
              className={`rounded-md px-2.5 py-1 font-sans text-[12.5px] font-medium transition-colors ${
                context.fulfillmentType === t
                  ? "bg-burgundy/[0.08] text-burgundy"
                  : "text-taupe hover:text-burgundy"
              }`}
            >
              {t === "delivery" ? "Adrese Teslim" : "Mağazadan Teslim"}
            </button>
          ))}
        </div>

        {isResolved && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="font-sans text-[12.5px] font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-2 hover:decoration-burgundy"
          >
            Değiştir
          </button>
        )}
      </div>

      {isResolved && !editing ? (
        <p className="mt-1.5 font-sans text-[13px] text-warm-brown">
          {context.fulfillmentType === "delivery" ? (
            <>
              <span className="font-medium text-espresso">
                {context.neighborhood}, {context.district}
              </span>{" "}
              · {branchName} şubesi
            </>
          ) : (
            <>
              <span className="font-medium text-espresso">{branchName}</span> · mağazadan teslim
            </>
          )}
        </p>
      ) : showForm && context.fulfillmentType === "delivery" ? (
        <div className="mt-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setNeighborhood("");
              }}
              aria-label="İlçe"
              className="h-9 rounded-md border border-sand bg-cream-light px-2 font-sans text-[13px] text-espresso focus:border-burgundy focus:outline-none"
            >
              <option value="">İlçe seçin</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={neighborhood}
              disabled={!district}
              onChange={(e) => {
                const n = e.target.value;
                setNeighborhood(n);
                if (district && n) {
                  setDeliveryLocation(district, n);
                  setEditing(false);
                }
              }}
              aria-label="Mahalle"
              className="h-9 rounded-md border border-sand bg-cream-light px-2 font-sans text-[13px] text-espresso focus:border-burgundy focus:outline-none disabled:opacity-50"
            >
              <option value="">Mahalle seçin</option>
              {neighborhoods.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          {district && neighborhood && !isResolved && (
            <p className="mt-1.5 font-sans text-[12px] text-chocolate-light">
              {reasonMessage("DELIVERY_ZONE_NOT_FOUND")}
            </p>
          )}
        </div>
      ) : showForm ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {branches.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setPickupBranch(b.id);
                setEditing(false);
              }}
              className={`rounded-md border px-2.5 py-1.5 font-sans text-[12.5px] font-medium transition-colors ${
                context.branchId === b.id
                  ? "border-burgundy bg-burgundy/[0.05] text-burgundy"
                  : "border-sand text-warm-brown hover:border-burgundy/40"
              }`}
            >
              {b.name.replace("Funda 1959 ", "")}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
