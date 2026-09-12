"use client";

import { useMemo, useState } from "react";
import type { AdminRole } from "@/lib/admin/access";
import type { BranchStockRow } from "@/lib/inventory/stock-view";

type RowPatch = { active?: boolean; stockQuantity?: number; dailyCapacity?: number };

const MODE_LABEL: Record<BranchStockRow["stockMode"], string> = {
  quantity: "Hazır Stok",
  daily_capacity: "Günlük Üretim",
  made_to_order: "Sipariş Üzerine",
};

type FilterKey = "all" | "quantity" | "daily_capacity" | "made_to_order" | "out";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "quantity", label: "Hazır Stok" },
  { key: "daily_capacity", label: "Günlük Üretim" },
  { key: "made_to_order", label: "Sipariş Üzerine" },
  { key: "out", label: "Tükenenler" },
];

export function BranchStockManager({
  role,
  branchId,
  branchName,
  locked,
  initialRows,
  date,
  as,
}: {
  role: AdminRole;
  branchId: string;
  branchName: string;
  locked: boolean;
  initialRows: BranchStockRow[];
  date: string;
  as: string;
}) {
  void role;
  const [rows, setRows] = useState<BranchStockRow[]>(initialRows);
  const [changes, setChanges] = useState<Record<string, RowPatch>>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const dirtyCount = Object.keys(changes).length;

  const effective = (r: BranchStockRow) => {
    const c = changes[r.productId] ?? {};
    return {
      active: c.active ?? r.active,
      stockQuantity: c.stockQuantity ?? r.stockQuantity,
      dailyCapacity: c.dailyCapacity ?? r.dailyCapacity,
    };
  };

  const visible = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr");
    return rows.filter((r) => {
      if (q && !`${r.name} ${r.categoryName}`.toLocaleLowerCase("tr").includes(q)) return false;
      if (filter === "all") return true;
      if (filter === "out") {
        const e = effective(r);
        if (r.stockMode === "quantity") return e.active && e.stockQuantity <= 0;
        if (r.stockMode === "daily_capacity")
          return e.active && e.dailyCapacity - r.confirmedToday - r.reservedToday <= 0;
        return false;
      }
      return r.stockMode === filter;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, search, filter, changes]);

  const patch = (productId: string, p: RowPatch) => {
    setFeedback(null);
    setChanges((prev) => {
      const merged = { ...prev[productId], ...p };
      const row = rows.find((r) => r.productId === productId)!;
      const same =
        (merged.active ?? row.active) === row.active &&
        (merged.stockQuantity ?? row.stockQuantity) === row.stockQuantity &&
        (merged.dailyCapacity ?? row.dailyCapacity) === row.dailyCapacity;
      const next = { ...prev };
      if (same) delete next[productId];
      else next[productId] = merged;
      return next;
    });
  };

  const save = async () => {
    if (dirtyCount === 0 || saving) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ as, branchId, date, changes }),
      });
      const data = (await res.json()) as { ok?: boolean; rows?: BranchStockRow[]; error?: string };
      if (res.ok && data.ok && data.rows) {
        setRows(data.rows);
        setChanges({});
        setFeedback({ tone: "ok", text: "Stok bilgileri güncellendi." });
      } else {
        setFeedback({ tone: "err", text: data.error ?? "Değişiklikler kaydedilemedi." });
      }
    } catch {
      setFeedback({ tone: "err", text: "Değişiklikler kaydedilemedi." });
    } finally {
      setSaving(false);
    }
  };

  const inputBase =
    "h-8 rounded border border-neutral-300 bg-white text-center text-[13px] text-neutral-900 focus:border-neutral-900 focus:outline-none";

  return (
    <section className="rounded-lg border border-neutral-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
        <h2 className="text-[14px] font-semibold text-neutral-900">
          Şube Stokları
          <span className="ml-2 font-normal text-neutral-500">
            {branchName.replace("Funda 1959 ", "")}
            {locked && " · kilitli"} · {date}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          {feedback && (
            <span
              role="status"
              className={`text-[12px] font-medium ${feedback.tone === "ok" ? "text-neutral-900" : "text-neutral-900 underline"}`}
            >
              {feedback.text}
            </span>
          )}
          <button
            type="button"
            onClick={save}
            disabled={dirtyCount === 0 || saving}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {saving
              ? "Kaydediliyor…"
              : dirtyCount > 0
                ? `Değişiklikleri Kaydet (${dirtyCount})`
                : "Değişiklikleri Kaydet"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 px-4 py-2.5">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ürün ara..."
          className="h-8 w-full max-w-[220px] rounded border border-neutral-300 bg-white px-2.5 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
        />
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded border px-2 py-1 text-[12px] transition-colors ${
              filter === f.key
                ? "border-neutral-900 bg-neutral-900 font-semibold text-white"
                : "border-neutral-300 text-neutral-600 hover:border-neutral-400"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {["Ürün", "Tip", "Mevcut / Kalan", "Durum", "İşlem"].map((h) => (
                <th
                  key={h}
                  className="border-b border-neutral-200 bg-neutral-50 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-neutral-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-[13px] text-neutral-400">
                  {rows.length === 0 ? "Bu şubede tanımlı ürün bulunamadı." : "Filtreye uyan ürün yok."}
                </td>
              </tr>
            )}
            {visible.map((r) => {
              const e = effective(r);
              const isDirty = Boolean(changes[r.productId]);
              return (
                <tr key={r.productId} className={isDirty ? "bg-neutral-50" : "hover:bg-neutral-50"}>
                  <td className="border-b border-neutral-100 px-3 py-2.5">
                    <p className="font-medium text-neutral-900">{r.name}</p>
                    <p className="text-[11.5px] text-neutral-400">{r.categoryName}</p>
                  </td>
                  <td className="border-b border-neutral-100 px-3 py-2.5 text-[12.5px] text-neutral-600">
                    {MODE_LABEL[r.stockMode]}
                  </td>
                  <td className="border-b border-neutral-100 px-3 py-2.5">
                    {r.stockMode === "quantity" && (
                      <div className="inline-flex items-center">
                        <button
                          type="button"
                          aria-label="Azalt"
                          onClick={() => patch(r.productId, { stockQuantity: Math.max(0, e.stockQuantity - 1) })}
                          className="flex h-8 w-7 items-center justify-center rounded-l border border-neutral-300 text-[14px] text-neutral-700 hover:bg-neutral-100"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={e.stockQuantity}
                          onChange={(ev) =>
                            patch(r.productId, {
                              stockQuantity: Math.max(0, Math.floor(Number(ev.target.value) || 0)),
                            })
                          }
                          className={`${inputBase} w-14 rounded-none border-x-0 font-semibold`}
                        />
                        <button
                          type="button"
                          aria-label="Artır"
                          onClick={() => patch(r.productId, { stockQuantity: e.stockQuantity + 1 })}
                          className="flex h-8 w-7 items-center justify-center rounded-r border border-neutral-300 text-[14px] text-neutral-700 hover:bg-neutral-100"
                        >
                          +
                        </button>
                      </div>
                    )}
                    {r.stockMode === "daily_capacity" && (
                      <span className="inline-flex items-center gap-2">
                        <span className="font-semibold tabular-nums text-neutral-900">
                          {Math.max(0, e.dailyCapacity - r.confirmedToday - r.reservedToday)}
                        </span>
                        <span className="text-neutral-400">/</span>
                        <input
                          type="number"
                          min={0}
                          value={e.dailyCapacity}
                          aria-label="Günlük kapasite"
                          onChange={(ev) =>
                            patch(r.productId, {
                              dailyCapacity: Math.max(0, Math.floor(Number(ev.target.value) || 0)),
                            })
                          }
                          className={`${inputBase} w-14`}
                        />
                        <span className="text-[11px] text-neutral-400">
                          ({r.confirmedToday} onaylı · {r.reservedToday} rezerve)
                        </span>
                      </span>
                    )}
                    {r.stockMode === "made_to_order" && (
                      <span className="text-neutral-600">{Math.round(r.prepTimeMinutes / 60)} saat hazırlık</span>
                    )}
                  </td>
                  <td className="border-b border-neutral-100 px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => patch(r.productId, { active: !e.active })}
                      aria-pressed={e.active}
                      className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[12px] font-medium transition-colors ${
                        e.active
                          ? "border-neutral-900 text-neutral-900"
                          : "border-neutral-300 text-neutral-400"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`h-1.5 w-1.5 rounded-full ${e.active ? "bg-neutral-900" : "bg-neutral-300"}`}
                      />
                      {e.active ? "Aktif" : "Pasif"}
                    </button>
                  </td>
                  <td className="border-b border-neutral-100 px-3 py-2.5">
                    {r.stockMode === "made_to_order" ? (
                      <span className="text-[12px] text-neutral-400">—</span>
                    ) : isDirty ? (
                      <button
                        type="button"
                        onClick={() =>
                          setChanges((prev) => {
                            const next = { ...prev };
                            delete next[r.productId];
                            return next;
                          })
                        }
                        className="text-[12px] font-semibold text-neutral-500 underline hover:text-neutral-900"
                      >
                        Geri al
                      </button>
                    ) : (
                      <span className="text-[12px] text-neutral-400">{r.edited ? "düzenlendi" : "—"}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
