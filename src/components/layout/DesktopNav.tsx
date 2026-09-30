"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { isNavItemActive, navItems, type NavItem } from "./navigation";
import { useDelivery } from "@/lib/delivery/context";
import { NavIcon } from "./NavIcons";

const CLOSE_DELAY_MS = 180;
/** minimum distance between the open panel and the viewport edge */
const EDGE_GAP = 24;

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 9l6 6 6-6" />
    </svg>
  );
}

/** The current page is marked by colour alone — burgundy, no underline. */
function linkClass(active: boolean) {
  return `inline-flex items-center gap-1 py-3 font-sans text-[15px] whitespace-nowrap transition-colors duration-200 xl:text-[16px] ${
    active ? "font-medium text-burgundy" : "text-warm-brown hover:text-burgundy"
  }`;
}

/**
 * A menu item with a grouped panel (Ürünler). Opens on hover, on keyboard
 * focus and on the chevron button (click stays open until an outside click,
 * Escape or a link is chosen). The panel starts at the item's left edge and
 * is nudged inward only as far as needed to stay on screen.
 */
function DropdownItem({ item, active }: { item: NavItem & { groups: NonNullable<NavItem["groups"]> }; active: boolean }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [shift, setShift] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** set while Escape hands focus back to the toggle, so that focus doesn't reopen */
  const returningFocus = useRef(false);
  const panelId = `nav-panel-${item.label}`;

  const cancelClose = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const close = useCallback(() => {
    cancelClose();
    setOpen(false);
    setPinned(false);
  }, []);
  const scheduleClose = () => {
    if (pinned) return;
    cancelClose();
    timer.current = setTimeout(close, CLOSE_DELAY_MS);
  };

  // keep the panel on screen: left-aligned to the item, clamped to the viewport
  const place = useCallback(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;
    const left = root.getBoundingClientRect().left;
    const width = panel.offsetWidth;
    const clamped = Math.max(EDGE_GAP, Math.min(left, window.innerWidth - EDGE_GAP - width));
    setShift(Math.round(clamped - left));
  }, []);
  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);
  useEffect(() => {
    if (!open) return;
    const onResize = () => place();
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, place, close]);
  useEffect(() => cancelClose, []);

  return (
    <div
      ref={rootRef}
      className="relative flex items-center"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
      onFocus={() => {
        if (returningFocus.current) return;
        cancelClose();
        setOpen(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) close();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          close();
          returningFocus.current = true;
          toggleRef.current?.focus();
          returningFocus.current = false;
        }
      }}
    >
      <Link href={item.href} className={linkClass(active || open)} aria-current={active ? "page" : undefined} onClick={close}>
        {item.label}
      </Link>
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${item.label} menüsünü ${open ? "kapat" : "aç"}`}
        onClick={() => {
          if (open && pinned) close();
          else {
            setOpen(true);
            setPinned(true);
          }
        }}
        className={`-mr-1 ml-0.5 flex h-8 w-6 items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/40 ${
          active || open ? "text-burgundy" : "text-warm-brown/70 hover:text-burgundy"
        }`}
      >
        <Chevron open={open} />
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute left-0 top-full z-40 pt-2"
          style={{ transform: `translateX(${shift}px)` }}
          onMouseEnter={cancelClose}
        >
          <div
            ref={panelRef}
            className="w-[min(940px,calc(100vw-3rem))] rounded-2xl border border-sand-light bg-cream-light px-9 pb-6 pt-8 shadow-[0_22px_44px_-30px_rgba(42,35,32,0.45),0_2px_8px_-4px_rgba(42,35,32,0.08)]"
          >
            <div className="grid grid-flow-col auto-cols-max justify-between gap-x-6">
              {item.groups.map((group) => (
                <div key={group.label}>
                  <p className="flex items-center gap-2.5 whitespace-nowrap font-serif text-[20px] font-semibold leading-tight text-burgundy">
                    <NavIcon name={group.icon} className="h-6 w-6 shrink-0 text-burgundy/80" />
                    {group.label}
                  </p>
                  <ul className="mt-3.5 space-y-0.5">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          onClick={close}
                          className={`-mx-2 block whitespace-nowrap rounded-md px-2 py-1.5 font-sans text-[15.5px] leading-snug transition-colors duration-150 hover:bg-burgundy/[0.05] hover:text-burgundy focus-visible:bg-burgundy/[0.05] focus-visible:text-burgundy focus-visible:outline-none ${
                            link.label.startsWith("Tüm ") ? "font-medium text-burgundy/85" : "text-warm-brown"
                          }`}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {item.allLink && (
              <div className="mt-6 border-t border-sand-light pt-4">
                <Link
                  href={item.allLink.href}
                  onClick={close}
                  className="group inline-flex items-center gap-2 rounded-md py-1 font-sans text-[15px] font-semibold text-burgundy transition-colors hover:text-chocolate-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/40"
                >
                  {item.allLink.label}
                  <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">
                    →
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function DesktopNav() {
  const pathname = usePathname();
  const { openSelector, context, addressStatus, isHydrated } = useDelivery();
  const neighborhood = addressStatus !== "none" ? context.neighborhood : null;

  return (
    <nav aria-label="Ana menü" className="flex h-12 items-center justify-center gap-x-9 xl:gap-x-11">
      {navItems.map((item) => {
        const active = isNavItemActive(item, pathname);

        if (item.pending) {
          return (
            <span
              key={item.label}
              aria-disabled="true"
              title={`${item.label}: ${item.pending}`}
              className="inline-flex cursor-default items-center gap-1.5 py-3 font-sans text-[15px] whitespace-nowrap text-taupe xl:text-[16px]"
            >
              {item.label}
              <span className="rounded-full bg-sand-light px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-taupe">
                {item.pending}
              </span>
            </span>
          );
        }

        if (item.action === "address") {
          // "Adres: <mahalle>" / "Adres seçin" — capped width, long names end in "…"
          // (hidden until the stored choice is read, so it doesn't flash "Adres seçin")
          return (
            <button
              key={item.label}
              type="button"
              aria-haspopup="dialog"
              aria-label={neighborhood ? `Adres: ${context.district}, ${neighborhood}. Değiştir` : "Adres seçin"}
              title={neighborhood ? `${context.district}, ${neighborhood}` : undefined}
              onClick={() => openSelector()}
              className={`${linkClass(false)} min-w-0 max-w-[13rem] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy/40 xl:max-w-[16rem]`}
            >
              <span className={`flex min-w-0 items-baseline gap-1 ${isHydrated ? "" : "invisible"}`}>
                {neighborhood ? (
                  <>
                    <span className="shrink-0">{item.label}:</span>
                    <span className="min-w-0 truncate font-medium text-burgundy">{neighborhood}</span>
                  </>
                ) : (
                  `${item.label} seçin`
                )}
              </span>
            </button>
          );
        }

        if (item.groups) {
          return <DropdownItem key={item.label} item={{ ...item, groups: item.groups }} active={active} />;
        }

        return (
          <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} className={linkClass(active)}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
