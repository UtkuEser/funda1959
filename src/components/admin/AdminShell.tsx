"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { listBranches } from "@/lib/branch";

const NAV = [
  { key: "overview", label: "Genel Bakış" },
  { key: "orders", label: "Siparişler" },
  { key: "stock", label: "Şube Stokları" },
  { key: "campaigns", label: "Kampanyalar" },
  { key: "instagram", label: "Instagram İçerikleri" },
  { key: "funda-puan", label: "Funda Puan", superAdminOnly: true },
  { key: "zones", label: "Teslimat Bölgeleri" },
  { key: "slots", label: "Teslimat Slotları" },
  { key: "reservations", label: "Rezervasyonlar" },
  { key: "branches", label: "Şubeler" },
] as const;

const TITLES: Record<string, string> = Object.fromEntries(NAV.map((n) => [n.key, n.label]));

const ROLE_OPTIONS = [
  { value: "super", label: "Merkez Yönetim" },
  ...listBranches().map((b) => ({
    value: `manager:${b.id}`,
    label: `${b.name.replace("Funda 1959 ", "")} Müdürü`,
  })),
];

function Chrome({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useSearchParams();
  const as = params.get("as") ?? "super";
  const section = params.get("section") ?? "overview";
  const branch = params.get("branch") ?? "";
  const isSuper = !as.startsWith("manager:");
  const managerBranch = as.startsWith("manager:") ? as.slice("manager:".length) : null;

  const hrefFor = (nextSection: string) => {
    const q = new URLSearchParams();
    q.set("as", as);
    q.set("section", nextSection);
    if (branch) q.set("branch", branch);
    return `/admin?${q.toString()}`;
  };

  const setParam = (key: string, value: string) => {
    const q = new URLSearchParams(params.toString());
    if (value) q.set(key, value);
    else q.delete(key);
    router.push(`/admin?${q.toString()}`);
  };

  const branches = listBranches();
  const navItems = NAV.filter((item) => !("superAdminOnly" in item && item.superAdminOnly) || isSuper);

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto flex max-w-[1600px]">
        {/* Sidebar */}
        <aside className="hidden w-[232px] shrink-0 border-r border-neutral-200 md:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="border-b border-neutral-200 px-5 py-4">
              <p className="text-[15px] font-semibold leading-tight">Funda 1959</p>
              <p className="text-[12px] uppercase tracking-[0.14em] text-neutral-400">Admin</p>
            </div>
            <nav className="flex-1 overflow-y-auto p-2">
              {navItems.map((item) => {
                const active = section === item.key;
                return (
                  <Link
                    key={item.key}
                    href={hrefFor(item.key)}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-md px-3 py-2 text-[13.5px] transition-colors ${
                      active
                        ? "bg-neutral-100 font-semibold text-neutral-900"
                        : "font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-neutral-200 px-4 py-3 text-[11px] text-neutral-400">
              {isSuper ? "Tüm şubeler" : `${branches.find((b) => b.id === managerBranch)?.name ?? ""}`}
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-10 flex h-[60px] items-center justify-between gap-4 border-b border-neutral-200 bg-white px-4 md:px-6">
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400 md:hidden">
                Admin
              </span>
              <h1 className="text-[16px] font-semibold md:text-[18px]">
                {TITLES[section] ?? "Operasyon Paneli"}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {isSuper && (section === "stock" || section === "slots" || section === "overview") ? (
                <label className="flex items-center gap-1.5 text-[12px] text-neutral-500">
                  <span className="hidden sm:inline">Şube</span>
                  <select
                    value={branch}
                    onChange={(e) => setParam("branch", e.target.value)}
                    className="h-8 rounded-md border border-neutral-300 bg-white px-2 text-[12.5px] font-medium text-neutral-900 focus:border-neutral-900 focus:outline-none"
                  >
                    <option value="">Tümü</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name.replace("Funda 1959 ", "")}
                      </option>
                    ))}
                  </select>
                </label>
              ) : !isSuper ? (
                <span className="hidden items-center gap-1.5 text-[12px] text-neutral-500 sm:flex">
                  Şube
                  <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-[12.5px] font-semibold text-neutral-900">
                    {branches.find((b) => b.id === managerBranch)?.name.replace("Funda 1959 ", "")}
                  </span>
                </span>
              ) : null}

              <label className="flex items-center gap-1.5 text-[12px] text-neutral-500">
                <span className="hidden sm:inline">Demo rol</span>
                <select
                  value={as}
                  onChange={(e) => {
                    const q = new URLSearchParams();
                    q.set("as", e.target.value);
                    q.set("section", section);
                    router.push(`/admin?${q.toString()}`);
                  }}
                  className="h-8 rounded-md border border-neutral-300 bg-white px-2 text-[12.5px] font-medium text-neutral-900 focus:border-neutral-900 focus:outline-none"
                >
                  {ROLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </header>

          {/* Mobile nav (compact) */}
          <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 px-3 py-2 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={hrefFor(item.key)}
                className={`shrink-0 rounded-md px-2.5 py-1 text-[12.5px] ${
                  section === item.key
                    ? "bg-neutral-100 font-semibold"
                    : "text-neutral-600"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <main className="flex-1 px-4 py-6 md:px-6 md:py-7">
            <div className="mx-auto max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <Chrome>{children}</Chrome>
    </Suspense>
  );
}
