import type { ReactNode } from "react";
import { Container } from "@/components/shared/Container";

/**
 * Shared shell for /giris, /uye-ol, /sifremi-unuttum.
 * Editorial brand column on the left (desktop only) separated by a thin rule;
 * compact form on the right. No split-screen background blocks.
 */

const BENEFITS = [
  "Siparişlerinizi takip edin",
  "Adreslerinizi kaydedin",
  "Özel günlerinizi kolay yönetin",
];

export function AuthShell({
  title,
  subtitle,
  children,
  altPrompt,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  altPrompt?: ReactNode;
}) {
  return (
    <Container className="pt-20 pb-14 md:pt-24 md:pb-20">
      <div className="mx-auto max-w-[1140px]">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,42%)_minmax(0,58%)] lg:items-start">
          {/* Editorial — desktop only */}
          <div className="relative hidden overflow-hidden lg:block lg:pt-1">
            <div className="relative z-10">
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-taupe">
                Funda 1959
              </p>
              <h2 className="mt-5 font-serif text-[26px] font-semibold leading-[1.3] text-espresso">
                1959&apos;dan bugüne aynı özen,
                <br />
                şimdi size daha yakın.
              </h2>
              <p className="mt-4 max-w-[18rem] font-sans text-[13.5px] leading-relaxed text-warm-brown">
                Hesabınızla Funda deneyiminizi daha kolay yönetin.
              </p>

              <ul className="mt-9 space-y-4">
                {BENEFITS.map((benefit, i) => (
                  <li key={benefit} className="flex items-baseline gap-3.5">
                    <span className="font-serif text-[13px] font-semibold tabular-nums text-burgundy/70">
                      0{i + 1}
                    </span>
                    <span className="font-sans text-[13.5px] leading-snug text-espresso">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-6 left-[-0.06em] select-none font-serif text-[132px] font-semibold leading-none text-burgundy/[0.05]"
            >
              1959
            </span>
          </div>

          {/* Form */}
          <div className="lg:border-l lg:border-sand-light lg:pl-12">
            <div className="mx-auto w-full max-w-[520px] lg:mx-0">
              <h1 className="font-serif text-[25px] md:text-[28px] font-semibold leading-[1.16] text-burgundy">
                {title}
              </h1>
              <p className="mt-2 font-sans text-[13.5px] leading-relaxed text-warm-brown">
                {subtitle}
              </p>

              <div className="mt-6">{children}</div>

              {altPrompt && (
                <p className="mt-5 font-sans text-[13.5px] text-warm-brown">{altPrompt}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
