import type { DeliveryLabel } from "@/lib/delivery/labels";

const TONE: Record<DeliveryLabel["when"], string> = {
  today: "bg-sage/15 text-[#4E5E47]",
  tomorrow: "bg-burgundy/[0.07] text-burgundy",
  later: "bg-sand-light text-warm-brown",
};

/** Small, calm delivery tag — "Bugün teslim" / "En erken yarına teslim" / "En erken 3 Ekim'e teslim". */
export function DeliveryPill({ label, className = "" }: { label: DeliveryLabel; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-[11.5px] font-semibold leading-none ${TONE[label.when]} ${className}`}
    >
      <svg aria-hidden className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7h11v9H3zM14 10h3.6l2.9 3v3H14zM7 19a1.8 1.8 0 100-3.6A1.8 1.8 0 007 19zm10.5 0a1.8 1.8 0 100-3.6 1.8 1.8 0 000 3.6z" />
      </svg>
      {label.text}
    </span>
  );
}
