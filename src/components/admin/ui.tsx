import type { ReactNode } from "react";

/** Black-and-white admin primitives. Server-safe (no hooks). */

export function Panel({
  title,
  action,
  children,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white">
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
          {title && <h2 className="text-[14px] font-semibold text-neutral-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function Table({ children }: { children: ReactNode }) {
  return <table className="w-full border-collapse text-[13px]">{children}</table>;
}

export function Th({ children, align = "left" }: { children: ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className={`border-b border-neutral-200 bg-neutral-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-neutral-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className = "",
}: {
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td
      className={`border-b border-neutral-100 px-3 py-2.5 text-neutral-800 ${
        align === "right" ? "text-right" : ""
      } ${className}`}
    >
      {children}
    </td>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <tr className="hover:bg-neutral-50">{children}</tr>;
}

export function EmptyRow({ cols, children }: { cols: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={cols} className="px-3 py-8 text-center text-[13px] text-neutral-400">
        {children}
      </td>
    </tr>
  );
}

/** thin outlined badge — no colour fills */
export function Badge({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium ${
        strong
          ? "border-neutral-900 text-neutral-900"
          : "border-neutral-300 text-neutral-600"
      }`}
    >
      {children}
    </span>
  );
}

export function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3">
      <p className="text-[12px] text-neutral-500">{label}</p>
      <p className="mt-1 text-[22px] font-semibold tabular-nums text-neutral-900">{value}</p>
    </div>
  );
}

export function PageIntro({ children }: { children: ReactNode }) {
  return <p className="mb-5 max-w-3xl text-[12.5px] leading-relaxed text-neutral-500">{children}</p>;
}
