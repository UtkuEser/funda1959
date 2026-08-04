"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const navLinks = [
  { href: "/", label: "Anasayfa" },
  { href: "/hikayemiz", label: "Hikayemiz" },
  { href: "/lezzetlerimiz", label: "Lezzetlerimiz" },
  { href: "/ozel-gun", label: "Özel Gün" },
  { href: "/subeler", label: "Şubeler" },
  { href: "/iletisim", label: "İletişim" },
];

type MobileMenuProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-espresso/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[300px] max-w-[85vw] bg-cream-light shadow-2xl transform transition-transform duration-350 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-modal="true"
        role="dialog"
        aria-label="Navigasyon menüsü"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-sand-light">
          <span className="font-serif text-lg font-semibold text-chocolate tracking-wide">
            Funda 1959
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-warm-brown hover:text-chocolate hover:bg-cream transition-colors"
            aria-label="Menüyü kapat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav Links */}
        <nav className="px-4 py-6 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-4 py-3 rounded-xl font-sans text-base transition-all duration-200 ${
                  isActive
                    ? "bg-cream text-chocolate font-semibold"
                    : "text-warm-brown hover:bg-cream hover:text-chocolate"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* CTA */}
        <div className="px-4 mt-2 border-t border-sand-light pt-6">
          <Link
            href="/iletisim"
            className="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-chocolate text-cream-light rounded-xl font-sans font-semibold text-sm tracking-wide hover:bg-chocolate-light transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Sipariş / İletişim
          </Link>
        </div>

        {/* Social */}
        <div className="px-6 mt-8">
          <p className="text-xs text-mocha font-sans mb-3 tracking-wider uppercase">Bizi Takip Edin</p>
          <a
            href="https://instagram.com/funda.1959"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-warm-brown hover:text-chocolate transition-colors font-sans text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            @funda.1959
          </a>
        </div>
      </div>
    </>
  );
}
