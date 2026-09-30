"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import type { BranchStockRow } from "@/lib/inventory/stock-view";
import type { BranchStockStatus } from "@/lib/inventory/overrides";
import { PRODUCT_GROUPS, inProductGroup, type ProductGroup } from "@/lib/product-taxonomy";
import { NavIcon } from "@/components/layout/NavIcons";

type StatusFilter = "all" | BranchStockStatus;
type GroupKey = "all" | ProductGroup["id"];

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "active", label: "Aktif" },
  { key: "passive", label: "Pasif" },
];

/** Accessible on/off switch with its state written out ("Aktif" / "Pasif"). */
function StatusSwitch({
  status,
  saving,
  disabled,
  onToggle,
  label,
}: {
  status: BranchStockStatus;
  saving: boolean;
  disabled: boolean;
  onToggle: () => void;
  label: string;
}) {
  const on = status === "active";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`${label}: ${on ? "Aktif" : "Pasif"}`}
      disabled={disabled}
      onClick={onToggle}
      className="inline-flex min-h-[44px] items-center gap-2.5 rounded-md px-1 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        aria-hidden
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-neutral-900" : "bg-neutral-300"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${on ? "left-[22px]" : "left-0.5"}`}
        />
      </span>
      <span className={`w-12 text-left ${on ? "text-neutral-900" : "text-neutral-500"}`}>
        {saving ? "…" : on ? "Aktif" : "Pasif"}
      </span>
    </button>
  );
}

export function BranchStockManager({
  branchId,
  branchName,
  locked,
  initialRows,
  notCarried,
}: {
  branchId: string;
  branchName: string;
  locked: boolean;
  initialRows: BranchStockRow[];
  notCarried: number;
}) {
  const [rows, setRows] = useState<BranchStockRow[]>(initialRows);
  const [group, setGroup] = useState<GroupKey>("all");
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const say = (tone: "ok" | "err", text: string) => {
    setNotice({ tone, text });
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), tone === "ok" ? 2500 : 6000);
  };

  const activeGroup = group === "all" ? null : PRODUCT_GROUPS.find((g) => g.id === group)!;
  const inGroup = (r: BranchStockRow) => !activeGroup || inProductGroup(activeGroup, r.categorySlug, r.isGift);

  // sub-category chips: the categories present in the chosen group, in taxonomy order
  const subcategories = useMemo(() => {
    if (!activeGroup) return [];
    const present = new Map<string, { name: string; count: number }>();
    for (const r of rows) {
      if (!inProductGroup(activeGroup, r.categorySlug, r.isGift)) continue;
      const cur = present.get(r.categorySlug);
      present.set(r.categorySlug, { name: r.categoryName, count: (cur?.count ?? 0) + 1 });
    }
    const order = activeGroup.categories.length > 0 ? activeGroup.categories : [...present.keys()];
    return order.filter((slug) => present.has(slug)).map((slug) => ({ slug, ...present.get(slug)! }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, group]);

  const groupCounts = useMemo(
    () =>
      Object.fromEntries(
        PRODUCT_GROUPS.map((g) => [g.id, rows.filter((r) => inProductGroup(g, r.categorySlug, r.isGift)).length]),
      ) as Record<ProductGroup["id"], number>,
    [rows],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr");
    return rows.filter((r) => {
      if (!inGroup(r)) return false;
      if (category !== "all" && r.categorySlug !== category) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (q && !`${r.name} ${r.categoryName}`.toLocaleLowerCase("tr").includes(q)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, group, category, statusFilter, search]);

  const activeCount = rows.filter((r) => r.status === "active").length;
  const visibleIds = visible.map((r) => r.productId);
  const selectedVisible = visibleIds.filter((id) => selected.has(id));
  const allVisibleSelected = visibleIds.length > 0 && selectedVisible.length === visibleIds.length;

  /** Optimistic update -> PATCH -> on failure restore the exact previous statuses. */
  const save = async (updates: { productId: string; status: BranchStockStatus }[], okText: string) => {
    const ids = updates.map((u) => u.productId);
    const previous = new Map(rows.filter((r) => ids.includes(r.productId)).map((r) => [r.productId, r.status]));
    const next = new Map(updates.map((u) => [u.productId, u.status]));
    setRows((cur) => cur.map((r) => (next.has(r.productId) ? { ...r, status: next.get(r.productId)! } : r)));
    setPending((cur) => new Set([...cur, ...ids]));
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId, updates }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; rows?: BranchStockRow[]; error?: string };
      if (!res.ok || !data.ok || !data.rows) throw new Error(data.error ?? "Değişiklik kaydedilemedi.");
      setRows(data.rows);
      say("ok", okText);
    } catch (err) {
      setRows((cur) => cur.map((r) => (previous.has(r.productId) ? { ...r, status: previous.get(r.productId)! } : r)));
      say("err", `${err instanceof Error ? err.message : "Değişiklik kaydedilemedi."} Önceki durum geri yüklendi.`);
    } finally {
      setPending((cur) => {
        const s = new Set(cur);
        ids.forEach((id) => s.delete(id));
        return s;
      });
    }
  };

  const toggle = (r: BranchStockRow) => {
    const status: BranchStockStatus = r.status === "active" ? "passive" : "active";
    void save([{ productId: r.productId, status }], `${r.name}: ${status === "active" ? "aktif" : "pasif"} olarak kaydedildi.`);
  };

  const bulk = (status: BranchStockStatus) => {
    const updates = selectedVisible
      .filter((id) => rows.find((r) => r.productId === id)?.status !== status)
      .map((productId) => ({ productId, status }));
    if (updates.length === 0) {
      say("ok", `Seçili ürünler zaten ${status === "active" ? "aktif" : "pasif"}.`);
      return;
    }
    void save(updates, `${updates.length} ürün ${status === "active" ? "aktif" : "pasif"} yapıldı.`).then(() => setSelected(new Set()));
  };

  const toggleSelect = (id: string) =>
    setSelected((cur) => {
      const s = new Set(cur);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });

  const selectAllVisible = () =>
    setSelected((cur) => {
      const s = new Set(cur);
      if (allVisibleSelected) visibleIds.forEach((id) => s.delete(id));
      else visibleIds.forEach((id) => s.add(id));
      return s;
    });

  const tabBtn = (on: boolean) =>
    `inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-md border px-3 text-[13px] transition-colors ${
      on ? "border-neutral-900 bg-neutral-900 font-semibold text-white" : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
    }`;

  return (
    <section className="rounded-lg border border-neutral-200 bg-white">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
        <h2 className="text-[14px] font-semibold text-neutral-900">
          Şube Stokları
          <span className="ml-2 font-normal text-neutral-500">
            {branchName.replace("Funda 1959 ", "")}
            {locked && " · yalnızca bu şube"}
          </span>
        </h2>
        <p className="text-[12.5px] text-neutral-500">
          <span className="font-semibold text-neutral-900">{activeCount}</span> aktif ·{" "}
          <span className="font-semibold text-neutral-900">{rows.length - activeCount}</span> pasif
        </p>
      </div>

      {/* category tabs (same structure as the site's Ürünler menu) */}
      <div className="border-b border-neutral-200 px-4 pt-3">
        <div role="tablist" aria-label="Kategoriler" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button type="button" role="tab" aria-selected={group === "all"} onClick={() => { setGroup("all"); setCategory("all"); }} className={tabBtn(group === "all")}>
            Tümü <span className={group === "all" ? "text-white/70" : "text-neutral-400"}>{rows.length}</span>
          </button>
          {PRODUCT_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={group === g.id}
              onClick={() => {
                setGroup(g.id);
                setCategory("all");
              }}
              className={tabBtn(group === g.id)}
            >
              <NavIcon name={g.icon} className="h-5 w-5 shrink-0" />
              {g.label}
              <span className={group === g.id ? "text-white/70" : "text-neutral-400"}>{groupCounts[g.id]}</span>
            </button>
          ))}
        </div>

        {subcategories.length > 1 && (
          <div aria-label="Alt kategoriler" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[{ slug: "all", name: "Tümü", count: groupCounts[activeGroup!.id] }, ...subcategories].map((c) => (
              <button
                key={c.slug}
                type="button"
                aria-pressed={category === c.slug}
                onClick={() => setCategory(c.slug)}
                className={`min-h-[36px] shrink-0 rounded-full border px-3 text-[12.5px] transition-colors ${
                  category === c.slug ? "border-neutral-900 bg-neutral-100 font-semibold text-neutral-900" : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                }`}
              >
                {c.name} <span className="text-neutral-400">{c.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* search + status filter */}
      <div className="flex flex-col gap-2.5 border-b border-neutral-200 px-4 py-3 sm:flex-row sm:items-center">
        <label className="relative block flex-1 sm:max-w-sm">
          <span className="sr-only">Ürün ara</span>
          <svg aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.3-4.3M11 18a7 7 0 100-14 7 7 0 000 14z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ürün ara…"
            className="h-11 w-full rounded-md border border-neutral-300 bg-white pl-9 pr-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
          />
        </label>
        <div role="radiogroup" aria-label="Durum" className="inline-flex self-start rounded-md border border-neutral-300 p-0.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="radio"
              aria-checked={statusFilter === f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`min-h-[40px] rounded px-3.5 text-[13px] transition-colors ${
                statusFilter === f.key ? "bg-neutral-900 font-semibold text-white" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* bulk bar */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-neutral-200 bg-neutral-50 px-4 py-2">
        <label className="inline-flex min-h-[40px] items-center gap-2 text-[12.5px] text-neutral-700">
          <input type="checkbox" checked={allVisibleSelected} onChange={selectAllVisible} disabled={visibleIds.length === 0} className="h-4 w-4 accent-neutral-900" />
          Görünenleri seç
        </label>
        {selectedVisible.length > 0 && (
          <>
            <span className="text-[12.5px] font-semibold text-neutral-900">{selectedVisible.length} ürün seçildi</span>
            <button type="button" onClick={() => bulk("active")} className="min-h-[36px] rounded-md bg-neutral-900 px-3 text-[12.5px] font-semibold text-white hover:bg-neutral-700">
              Seçilenleri aktif yap
            </button>
            <button type="button" onClick={() => bulk("passive")} className="min-h-[36px] rounded-md border border-neutral-300 bg-white px-3 text-[12.5px] font-semibold text-neutral-900 hover:border-neutral-500">
              Seçilenleri pasif yap
            </button>
            <button type="button" onClick={() => setSelected(new Set())} className="text-[12.5px] text-neutral-500 underline underline-offset-2 hover:text-neutral-900">
              Seçimi temizle
            </button>
          </>
        )}
        <span role="status" aria-live="polite" className={`ml-auto text-[12.5px] ${notice?.tone === "err" ? "font-semibold text-red-700" : "text-neutral-600"}`}>
          {notice?.text}
        </span>
      </div>

      {/* rows */}
      <ul>
        {visible.length === 0 && (
          <li className="px-4 py-10 text-center text-[13px] text-neutral-400">
            {rows.length === 0 ? "Bu şubede tanımlı ürün bulunamadı." : "Filtrelere uyan ürün yok."}
          </li>
        )}
        {visible.map((r) => (
          <li key={r.productId} className="flex items-center gap-3 border-b border-neutral-100 px-4 py-2 last:border-b-0 hover:bg-neutral-50">
            <input
              type="checkbox"
              aria-label={`${r.name} seç`}
              checked={selected.has(r.productId)}
              onChange={() => toggleSelect(r.productId)}
              className="h-4 w-4 shrink-0 accent-neutral-900"
            />
            <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-md bg-neutral-100 text-[15px] font-semibold text-neutral-400">
              {r.image ? <Image src={r.image} alt="" fill sizes="44px" className="object-cover" /> : r.name.charAt(0)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 block text-[14px] font-medium leading-snug text-neutral-900 sm:truncate">{r.name}</span>
              <span className="mt-0.5 block truncate text-[12px] text-neutral-500">
                {r.categoryName}
                {r.isGift && " · Hediyelik"}
              </span>
            </span>
            <StatusSwitch status={r.status} saving={pending.has(r.productId)} disabled={pending.has(r.productId)} onToggle={() => toggle(r)} label={r.name} />
          </li>
        ))}
      </ul>

      {notCarried > 0 && (
        <p className="border-t border-neutral-200 px-4 py-2.5 text-[12px] text-neutral-500">
          {notCarried} ürün bu şubenin menüsünde yer almıyor; bu liste yalnızca şubede satılan ürünleri gösterir.
        </p>
      )}
    </section>
  );
}
