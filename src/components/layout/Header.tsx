"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { announcement, navigation, site } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { OrnamentBand } from "@/components/ui/Ornament";
import { MobileMenu } from "./MobileMenu";

/** Menü, ortadaki logonun iki yanına bölünür (Ladurée düzeni). */
const leftNav = navigation.slice(1, 4);
const rightNav = navigation.slice(4);

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isHome = pathname === "/";
  /** Ana sayfada hero görselinin üzerinde transparan çalışır. */
  const overlay = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkClass = (active: boolean) =>
    `relative whitespace-nowrap font-sans text-[12px] uppercase tracking-[0.2em] transition-colors duration-300 after:absolute after:-bottom-2 after:left-0 after:h-px after:transition-all after:duration-300 ${
      overlay
        ? `text-cream/85 hover:text-cream after:bg-cream ${active ? "after:w-full" : "after:w-0 hover:after:w-full"}`
        : `after:bg-bordo ${
            active ? "text-bordo after:w-full" : "text-ink-soft hover:text-bordo after:w-0 hover:after:w-full"
          }`
    }`;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40">
        {/* İnce üst şerit */}
        <div
          className={`transition-colors duration-500 ${
            overlay ? "bg-bordo-dark/45 backdrop-blur-sm" : "bg-bordo"
          } text-cream/85`}
        >
          <Container className="flex h-9 items-center justify-between gap-4">
            <p className="truncate font-sans text-[11px] uppercase tracking-[0.22em]">
              {announcement}
            </p>
            <div className="hidden items-center gap-8 font-sans text-[11px] uppercase tracking-[0.22em] sm:flex">
              <a href={site.phoneHref} className="transition-colors hover:text-cream">
                {site.phone}
              </a>
              <a
                href={site.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-cream"
              >
                Instagram
              </a>
            </div>
          </Container>
        </div>

        {/* Ana bar */}
        <div
          className={`transition-all duration-500 ${
            overlay
              ? "bg-transparent"
              : "bg-cream/97 shadow-[0_1px_30px_rgba(44,26,22,0.08)] backdrop-blur-md"
          }`}
        >
          <Container>
            <div
              className={`flex items-center transition-all duration-500 ${
                scrolled ? "h-[4.5rem]" : "h-24 md:h-28"
              }`}
            >
              {/* Sol menü */}
              <nav className="hidden flex-1 items-center gap-8 lg:flex xl:gap-10">
                {leftNav.map((item) => (
                  <Link key={item.href} href={item.href} className={linkClass(isActive(item.href))}>
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* Mobil menü butonu */}
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Menüyü aç"
                className={`-ml-2 p-2 lg:hidden ${overlay ? "text-cream" : "text-ink"}`}
              >
                <svg width="22" height="16" viewBox="0 0 22 16" fill="none" aria-hidden="true">
                  <path d="M0 1h22M0 8h22M0 15h14" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </button>

              {/* Ortada logo */}
              <Link
                href="/"
                className="mx-auto flex flex-col items-center leading-none"
                aria-label={`${site.name} — ana sayfa`}
              >
                <span
                  className={`font-serif text-[1.75rem] tracking-[0.22em] transition-colors duration-500 md:text-[2.15rem] ${
                    overlay ? "text-cream" : "text-bordo"
                  }`}
                >
                  FUNDA
                </span>
                <span
                  className={`mt-1.5 font-sans text-[9px] uppercase tracking-[0.5em] transition-colors duration-500 ${
                    overlay ? "text-cream/80" : "text-gold"
                  }`}
                >
                  {site.year}
                </span>
              </Link>

              {/* Sağ menü + CTA */}
              <div className="hidden flex-1 items-center justify-end gap-8 lg:flex xl:gap-10">
                {rightNav.map((item) => (
                  <Link key={item.href} href={item.href} className={linkClass(isActive(item.href))}>
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/iletisim"
                  className={`inline-flex items-center border px-6 py-3 font-sans text-[11px] uppercase tracking-[0.2em] transition-colors duration-300 ${
                    overlay
                      ? "border-cream/55 text-cream hover:bg-cream hover:text-bordo"
                      : "border-bordo text-bordo hover:bg-bordo hover:text-cream"
                  }`}
                >
                  Sipariş Ver
                </Link>
              </div>

              {/* Mobil telefon */}
              <a
                href={site.phoneHref}
                aria-label="Telefonla ara"
                className={`-mr-2 p-2 lg:hidden ${overlay ? "text-cream" : "text-bordo"}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L17 13l4 1.5v3a2.5 2.5 0 0 1-2.7 2.5C10.3 19.6 4.4 13.7 4 5.7A2.5 2.5 0 0 1 6.5 3z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </Container>

          {/* Header altı motif bandı */}
          <div
            className={`transition-opacity duration-500 ${
              overlay ? "opacity-0" : "border-t border-stone/25 bg-cream opacity-100"
            }`}
          >
            <OrnamentBand id="header" height={20} className="opacity-80" />
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
