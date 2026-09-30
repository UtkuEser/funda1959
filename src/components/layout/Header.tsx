"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { MobileMenu } from "./MobileMenu";
import { DesktopNav } from "./DesktopNav";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { useCartCount } from "@/lib/use-cart";

/** one size, one stroke, one hit area for every header icon */
const ICON_BUTTON =
  "flex h-11 w-11 items-center justify-center rounded-md text-warm-brown transition-colors hover:bg-cream hover:text-burgundy md:h-12 md:w-12";
const ICON = "h-[22px] w-[22px] md:h-6 md:w-6";

function Logo() {
  return (
    <Link href="/" className="flex items-end gap-2.5" aria-label="Funda 1959 anasayfa">
      <span className="font-serif text-[27px] md:text-[31px] font-semibold tracking-[-0.015em] text-burgundy leading-[0.9]">
        Funda
      </span>
      <span className="flex flex-col items-start leading-none pb-1">
        <span className="mb-1 h-px w-5 bg-gold/70" aria-hidden />
        <span className="font-sans text-[10px] md:text-[11px] font-semibold tracking-[0.34em] text-burgundy/55">
          1959
        </span>
      </span>
    </Link>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const cartCount = useCartCount();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-30 bg-cream-light transition-shadow duration-300 ${
          scrolled
            ? "shadow-[0_1px_0_rgba(110,34,48,0.07),0_8px_28px_-16px_rgba(42,35,32,0.22)]"
            : "border-b border-sand-light"
        }`}
      >
        {/* top row: logo left, icons right — same height as before, so page offsets hold */}
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-10">
          <div className="flex h-[68px] items-center justify-between gap-4 md:h-[76px]">
            <Logo />

            <div className="flex items-center gap-0.5 sm:gap-1.5">
              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                aria-label="Ara"
                aria-expanded={searchOpen}
                className={ICON_BUTTON}
              >
                <svg className={ICON} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 21l-4.3-4.3M11 18a7 7 0 100-14 7 7 0 000 14z" />
                </svg>
              </button>
              {/* customer sign-in page — sign-in is still a front-end stub (lib/auth.ts, no session) */}
              <Link href="/giris" aria-label="Hesabım" className={ICON_BUTTON}>
                <svg className={ICON} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M18 20v-1.2a4.8 4.8 0 00-4.8-4.8h-2.4A4.8 4.8 0 006 18.8V20M12 11a4 4 0 100-8 4 4 0 000 8z" />
                </svg>
              </Link>
              <Link
                href="/sepet"
                aria-label={cartCount > 0 ? `Sepetim, ${cartCount} ürün` : "Sepetim"}
                className={`relative ${ICON_BUTTON}`}
              >
                <svg className={ICON} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M6 8h12l-1 12H7L6 8zM9 8V6a3 3 0 016 0v2" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-burgundy px-1 font-sans text-[10px] font-semibold leading-none text-cream-light">
                    {cartCount}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setMenuOpen(true)}
                className={`ml-1 text-burgundy lg:hidden ${ICON_BUTTON}`}
                aria-label="Menüyü aç"
                aria-expanded={menuOpen}
              >
                <svg className={ICON} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* menu row (desktop): separated by a hairline, centred on the page */}
        <div className="hidden border-t border-sand-light lg:block">
          <div className="mx-auto max-w-[1320px] px-10">
            <DesktopNav />
          </div>
        </div>
      </header>

      <MobileMenu isOpen={menuOpen} onClose={closeMenu} />
      <SearchOverlay open={searchOpen} onClose={closeSearch} />
    </>
  );
}
