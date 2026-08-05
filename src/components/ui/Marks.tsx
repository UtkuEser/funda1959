/**
 * Marka işaretleri — sade ve sınırlı kullanım.
 * F monogramı yalnızca logo, tek bölüm amblemi ve footer'da kullanılır;
 * desen olarak tekrar edilmez.
 */

export function Monogram({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      <path d="M14 11h13v2.8h-9.9v6.4h8.6V23h-8.6v6h-3.1z" fill="currentColor" />
    </svg>
  );
}

