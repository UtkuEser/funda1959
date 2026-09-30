"use client";

/**
 * The one address picker: district, then its neighbourhoods, then the
 * address is committed and the serving branch follows from the zone map.
 * Used inline in the home page bar and inside `AddressSelectorDialog`; both
 * read and write the same saved address (localStorage, via the context).
 * Only served neighbourhoods are listed; "Mahallem listede yok" gives an
 * honest "not served" answer instead of a guessed branch.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useDelivery } from "@/lib/delivery/context";
import { deliverableDistricts, deliverableNeighborhoods } from "@/lib/delivery/zones";

const OTHER = "__other__";

const selectClass =
  "h-12 w-full appearance-none rounded-lg border border-sand bg-cream-light pl-4 pr-10 font-sans text-[14.5px] text-espresso transition-colors focus:border-burgundy focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/25 disabled:cursor-not-allowed disabled:opacity-50";

function Chevron() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-burgundy"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function NotServedNotice({ className = "" }: { className?: string }) {
  return (
    <p role="status" className={`font-sans text-[13px] leading-snug text-chocolate-light ${className}`}>
      Bu adrese şu an teslimat yapamıyoruz. Siparişinizi{" "}
      <Link href="/subeler" className="font-semibold underline decoration-chocolate-light/40 underline-offset-2 hover:decoration-chocolate-light">
        mağazalarımızdan
      </Link>{" "}
      teslim alabilirsiniz.
    </p>
  );
}

export function AddressPicker({
  onDone,
  idPrefix = "addr",
  layout = "stacked",
}: {
  /** called after a served address is committed */
  onDone?: () => void;
  idPrefix?: string;
  /** "row": the two selects side by side from sm up */
  layout?: "row" | "stacked";
}) {
  const { context, setDeliveryAddress, setDeliveryDistrict } = useDelivery();
  const [district, setDistrict] = useState(context.district ?? "");
  const [neighborhood, setNeighborhood] = useState(context.neighborhood ?? "");
  const [notServed, setNotServed] = useState(false);

  const districts = useMemo(() => deliverableDistricts(), []);
  const neighborhoods = useMemo(() => (district && district !== OTHER ? deliverableNeighborhoods(district) : []), [district]);

  const commit = (d: string, n: string) => {
    setDeliveryAddress(d, n);
    onDone?.();
  };

  return (
    <div>
      <div className={`grid gap-2.5 ${layout === "row" ? "sm:grid-cols-2" : ""}`}>
        <label className="block">
          <span className="sr-only">İlçe</span>
          <span className="relative block">
            <select
              id={`${idPrefix}-district`}
              value={district}
              onChange={(e) => {
                const d = e.target.value;
                setDistrict(d);
                setNeighborhood("");
                setNotServed(d === OTHER);
                // a new district invalidates the saved neighbourhood (and its branch)
                setDeliveryDistrict(d && d !== OTHER ? d : null);
              }}
              className={selectClass}
            >
              <option value="">İlçe seçin</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
              <option value={OTHER}>İlçem listede yok</option>
            </select>
            <Chevron />
          </span>
        </label>
        <label className="block">
          <span className="sr-only">Mahalle</span>
          <span className="relative block">
            <select
              id={`${idPrefix}-neighborhood`}
              value={neighborhood}
              disabled={!district || district === OTHER}
              onChange={(e) => {
                const n = e.target.value;
                setNeighborhood(n);
                if (n === OTHER) setNotServed(true);
                else if (n) {
                  setNotServed(false);
                  commit(district, n);
                }
              }}
              className={selectClass}
            >
              <option value="">{district && district !== OTHER ? "Mahalle seçin" : "Önce ilçe seçin"}</option>
              {neighborhoods.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              {neighborhoods.length > 0 && <option value={OTHER}>Mahallem listede yok</option>}
            </select>
            <Chevron />
          </span>
        </label>
      </div>
      {notServed && <NotServedNotice className="mt-2.5" />}
    </div>
  );
}
