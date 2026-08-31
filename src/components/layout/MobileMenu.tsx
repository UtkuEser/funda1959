"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navItems } from "./navigation";

type MobileMenuProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string | null>(null);

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
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
        className={`fixed top-0 right-0 z-50 flex h-full w-[320px] max-w-[86vw] flex-col bg-cream-light shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-modal="true"
        role="dialog"
        aria-label="Navigasyon menüsü"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-5 py-4 border-b border-sand-light">
          <span className="font-serif text-xl font-semibold text-burgundy tracking-tight">
            Funda{" "}
            <span className="font-sans text-[10px] font-semibold tracking-[0.32em] text-burgundy/55 align-middle">
              1959
            </span>
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-warm-brown hover:text-burgundy hover:bg-cream transition-colors"
            aria-label="Menüyü kapat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav — accordion */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {navItems.map((item) => {
            if (!item.children) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex min-h-[46px] items-center rounded-md px-4 font-sans text-[15px] font-semibold text-burgundy hover:bg-cream transition-colors"
                >
                  {item.label}
                </Link>
              );
            }

            const open = expanded === item.label;
            return (
              <div key={item.label} className="border-b border-sand-light/60 last:border-0">
                <button
                  onClick={() => setExpanded(open ? null : item.label)}
                  className="flex w-full min-h-[46px] items-center justify-between rounded-md px-4 font-sans text-[15px] font-semibold text-burgundy hover:bg-cream transition-colors"
                  aria-expanded={open}
                >
                  {item.label}
                  <svg
                    className={`h-3.5 w-3.5 text-burgundy/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {open && (
                  <div className="pb-2">
                    {item.children.map((child) => {
                      const isAll = child.label.startsWith("Tüm");
                      return (
                        <Link
                          key={child.label}
                          href={child.href}
                          className={`flex min-h-[44px] items-center rounded-md pl-7 pr-4 font-sans text-[14px] transition-colors ${
                            isAll
                              ? "font-semibold text-burgundy hover:bg-cream"
                              : "text-warm-brown hover:bg-cream hover:text-burgundy"
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* CTA + social */}
        <div className="shrink-0 border-t border-sand-light px-4 pt-4 pb-6">
          <Link
            href="/hizli-siparis"
            className="flex min-h-[48px] w-full items-center justify-center rounded-md bg-burgundy px-5 font-sans text-sm font-semibold tracking-wide text-cream-light hover:bg-chocolate-light transition-colors"
          >
            Sipariş Ver
          </Link>
          <a
            href="https://instagram.com/funda.1959"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center gap-2 px-1 font-sans text-[13px] text-warm-brown hover:text-burgundy transition-colors"
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
