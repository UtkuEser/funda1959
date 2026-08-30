"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AccountOrder } from "@/lib/account-service";
import { formatCartDate, formatTL } from "@/lib/cart-utils";
import { ACTIVE_STATUSES } from "@/lib/order-status";
import { StatusBadge } from "./StatusBadge";

type FilterKey = "all" | "active" | "done";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "active", label: "Devam Eden" },
  { key: "done", label: "Tamamlanan" },
];

export function OrdersList({ orders }: { orders: AccountOrder[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const list = useMemo(() => {
    if (filter === "active") return orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
    if (filter === "done") return orders.filter((o) => !ACTIVE_STATUSES.includes(o.status));
    return orders;
  }, [orders, filter]);

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-sand-light p-6 text-center md:p-10">
        <p className="font-serif text-[18px] font-semibold text-burgundy">Henüz siparişiniz yok.</p>
        <p className="mx-auto mt-2 max-w-sm font-sans text-[14px] leading-relaxed text-warm-brown">
          Funda&apos;nın lezzetlerini keşfederek ilk siparişinizi oluşturabilirsiniz.
        </p>
        <Link
          href="/lezzetlerimiz"
          className="mt-5 inline-flex rounded-md bg-burgundy px-5 py-2.5 font-sans text-[13px] font-semibold text-cream-light hover:bg-chocolate-light"
        >
          Lezzetleri Keşfet
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`rounded-md px-3 py-1.5 font-sans text-[13px] transition-colors ${
              filter === f.key
                ? "bg-burgundy/[0.07] font-semibold text-burgundy"
                : "font-medium text-warm-brown hover:text-burgundy"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="mt-6 font-sans text-[14px] text-warm-brown">Bu filtreye uygun sipariş yok.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {list.map((o) => (
            <li key={o.orderNumber} className="rounded-lg border border-sand-light p-4">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div>
                  <p className="font-sans text-[14px] font-semibold text-espresso">{o.orderNumber}</p>
                  <p className="mt-0.5 font-sans text-[12.5px] text-taupe">
                    {formatCartDate(o.createdAt)} ·{" "}
                    {o.deliveryType === "pickup" ? "Mağazadan Teslim" : "Adrese Teslim"}
                  </p>
                </div>
                <StatusBadge status={o.status} />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <span className="font-sans text-[14px] font-semibold text-burgundy">
                  {formatTL(o.total)}
                </span>
                <Link
                  href={`/hesabim/siparislerim/${encodeURIComponent(o.orderNumber)}`}
                  className="font-sans text-[13px] font-semibold text-burgundy hover:text-chocolate-light"
                >
                  Detayı Gör →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
