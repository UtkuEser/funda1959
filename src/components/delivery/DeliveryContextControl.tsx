"use client";

/**
 * Compact "where + how" control backed by the session DeliveryContext. Used
 * on /hizli-siparis, /sepet and /checkout. Delivery: the address comes from
 * the shared picker and the branch follows from it. Pickup: choose the store.
 */

import { useDelivery } from "@/lib/delivery/context";
import { SampleDataNote } from "./SampleDataNote";
import { NotServedNotice } from "./AddressPicker";
import { PickupStorePicker } from "./PickupStorePicker";

export function DeliveryContextControl({ className = "" }: { className?: string }) {
  const { context, addressStatus, isResolved, branch, setFulfillmentType, openSelector } = useDelivery();
  const isDelivery = context.fulfillmentType === "delivery";

  return (
    <div className={`rounded-lg border border-sand-light bg-cream-light px-4 py-3 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-center gap-1.5">
          {(["delivery", "pickup"] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={context.fulfillmentType === t}
              onClick={() => t !== context.fulfillmentType && setFulfillmentType(t)}
              className={`rounded-md px-2.5 py-1 font-sans text-[12.5px] font-medium transition-colors ${
                context.fulfillmentType === t ? "bg-burgundy/[0.08] text-burgundy" : "text-taupe hover:text-burgundy"
              }`}
            >
              {t === "delivery" ? "Adrese Teslim" : "Mağazadan Teslim"}
            </button>
          ))}
        </div>

        {isDelivery && addressStatus !== "none" && (
          <button
            type="button"
            onClick={() => openSelector()}
            className="font-sans text-[12.5px] font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-2 hover:decoration-burgundy"
          >
            Değiştir
          </button>
        )}
      </div>

      {isDelivery ? (
        addressStatus === "none" ? (
          <button
            type="button"
            onClick={() => openSelector()}
            className="mt-2 inline-flex items-center gap-2 font-sans text-[13px] font-semibold text-burgundy hover:text-chocolate-light"
          >
            Adresinizi girin <span aria-hidden>→</span>
          </button>
        ) : (
          <>
            <p className="mt-1.5 font-sans text-[13px] text-warm-brown">
              <span className="font-medium text-espresso">
                {context.district}, {context.neighborhood}
              </span>
              {branch && <> · {branch.shortName} şubesinden hazırlanır</>}
            </p>
            {addressStatus === "unserved" ? <NotServedNotice className="mt-1" /> : <SampleDataNote className="mt-1" />}
          </>
        )
      ) : (
        <>
          <PickupStorePicker className="mt-2" />
          {isResolved && branch && (
            <p className="mt-1.5 font-sans text-[13px] text-warm-brown">
              <span className="font-medium text-espresso">{branch.shortName}</span> · mağazadan teslim
            </p>
          )}
          {isResolved && <SampleDataNote className="mt-1" />}
        </>
      )}
    </div>
  );
}
