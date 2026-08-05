/** Tam genişlikte alıntı — bölüm ritmini kırmak için. */
export function PullQuote({ children }: { children: string }) {
  return (
    <figure className="mx-auto max-w-[26ch] text-center">
      <span aria-hidden="true" className="mx-auto block h-px w-16 bg-bordo/40" />
      <blockquote className="mt-8 font-serif text-[clamp(1.75rem,3vw,2.75rem)] leading-[1.25] text-bordo">
        {children}
      </blockquote>
      <span aria-hidden="true" className="mx-auto mt-8 block h-px w-16 bg-bordo/40" />
    </figure>
  );
}
