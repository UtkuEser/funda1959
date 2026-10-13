"use client";

import { FUNDA_POINTS_RULES } from "@/lib/funda-points";
import { formatTL } from "@/lib/cart-utils";

/**
 * Funda Puan at checkout (D36): whole points, products only, up to the whole
 * product amount and the member's balance. Rendered only while points are
 * switched on (the server passes `member.points` only then — D41); the
 * server checks everything again and reserves the points with the order.
 */
export function FundaPointsRedeem({
  available,
  max,
  value,
  onChange,
}: {
  available: number;
  /** min(balance, whole product amount after discount) */
  max: number;
  value: number;
  onChange: (points: number) => void;
}) {
  const clamp = (n: number) => Math.max(0, Math.min(max, Math.floor(Number.isFinite(n) ? n : 0)));
  return (
    <section className="rounded-md border border-sand-light p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-sans text-[14px] font-semibold text-espresso">Funda Puan kullan</p>
        <p className="font-sans text-[12.5px] text-taupe">Kullanılabilir: {available.toLocaleString("tr-TR")} puan</p>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={max}
          step={1}
          value={value === 0 ? "" : value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          placeholder="0"
          aria-label="Kullanılacak puan"
          className="h-10 w-28 rounded-md border border-sand bg-cream-light px-3 font-sans text-[14px] text-espresso focus:border-burgundy focus:outline-none"
        />
        <button
          type="button"
          onClick={() => onChange(max)}
          disabled={max === 0}
          className="font-sans text-[13px] font-semibold text-burgundy hover:text-chocolate-light disabled:opacity-50"
        >
          En fazlasını kullan ({max.toLocaleString("tr-TR")})
        </button>
        {value > 0 && (
          <button type="button" onClick={() => onChange(0)} className="font-sans text-[13px] text-taupe hover:text-burgundy">
            Kaldır
          </button>
        )}
      </div>
      <p className="mt-2 font-sans text-[12px] leading-relaxed text-taupe">
        {FUNDA_POINTS_RULES.pointValueTL} puan = {formatTL(FUNDA_POINTS_RULES.pointValueTL)}. Puan yalnızca ürün tutarında kullanılır,
        teslimat ücretinde kullanılmaz. Önce son kullanma tarihi en yakın puanlarınız düşülür.
      </p>
    </section>
  );
}
