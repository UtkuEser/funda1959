import type { CSSProperties, ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Sıralı beliren bloklar için gecikme (ms). */
  delay?: number;
  className?: string;
};

/**
 * Girişte beliren blok — tamamen CSS ile (scroll-driven animation).
 * JavaScript çalışmasa veya tarayıcı desteklemese de içerik görünür kalır.
 */
export function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  return (
    <div
      className={`reveal ${className}`}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
