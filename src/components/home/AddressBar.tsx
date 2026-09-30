"use client";

import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/shared/Container";
import { useDelivery } from "@/lib/delivery/context";
import { AddressPicker, NotServedNotice } from "@/components/delivery/AddressPicker";
import { SampleDataNote } from "@/components/delivery/SampleDataNote";

function PinIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0C18.5 15.4 12 21 12 21zm0-8.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
      />
    </svg>
  );
}

/**
 * Address entry, directly under the hero. District -> neighbourhood; the
 * serving branch is derived from the zone map in the shared context and
 * drives stock and delivery on every page. Nothing is pre-selected; a valid
 * stored address is restored by the context.
 */
export function AddressBar() {
  const { context, isHydrated, addressStatus, setFulfillmentType } = useDelivery();
  const [editing, setEditing] = useState(false);

  const hasAddress = addressStatus !== "none";
  const isPickup = context.fulfillmentType === "pickup";
  const showPicker = isHydrated && !isPickup && (!hasAddress || editing);
  const location = hasAddress ? `${context.district}, ${context.neighborhood}` : "";

  return (
    <section aria-labelledby="address-bar-title" className="bg-cream-light py-6 lg:pb-8 lg:pt-6">
      <Container>
        <div className="rounded-2xl border border-sand-light bg-white/50 px-5 py-6 shadow-[0_22px_48px_-36px_rgba(110,34,48,0.45)] sm:px-7 lg:flex lg:items-center lg:gap-10 lg:px-8 lg:py-6">
          <div className="flex items-center gap-4 lg:w-[38%] lg:shrink-0">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-burgundy/[0.07] text-burgundy">
              <PinIcon />
            </span>
            <div>
              <h2 id="address-bar-title" className="font-serif text-[21px] font-semibold leading-tight text-burgundy xl:text-[23px]">
                Adresinizi girin
              </h2>
              <p className="mt-1 font-sans text-[13.5px] leading-snug text-warm-brown">
                Size uygun ürünleri ve teslimat seçeneklerini adresinize göre gösterelim.
              </p>
            </div>
          </div>

          <div className="mt-5 min-w-0 flex-1 lg:mt-0">
            {!isHydrated ? (
              // reserve the space until the stored choice is read, without claiming either state
              <div aria-hidden className="h-12 rounded-lg border border-sand-light bg-cream-light/60" />
            ) : showPicker ? (
              <div>
                <AddressPicker idPrefix="bar" layout="row" onDone={() => setEditing(false)} />
                <div className="mt-2 flex min-h-[20px] flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <p className="font-sans text-[12.5px] text-taupe">Açık adresinizi sipariş adımında alacağız.</p>
                  {editing && hasAddress && (
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="font-sans text-[12.5px] font-semibold text-warm-brown underline decoration-warm-brown/30 underline-offset-2 hover:text-burgundy"
                    >
                      Vazgeç
                    </button>
                  )}
                </div>
              </div>
            ) : isPickup ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sand-light bg-cream-light px-4 py-3">
                <p className="font-sans text-[14px] text-espresso">Mağazadan teslim alacaksınız.</p>
                <button
                  type="button"
                  onClick={() => setFulfillmentType("delivery")}
                  className="font-sans text-[13px] font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-4 hover:decoration-burgundy"
                >
                  Adrese teslim et
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 rounded-xl border border-sand-light bg-cream-light px-4 py-3">
                  <PinIcon className="h-5 w-5 shrink-0 text-burgundy" />
                  <p className="min-w-0 flex-1 truncate font-sans text-[15px] font-semibold text-espresso">{location}</p>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="shrink-0 px-1 py-2 font-sans text-[13.5px] font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-4 transition-colors hover:decoration-burgundy"
                  >
                    Değiştir
                  </button>
                </div>
                <div className="mt-2 flex min-h-[20px] flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1">
                  {addressStatus === "unserved" ? (
                    <NotServedNotice />
                  ) : (
                    <>
                      <p className="font-sans text-[12.5px] text-warm-brown">
                        Ürünler adresinize göre gösteriliyor.{" "}
                        <Link
                          href="/hizli-siparis"
                          className="font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-2 hover:decoration-burgundy"
                        >
                          Bölgenizdeki ürünleri görün
                        </Link>
                      </p>
                      <SampleDataNote about="teslimat bölgeleri ve teslimat bilgileri" />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
