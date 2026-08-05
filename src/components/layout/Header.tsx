"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { announcement, navigation, site } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40">
        {/* İnce üst bant */}
        <div className="bg-bordo text-cream/85">
          <Container className="flex h-8 items-center justify-between gap-4">
            <p className="truncate font-sans text-[12px] tracking-[0.1em]">{announcement}</p>
            <a
              href={site.phoneHref}
              className="hidden font-sans text-[12px] tracking-[0.1em] transition-colors hover:text-cream sm:block"
            >
              {site.phone}
            </a>
          </Container>
        </div>

        {/* Ana bar */}
        <div
          className={`bg-cream transition-shadow duration-300 ${
            scrolled ? "shadow-[0_1px_20px_rgba(42,26,21,0.09)]" : "border-b border-stone/25"
          }`}
        >
          <Container>
            <div
              className={`flex items-center justify-between gap-8 transition-[height] duration-300 ${
                scrolled ? "h-[68px]" : "h-[84px] md:h-[92px]"
              }`}
            >
              {/* Logo */}
              <Link href="/" className="shrink-0 leading-none" aria-label={`${site.name} — ana sayfa`}>
                <span className="block font-serif text-[26px] tracking-[0.16em] text-bordo md:text-[30px]">
                  FUNDA
                </span>
                <span className="mt-1 block font-sans text-[11px] tracking-[0.42em] text-gold">
                  {site.year}
                </span>
              </Link>

              {/* Menü */}
              <nav className="hidden items-center gap-9 lg:flex xl:gap-11">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`font-sans text-[14px] transition-colors duration-200 ${
                      isActive(item.href)
                        ? "text-bordo"
                        : "text-ink-soft hover:text-bordo"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center gap-4">
                <Link
                  href="/iletisim"
                  className="hidden shrink-0 items-center bg-bordo px-6 py-3 font-sans text-[13px] uppercase tracking-[0.14em] text-cream transition-colors duration-300 hover:bg-bordo-dark lg:inline-flex"
                >
                  Sipariş Ver
                </Link>

                {/* Mobil menü */}
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  aria-label="Menüyü aç"
                  className="-mr-2 p-2 text-ink lg:hidden"
                >
                  <svg width="24" height="16" viewBox="0 0 24 16" fill="none" aria-hidden="true">
                    <path d="M0 1h24M0 8h24M0 15h16" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </button>
              </div>
            </div>
          </Container>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
