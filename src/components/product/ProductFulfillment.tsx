"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDelivery } from "@/lib/delivery/context";
import { deliverableDistricts, deliverableNeighborhoods } from "@/lib/delivery/zones";
import { pickupBranches } from "@/lib/branch";
import { getProductAvailability, reasonMessage, type AvailabilityResult } from "@/lib/availability";

export type FulfillmentSelection = {
  /** enough context is set + a valid slot is chosen */
  canAddToCart: boolean;
  branchId: string | null;
  branchName: string | null;
  deliveryType: "delivery" | "pickup";
  date: string | null;
  slotId: string | null;
  slotLabel: string | null;
  deliveryFee: number;
};

const EMPTY: FulfillmentSelection = {
  canAddToCart: false,
  branchId: null,
  branchName: null,
  deliveryType: "delivery",
  date: null,
  slotId: null,
  slotLabel: null,
  deliveryFee: 0,
};

const DAY_TR = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

function relativeLabel(iso: string, todayISO: string, tomorrowISO: string): string {
  if (iso === todayISO) return "Bugün";
  if (iso === tomorrowISO) return "Yarın";
  const [, m, d] = iso.split("-").map(Number);
  const wd = new Date(iso + "T12:00:00").getDay();
  return `${DAY_TR[wd]} ${d}.${String(m).padStart(2, "0")}`;
}

const toISO = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export function ProductFulfillment({
  productId,
  productSlug,
  variantId,
  quantity,
  onChange,
}: {
  productId: string;
  productSlug: string;
  variantId: string | null;
  quantity: number;
  onChange: (sel: FulfillmentSelection) => void;
}) {
  const { context, isResolved, branchName, setFulfillmentType, setDeliveryLocation, setPickupBranch } =
    useDelivery();

  const [district, setDistrict] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const todayISO = toISO(today);
  const tomorrowISO = toISO(new Date(today.getTime() + 86_400_000));

  // Optimistic client compute for the first paint…
  const clientAvailability = useMemo(
    () =>
      getProductAvailability({
        productId,
        productSlug,
        variantId,
        quantity,
        context,
        date: selectedDate ?? undefined,
        now: new Date(),
      }),
    [productId, productSlug, variantId, quantity, context, selectedDate],
  );

  // …then the server verdict (reservation- + ops-panel-override-aware) wins.
  const [serverAvailability, setServerAvailability] = useState<AvailabilityResult | null>(null);
  useEffect(() => {
    if (!isResolved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setServerAvailability(null);
      return;
    }
    const ctrl = new AbortController();
    const id = setTimeout(() => {
      fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "product",
          productId,
          productSlug,
          variantId,
          quantity,
          context,
          date: selectedDate ?? undefined,
        }),
        signal: ctrl.signal,
      })
        .then((r) => r.json())
        .then((data: AvailabilityResult) => setServerAvailability(data))
        .catch(() => {});
    }, 120);
    return () => {
      ctrl.abort();
      clearTimeout(id);
    };
  }, [isResolved, productId, productSlug, variantId, quantity, context, selectedDate]);

  const availability: AvailabilityResult = serverAvailability ?? clientAvailability;

  // keep a valid date selected once the branch resolves
  useEffect(() => {
    if (!isResolved) return;
    if (selectedDate && availability.dates.some((d) => d.date === selectedDate)) return;
    const first = availability.availableDates[0] ?? availability.dates[0]?.date ?? todayISO;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedDate(first);
    setSelectedSlotId(null);
  }, [isResolved, availability, selectedDate, todayISO]);

  // publish selection upward
  useEffect(() => {
    const slot = availability.slots.find((s) => s.slotId === selectedSlotId && s.available) ?? null;
    onChange(
      slot
        ? {
            canAddToCart: availability.available && Boolean(availability.branchId),
            branchId: availability.branchId,
            branchName: availability.branchName,
            deliveryType: context.fulfillmentType,
            date: availability.requestedDate,
            slotId: slot.slotId,
            slotLabel: slot.label,
            deliveryFee: availability.deliveryFee,
          }
        : { ...EMPTY, branchId: availability.branchId, branchName: availability.branchName, deliveryType: context.fulfillmentType },
    );
  }, [availability, selectedSlotId, context.fulfillmentType, onChange]);

  const districts = useMemo(() => deliverableDistricts(), []);
  const neighborhoods = useMemo(
    () => (district ? deliverableNeighborhoods(district) : []),
    [district],
  );
  const branches = useMemo(() => pickupBranches(), []);

  const submitLocation = (d: string, n: string) => {
    if (d && n) setDeliveryLocation(d, n);
  };

  const dateOptions = availability.dates.slice(0, 7);
  const earliest = availability.earliestAvailableSlot;
  const showDeadEnd =
    isResolved &&
    !availability.available &&
    availability.availableDates.length > 0 &&
    (selectedDate === todayISO || selectedDate == null);

  return (
    <div className="rounded-lg border border-sand-light bg-cream-light p-4 md:p-5">
      <p className="font-sans text-[13px] font-semibold text-espresso">Teslimat</p>

      {/* fulfilment type */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(["delivery", "pickup"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setFulfillmentType(t);
              setDistrict("");
              setNeighborhood("");
              setSelectedDate(null);
              setSelectedSlotId(null);
            }}
            className={`rounded-md border px-3 py-2 font-sans text-[13px] font-medium transition-colors ${
              context.fulfillmentType === t
                ? "border-burgundy bg-burgundy/[0.05] text-burgundy"
                : "border-sand text-warm-brown hover:border-burgundy/40"
            }`}
          >
            {t === "delivery" ? "Adrese Teslim" : "Mağazadan Teslim"}
          </button>
        ))}
      </div>

      {/* delivery: location */}
      {context.fulfillmentType === "delivery" && (
        <div className="mt-3">
          {isResolved ? (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-[13px] text-warm-brown">
              <span className="font-medium text-espresso">
                {context.neighborhood}, {context.district}
              </span>
              <span aria-hidden>·</span>
              <span>{branchName} şubesinden hazırlanır</span>
              <button
                type="button"
                onClick={() => {
                  setFulfillmentType("delivery");
                  setDistrict("");
                  setNeighborhood("");
                }}
                className="font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-2 hover:decoration-burgundy"
              >
                Değiştir
              </button>
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setNeighborhood("");
                }}
                aria-label="İlçe"
                className="h-10 rounded-md border border-sand bg-cream-light px-2.5 font-sans text-[13.5px] text-espresso focus:border-burgundy focus:outline-none"
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
                onChange={(e) => {
                  setNeighborhood(e.target.value);
                  submitLocation(district, e.target.value);
                }}
                disabled={!district}
                aria-label="Mahalle"
                className="h-10 rounded-md border border-sand bg-cream-light px-2.5 font-sans text-[13.5px] text-espresso focus:border-burgundy focus:outline-none disabled:opacity-50"
              >
                <option value="">Mahalle seçin</option>
                {neighborhoods.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          )}
          {district && !isResolved && neighborhood && (
            <p className="mt-2 font-sans text-[12px] text-chocolate-light">
              {reasonMessage("DELIVERY_ZONE_NOT_FOUND")}
            </p>
          )}
        </div>
      )}

      {/* pickup: branch */}
      {context.fulfillmentType === "pickup" && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {branches.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setPickupBranch(b.id);
                setSelectedDate(null);
                setSelectedSlotId(null);
              }}
              className={`rounded-md border px-2 py-2 font-sans text-[12.5px] font-medium transition-colors ${
                context.branchId === b.id
                  ? "border-burgundy bg-burgundy/[0.05] text-burgundy"
                  : "border-sand text-warm-brown hover:border-burgundy/40"
              }`}
            >
              {b.name.replace("Funda 1959 ", "")}
            </button>
          ))}
        </div>
      )}

      {/* availability */}
      {!isResolved ? (
        <p className="mt-3 font-sans text-[12.5px] leading-relaxed text-taupe">
          {context.fulfillmentType === "delivery"
            ? "Teslimat gününü ve saatini görmek için ilçe ve mahalle seçin."
            : "Teslim alma gününü görmek için bir mağaza seçin."}
        </p>
      ) : availability.reason === "PRODUCT_DISABLED_AT_BRANCH" ||
        availability.reason === "OUT_OF_STOCK" ? (
        <div className="mt-3 rounded-md border border-chocolate-light/30 bg-chocolate-light/[0.05] px-3 py-2.5">
          <p className="font-sans text-[13px] font-medium text-chocolate-light">
            {reasonMessage(availability.reason)}
          </p>
          <Link
            href="/hizli-siparis"
            className="mt-1 inline-flex font-sans text-[12.5px] font-semibold text-burgundy hover:text-chocolate-light"
          >
            Bu bölgede uygun ürünleri gör →
          </Link>
        </div>
      ) : (
        <>
          {/* dead-end nudge */}
          {showDeadEnd && earliest && (
            <div className="mt-3 rounded-md border border-burgundy/15 bg-burgundy/[0.03] px-3 py-2.5">
              <p className="font-sans text-[13px] text-warm-brown">
                Bu ürün {selectedDate === todayISO ? "bugün" : "seçtiğiniz gün"} teslimata uygun değil.
              </p>
              <p className="mt-0.5 font-sans text-[12.5px] text-taupe">
                En erken {relativeLabel(earliest.date, todayISO, tomorrowISO)} · {earliest.label}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(earliest.date);
                    setSelectedSlotId(earliest.slotId);
                  }}
                  className="font-sans text-[12.5px] font-semibold text-burgundy hover:text-chocolate-light"
                >
                  {relativeLabel(earliest.date, todayISO, tomorrowISO)} için devam et
                </button>
                <Link
                  href="/hizli-siparis?availableToday=1"
                  className="font-sans text-[12.5px] font-semibold text-taupe underline decoration-taupe/40 underline-offset-2 hover:text-burgundy"
                >
                  Bugün teslim edilebilenler
                </Link>
              </div>
            </div>
          )}

          {/* date chips */}
          <div className="mt-3">
            <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-burgundy/50">
              Teslimat günü
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {dateOptions.map((d) => {
                const on = d.date === availability.requestedDate;
                return (
                  <button
                    key={d.date}
                    type="button"
                    disabled={!d.available}
                    title={d.available ? undefined : reasonMessage(d.reason)}
                    onClick={() => {
                      setSelectedDate(d.date);
                      setSelectedSlotId(null);
                    }}
                    className={`rounded-md border px-2.5 py-1.5 font-sans text-[12.5px] font-medium transition-colors ${
                      on
                        ? "border-burgundy bg-burgundy/[0.06] text-burgundy"
                        : d.available
                          ? "border-sand text-warm-brown hover:border-burgundy/40"
                          : "cursor-not-allowed border-sand/60 text-taupe/50 line-through"
                    }`}
                  >
                    {relativeLabel(d.date, todayISO, tomorrowISO)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* slot chips */}
          <div className="mt-3">
            <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-burgundy/50">
              Teslimat saati
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {availability.slots.map((s) => (
                <button
                  key={s.slotId}
                  type="button"
                  disabled={!s.available}
                  title={s.available ? undefined : reasonMessage(s.reason)}
                  onClick={() => setSelectedSlotId(s.slotId)}
                  className={`rounded-md border px-2.5 py-1.5 font-sans text-[12.5px] font-medium transition-colors ${
                    selectedSlotId === s.slotId && s.available
                      ? "border-burgundy bg-burgundy/[0.06] text-burgundy"
                      : s.available
                        ? "border-sand text-warm-brown hover:border-burgundy/40"
                        : "cursor-not-allowed border-sand/60 text-taupe/45 line-through"
                  }`}
                >
                  {s.label}
                </button>
              ))}
              {availability.slots.length === 0 && (
                <span className="font-sans text-[12.5px] text-taupe">
                  {reasonMessage(availability.reason)}
                </span>
              )}
            </div>
          </div>

          {availability.deliveryFee > 0 && (
            <p className="mt-3 font-sans text-[12px] text-taupe">
              Teslimat ücreti: ₺{availability.deliveryFee}
            </p>
          )}
        </>
      )}
    </div>
  );
}
