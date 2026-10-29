import type { ReactNode } from "react";
import { compactSlot } from "@/lib/delivery/labels";
import { longDateTR } from "@/lib/time/istanbul";

/**
 * "Gönderim Zamanı" at checkout — the order's one shipping time (the cart's
 * latest date + window): an exclamation mark, burgundy accent, the date and
 * window large. `problem` switches to the warning look: a time that doesn't
 * work is never shown like one that does. Display only — the time is chosen
 * on the product pages / in the cart, and checked by the caller. (The cart
 * shows the confirmed time as a quieter note: `CartFulfillmentBanner`.)
 */
export function ShippingTimeCard({
  date,
  slotLabel,
  problem = false,
  id,
  focusable = false,
  children,
}: {
  date: string | null;
  slotLabel: string | null;
  problem?: boolean;
  id?: string;
  /** a target for "go to the first problem" */
  focusable?: boolean;
  /** the verdict line(s) under the time */
  children?: ReactNode;
}) {
  return (
    <div
      id={id}
      tabIndex={focusable ? -1 : undefined}
      className={`flex gap-3 rounded-lg border border-l-4 px-4 py-3.5 focus:outline-none sm:gap-3.5 sm:px-5 sm:py-4 ${
        problem
          ? "border-chocolate-light/35 border-l-chocolate-light bg-chocolate-light/[0.05]"
          : "border-burgundy/20 border-l-burgundy bg-cream-light"
      }`}
    >
      <span
        aria-hidden
        className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-cream-light sm:h-8 sm:w-8 ${
          problem ? "bg-chocolate-light" : "bg-burgundy"
        }`}
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="h-4 w-4">
          <path d="M10 4.5v7" strokeWidth={2.2} strokeLinecap="round" />
          <circle cx="10" cy="15.2" r="1.3" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-sans text-[11.5px] font-semibold uppercase tracking-[0.14em] text-burgundy/75">Gönderim Zamanı</h2>
        {date && slotLabel && (
          <p className="mt-1 font-sans text-[17px] font-semibold leading-snug text-burgundy sm:text-[19px]">
            <span className="whitespace-nowrap">{longDateTR(date)}</span>
            <span aria-hidden className="mx-1.5 text-burgundy/40">
              ·
            </span>
            <span className="whitespace-nowrap tabular-nums">{compactSlot(slotLabel)}</span>
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
