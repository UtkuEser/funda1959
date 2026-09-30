import type { NavIconName } from "./navigation";

/**
 * One line-icon set for the product menu: 24×24 grid, 1.5 stroke, round
 * caps/joins, currentColor — so every icon has the same weight and takes the
 * text colour it sits next to.
 */
const PATHS: Record<NavIconName, string[]> = {
  // two-tier cake with a candle
  cake: [
    "M4 20.5h16",
    "M5.5 20.5v-6h13v6",
    "M7.5 14.5v-4h9v4",
    "M5.5 17c1.1.9 2.1.9 3.2 0s2.2-.9 3.3 0 2.2.9 3.3 0 2.1-.9 3.2 0",
    "M12 10.5V7.5",
    "M12 3.8c.9 1 .9 1.9 0 2.6-.9-.7-.9-1.6 0-2.6z",
  ],
  // chocolate bar, segmented
  chocolate: [
    "M7.5 3h9A1.5 1.5 0 0118 4.5v15a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 016 19.5v-15A1.5 1.5 0 017.5 3z",
    "M12 3v18",
    "M6 9h12",
    "M6 15h12",
  ],
  // dessert cup with a dome and a cherry
  dessert: [
    "M4 12.5h16c0 4.2-3.6 7.5-8 7.5s-8-3.3-8-7.5z",
    "M7 12.5c0-2.8 2.2-5 5-5s5 2.2 5 5",
    "M12 7.5V6",
    "M13.4 4.6a1.4 1.4 0 11-2.8 0 1.4 1.4 0 012.8 0z",
  ],
  // loaf with scoring
  bread: [
    "M6.5 11.5A3.5 3.5 0 015 8.6C5 6.6 7 5 9.5 5h5C17 5 19 6.6 19 8.6a3.5 3.5 0 01-1.5 2.9V19a1 1 0 01-1 1h-9a1 1 0 01-1-1v-7.5z",
    "M9.5 9.5l1.5 2",
    "M13 9.5l1.5 2",
  ],
  // gift box with a bow
  gift: [
    "M4.5 11h15v8.5a1 1 0 01-1 1h-13a1 1 0 01-1-1V11z",
    "M3.5 7.5h17V11h-17z",
    "M12 7.5v13",
    "M12 7.5C10.8 5 7.5 4.5 7.5 6.2 7.5 7.3 9.8 7.5 12 7.5zm0 0c1.2-2.5 4.5-3 4.5-1.3 0 1.1-2.3 1.3-4.5 1.3z",
  ],
};

export function NavIcon({ name, className = "h-6 w-6" }: { name: NavIconName; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
