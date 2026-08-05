"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { navigation, site } from "@/content/site";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-cream transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-stone/25 px-6 py-5">
          <span className="t-card font-serif tracking-[0.16em] text-bordo">FUNDA</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Menüyü kapat"
            className="p-2 text-ink-soft transition-colors hover:text-bordo"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M1 1l16 16M17 1L1 17" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 py-8">
          <ul>
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`block border-b border-stone/20 py-4 font-serif text-[26px] transition-colors ${
                    pathname === item.href ? "text-bordo" : "text-ink hover:text-bordo"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-10 space-y-3 font-sans text-[16px] text-ink-soft">
            <a href={site.phoneHref} className="block hover:text-bordo">
              {site.phone}
            </a>
            <a href={site.emailHref} className="block hover:text-bordo">
              {site.email}
            </a>
            <a
              href={site.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:text-bordo"
            >
              {site.instagramHandle}
            </a>
          </div>
        </nav>

        <div className="border-t border-stone/25 p-6">
          <Link
            href="/iletisim"
            onClick={onClose}
            className="flex w-full items-center justify-center bg-bordo px-6 py-4 font-sans text-[14px] uppercase tracking-[0.14em] text-cream"
          >
            Sipariş Ver
          </Link>
        </div>
      </div>
    </div>
  );
}
