"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { MobileMenu } from "./MobileMenu";
import { DesktopNav } from "./DesktopNav";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { useCartCount } from "@/lib/use-cart";

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

function IconButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="p-2 rounded-md text-warm-brown hover:text-burgundy hover:bg-cream transition-colors"
    >
      {children}
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
        <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between gap-4 h-[68px] md:h-[76px]">
            <Logo />

            <DesktopNav />

            {/* Actions */}
            <div className="flex items-center gap-0.5 md:gap-1">
              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                aria-label="Ara"
                aria-expanded={searchOpen}
                className="p-2 rounded-md text-warm-brown hover:text-burgundy hover:bg-cream transition-colors"
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 21l-4.3-4.3M11 18a7 7 0 100-14 7 7 0 000 14z" />
                </svg>
              </button>
              {/* No auth session yet -> account icon goes to sign-in.
                  Later: session ? "/hesabim" : "/giris". */}
              <IconButton href="/giris" label="Hesabım">
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M16 17v-1a4 4 0 00-8 0v1M12 12a4 4 0 100-8 4 4 0 000 8z" />
                </svg>
              </IconButton>
              <Link
                href="/sepet"
                aria-label={cartCount > 0 ? `Sepetim, ${cartCount} ürün` : "Sepetim"}
                className="relative p-2 rounded-md text-warm-brown hover:text-burgundy hover:bg-cream transition-colors"
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M6 8h12l-1 12H7L6 8zM9 8V6a3 3 0 016 0v2" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-burgundy px-1 font-sans text-[10px] font-semibold leading-none text-cream-light">
                    {cartCount}
                  </span>
                )}
              </Link>

              <Link
                href="/hizli-siparis"
                className="hidden xl:inline-flex items-center whitespace-nowrap ml-1.5 2xl:ml-2 px-3 2xl:px-4 py-2 rounded-md bg-burgundy text-cream-light font-sans text-[13px] 2xl:text-[13.5px] font-semibold tracking-wide hover:bg-chocolate-light transition-colors"
              >
                Sipariş Ver
              </Link>

              <button
                onClick={() => setMenuOpen(true)}
                className="xl:hidden ml-1 p-2 rounded-md text-burgundy hover:bg-cream transition-colors"
                aria-label="Menüyü aç"
                aria-expanded={menuOpen}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={menuOpen} onClose={closeMenu} />
      <SearchOverlay open={searchOpen} onClose={closeSearch} />
    </>
  );
}
