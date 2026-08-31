"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { navItems, type NavChild } from "./navigation";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-2.5 w-2.5 opacity-55 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function DesktopNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const scheduleClose = () => {
    cancelClose();
    timer.current = setTimeout(() => setOpen(null), 110);
  };

  const isActive = (href: string) =>
    href === "/lezzetlerimiz"
      ? pathname.startsWith("/lezzetlerimiz")
      : pathname === href;

  const linkClass = (active: boolean) =>
    `font-sans text-[13.5px] 2xl:text-[14.5px] whitespace-nowrap transition-colors duration-200 ${
      active
        ? "text-burgundy font-semibold"
        : "text-warm-brown font-medium hover:text-burgundy"
    }`;

  return (
    <nav className="hidden xl:flex items-center gap-x-4 2xl:gap-x-7">
      {navItems.map((item) => {
        if (!item.children) {
          if (item.emphasis) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="inline-flex items-center gap-1 whitespace-nowrap font-sans text-[13.5px] 2xl:text-[14.5px] font-medium text-burgundy transition-colors duration-200 hover:text-chocolate-light"
              >
                {item.label}
                <span aria-hidden className="text-[10px] leading-none opacity-70">
                  →
                </span>
              </Link>
            );
          }
          return (
            <Link key={item.label} href={item.href} className={linkClass(isActive(item.href))}>
              {item.label}
            </Link>
          );
        }

        const menuOpen = open === item.label;

        return (
          <div
            key={item.label}
            className="relative"
            onMouseEnter={() => {
              cancelClose();
              setOpen(item.label);
            }}
            onMouseLeave={scheduleClose}
          >
            <Link
              href={item.href}
              className={`${linkClass(isActive(item.href) || menuOpen)} inline-flex items-center gap-0.5`}
              aria-expanded={menuOpen}
              onClick={() => setOpen(null)}
            >
              {item.label}
              <Chevron open={menuOpen} />
            </Link>

            {menuOpen && (
              <div
                className="absolute left-0 top-full z-40 pt-3"
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
              >
                <div className="min-w-[236px] rounded-lg border border-sand-light bg-cream-light py-2 shadow-[0_14px_36px_-22px_rgba(42,35,32,0.28)]">
                  {item.children.map((child: NavChild) => {
                    const isAll = child.label.startsWith("Tüm");
                    return (
                      <Link
                        key={child.label}
                        href={child.href}
                        onClick={() => setOpen(null)}
                        className={`block px-4 py-2.5 font-sans text-[14px] transition-colors duration-150 ${
                          isAll
                            ? "mt-1 border-t border-sand-light pt-3 font-semibold text-burgundy hover:bg-cream"
                            : "text-warm-brown hover:bg-cream hover:text-burgundy"
                        }`}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
