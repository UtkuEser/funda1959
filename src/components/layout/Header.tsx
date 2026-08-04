"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { MobileMenu } from "./MobileMenu";

const navLinks = [
  { href: "/", label: "Anasayfa" },
  { href: "/hikayemiz", label: "Hikayemiz" },
  { href: "/lezzetlerimiz", label: "Lezzetlerimiz" },
  { href: "/ozel-gun", label: "Özel Gün" },
  { href: "/subeler", label: "Şubeler" },
  { href: "/iletisim", label: "İletişim" },
];

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-400 ${
          scrolled || !isHome
            ? "bg-cream-light/95 backdrop-blur-md shadow-sm border-b border-sand-light/60"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex flex-col leading-none">
                <span
                  className={`font-serif text-xl md:text-2xl font-bold tracking-wide transition-colors ${
                    scrolled || !isHome
                      ? "text-chocolate"
                      : "text-cream-light"
                  }`}
                >
                  Funda
                </span>
                <span
                  className={`font-serif text-xs tracking-[0.25em] uppercase transition-colors ${
                    scrolled || !isHome ? "text-gold" : "text-gold-light"
                  }`}
                >
                  1959
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-lg font-sans text-sm transition-all duration-200 ${
                      isActive
                        ? scrolled || !isHome
                          ? "text-chocolate font-semibold"
                          : "text-cream-light font-semibold"
                        : scrolled || !isHome
                        ? "text-warm-brown hover:text-chocolate"
                        : "text-cream/80 hover:text-cream-light"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* CTA + Hamburger */}
            <div className="flex items-center gap-3">
              <Link
                href="/iletisim"
                className={`hidden lg:flex items-center gap-2 px-5 py-2.5 rounded-xl font-sans text-sm font-semibold tracking-wide transition-all duration-200 ${
                  scrolled || !isHome
                    ? "bg-chocolate text-cream-light hover:bg-chocolate-light"
                    : "bg-cream-light/15 text-cream-light border border-cream-light/30 hover:bg-cream-light/25"
                }`}
              >
                Sipariş / İletişim
              </Link>

              {/* Hamburger */}
              <button
                onClick={() => setMenuOpen(true)}
                className={`lg:hidden p-2 rounded-lg transition-colors ${
                  scrolled || !isHome
                    ? "text-chocolate hover:bg-cream"
                    : "text-cream-light hover:bg-cream-light/15"
                }`}
                aria-label="Menüyü aç"
                aria-expanded={menuOpen}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
