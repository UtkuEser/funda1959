import type { HeroSlideVisual } from "@/lib/hero-slides";

/**
 * Placeholder art for each hero slide. Every variant shares the same warm
 * container, soft gradient and a single restrained line motif so the three
 * slides read as one visual system. Swap the gradient block for a real
 * photograph when photography is available.
 */
export function HeroVisual({ variant }: { variant: HeroSlideVisual }) {
  if (variant === "celebration") {
    return (
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(155deg, #F6EEE1 0%, #ECD6C3 46%, #DBAB90 100%)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_30%_22%,rgba(255,255,255,0.35),transparent_60%)]" />
        <svg
          viewBox="0 0 120 120"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          className="absolute left-1/2 top-1/2 w-[42%] -translate-x-1/2 -translate-y-1/2 text-cream-light/70"
          aria-hidden
        >
          <path d="M39 32 h42 v14 q0 5 -21 5 q-21 0 -21 -5 z" />
          <path d="M27 52 h66 v18 q0 6 -33 6 q-33 0 -33 -6 z" />
          <line x1="60" y1="32" x2="60" y2="20" />
          <circle cx="60" cy="16" r="2.6" fill="currentColor" stroke="none" />
        </svg>
      </div>
    );
  }

  if (variant === "daily") {
    return (
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(150deg, #F3EADB 0%, #E7D4BB 50%, #D6B597 100%)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_32%_20%,rgba(255,255,255,0.32),transparent_60%)]" />
        <svg
          viewBox="0 0 150 100"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          className="absolute left-1/2 top-1/2 w-[62%] -translate-x-1/2 -translate-y-1/2 text-espresso/[0.13]"
          aria-hidden
        >
          <ellipse cx="52" cy="64" rx="38" ry="11" />
          <path d="M28 60 q24 -26 48 0" />
          <path d="M104 42 h26 v22 a13 13 0 0 1 -26 0 z" />
          <path d="M130 47 a8 8 0 0 1 0 14" />
        </svg>
      </div>
    );
  }

  // heritage — modern subject with a soft sepia storefront behind it
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 32% 20%, #F4E9DC 0%, #E7CAB9 44%, #CE9D8A 76%, #B47B6B 100%)",
        }}
      />
      {/* faint historical storefront, low and atmospheric */}
      <svg
        viewBox="0 0 200 128"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
        className="absolute bottom-0 left-1/2 w-[86%] -translate-x-1/2 text-[#4a2f24]/[0.08]"
        aria-hidden
      >
        <rect x="26" y="34" width="148" height="94" />
        <path d="M16 34 h168 l-12 -17 H28 z" />
        <path d="M28 34 q7 8 14 0 q7 8 14 0 q7 8 14 0 q7 8 14 0 q7 8 14 0 q7 8 14 0 q7 8 14 0 q7 8 14 0 q7 8 14 0 q7 8 14 0" />
        <rect x="88" y="82" width="24" height="46" />
        <rect x="42" y="56" width="26" height="26" />
        <rect x="132" y="56" width="26" height="26" />
      </svg>
      {/* sepia atmosphere from below */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#4a2f24]/24 via-transparent to-transparent" />
      {/* modern signature cake in front */}
      <svg
        viewBox="0 0 120 120"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinejoin="round"
        className="absolute bottom-[13%] left-1/2 w-[47%] -translate-x-1/2 text-cream-light/85 drop-shadow-[0_6px_16px_rgba(74,47,36,0.25)]"
        aria-hidden
      >
        <path d="M40 30 h40 v13 q0 5 -20 5 q-20 0 -20 -5 z" />
        <path d="M28 49 h64 v17 q0 6 -32 6 q-32 0 -32 -6 z" />
        <line x1="60" y1="30" x2="60" y2="18" />
        <circle cx="60" cy="14" r="2.6" fill="currentColor" stroke="none" />
      </svg>
    </div>
  );
}
