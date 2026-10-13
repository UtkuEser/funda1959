"use client";

import { useMemo, useState } from "react";
import type { FundaPointsAdminDetail, FundaPointsAdminRow } from "@/lib/funda-points";
import { FUNDA_POINT_TRANSACTION_LABEL_TR } from "@/lib/funda-points";
import { Panel, Table, TableWrap, Th, Td, Row, EmptyRow, Badge } from "@/components/admin/ui";

type FilterKey = "all" | "hasPoints" | "debt" | "recent30d";
type SortKey = "available" | "earned" | "lastActivity";
type SortDir = "asc" | "desc";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "hasPoints", label: "Puanı Olanlar" },
  { key: "debt", label: "Borcu Olanlar" },
  { key: "recent30d", label: "Son 30 Gün Hareketi" },
];

const TR_MONTHS_SHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

/** Istanbul wall time, whatever the browser's zone */
function formatDateTime(iso: string, withTime = true): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const date = `${get("day")} ${TR_MONTHS_SHORT[Number(get("month")) - 1]} ${get("year")}`;
  return withTime ? `${date} ${get("hour")}:${get("minute")}` : date;
}

const fmt = (n: number) => n.toLocaleString("tr-TR");
const signed = (n: number) => `${n > 0 ? "+" : ""}${fmt(n)}`;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function newRequestId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `adj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Merkez Funda Puan screen — members from the database ledger (0011). No
 * demo customers: with no point activity yet it says so. Corrections need a
 * reason; the server signs them with the session's admin and applies a
 * repeated submit (same request id) once.
 */
export function AdminFundaPoints({ initialRows, total }: { initialRows: FundaPointsAdminRow[]; total: number }) {
  const [rows, setRows] = useState<FundaPointsAdminRow[]>(initialRows);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("lastActivity");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const [detail, setDetail] = useState<FundaPointsAdminDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [adjustDirection, setAdjustDirection] = useState<"add" | "subtract">("add");
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustSaving, setAdjustSaving] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const openRow = rows.find((r) => r.userId === openUserId) ?? null;

  const applySort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const visibleRows = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const q = search.trim().toLocaleLowerCase("tr");
    let list = rows.filter(
      (r) =>
        !q ||
        r.fullName.toLocaleLowerCase("tr").includes(q) ||
        r.phone.toLocaleLowerCase("tr").includes(q) ||
        r.email.toLocaleLowerCase("tr").includes(q),
    );
    if (filter === "hasPoints") list = list.filter((r) => r.available > 0);
    if (filter === "debt") list = list.filter((r) => r.debt > 0);
    if (filter === "recent30d") list = list.filter((r) => now - new Date(r.lastActivity).getTime() <= THIRTY_DAYS_MS);
    const dir = sortDir === "asc" ? 1 : -1;
    return [...list].sort((a, b) =>
      sortKey === "lastActivity" ? dir * a.lastActivity.localeCompare(b.lastActivity) : dir * (a[sortKey] - b[sortKey]),
    );
  }, [rows, search, filter, sortKey, sortDir]);

  const syncRow = (d: FundaPointsAdminDetail) => {
    setRows((prev) =>
      prev.map((r) =>
        r.userId === d.userId
          ? {
              ...r,
              available: d.available,
              debt: d.debt,
              lastActivity: d.transactions[0]?.createdAt ?? r.lastActivity,
            }
          : r,
      ),
    );
  };

  const openDetail = async (userId: string) => {
    setOpenUserId(userId);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    setAdjustDirection("add");
    setAdjustPoints("");
    setAdjustReason("");
    setAdjustError(null);
    setRequestId(newRequestId());
    try {
      const res = await fetch(`/api/admin/funda-points?userId=${encodeURIComponent(userId)}`, { cache: "no-store" });
      const data = (await res.json()) as { ok?: boolean; detail?: FundaPointsAdminDetail; error?: string };
      if (res.ok && data.ok && data.detail) {
        setDetail(data.detail);
        syncRow(data.detail);
      } else setDetailError(data.error ?? "Hareketler yüklenemedi.");
    } catch {
      setDetailError("Hareketler yüklenemedi.");
    } finally {
      setDetailLoading(false);
    }
  };

  const submitAdjustment = async () => {
    if (!openUserId || !detail) return;
    const points = Number(adjustPoints);
    if (!Number.isInteger(points) || points <= 0) {
      setAdjustError("Puan geçerli bir pozitif tam sayı olmalı.");
      return;
    }
    const reason = adjustReason.trim();
    if (reason.length < 3) {
      setAdjustError("Gerekçe gerekli (en az 3 karakter).");
      return;
    }
    if (adjustDirection === "subtract" && points > detail.available) {
      setAdjustError("Yetersiz bakiye — kullanılabilir puandan fazlası düşülemez.");
      return;
    }
    const confirmText =
      adjustDirection === "add"
        ? `Bu üyeye ${points} Funda Puan eklenecek${detail.debt > 0 ? " (önce puan borcu kapanır)" : ""}. Devam edilsin mi?`
        : `Bu üyeden ${points} Funda Puan düşülecek. Devam edilsin mi?`;
    if (!window.confirm(confirmText)) return;

    setAdjustSaving(true);
    setAdjustError(null);
    try {
      const res = await fetch("/api/admin/funda-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: openUserId, direction: adjustDirection, points, reason, requestId }),
      });
      const data = (await res.json()) as { ok?: boolean; detail?: FundaPointsAdminDetail; error?: string };
      if (res.ok && data.ok && data.detail) {
        // what the database stored — not what was typed
        setDetail(data.detail);
        syncRow(data.detail);
        setAdjustPoints("");
        setAdjustReason("");
        setRequestId(newRequestId());
        setFeedback("Puan düzeltmesi kaydedildi.");
      } else {
        // same request id kept: a retry after a lost answer can't apply it twice
        setAdjustError(data.error ?? "Kaydedilemedi.");
      }
    } catch {
      setAdjustError("Kaydedilemedi. Bağlantı koptuysa tekrar deneyin; aynı düzeltme iki kez uygulanmaz.");
    } finally {
      setAdjustSaving(false);
    }
  };

  const sortIndicator = (key: SortKey) => (sortKey === key ? (sortDir === "desc" ? " ↓" : " ↑") : "");
  const inputClass =
    "h-9 w-full rounded border border-neutral-300 bg-white px-2.5 text-[13px] text-neutral-900 focus:border-neutral-900 focus:outline-none";
  const labelClass = "mb-1 block text-[11.5px] font-semibold uppercase tracking-[0.04em] text-neutral-500";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Üye ara (ad, telefon, e-posta)…"
          className="h-9 w-full max-w-xs rounded border border-neutral-300 bg-white px-3 text-[13px] text-neutral-900 focus:border-neutral-900 focus:outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-md border px-2.5 py-1 text-[12px] font-medium ${
                filter === f.key ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <p role="status" className="mb-3 text-[12.5px] font-medium text-neutral-500">
          {feedback}
        </p>
      )}
      {total > rows.length && (
        <p className="mb-3 text-[12px] text-neutral-500">
          İlk {rows.length} üye gösteriliyor (toplam {fmt(total)}); aramak için üstteki alanı kullanın.
        </p>
      )}

      <Panel>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Üye</Th>
                <Th>Telefon</Th>
                <Th>E-posta</Th>
                <Th align="right">
                  <button type="button" onClick={() => applySort("available")} className="hover:text-neutral-900">
                    Kullanılabilir{sortIndicator("available")}
                  </button>
                </Th>
                <Th align="right">Borç</Th>
                <Th align="right">
                  <button type="button" onClick={() => applySort("earned")} className="hover:text-neutral-900">
                    Toplam Kazanılan{sortIndicator("earned")}
                  </button>
                </Th>
                <Th align="right">Toplam Kullanılan</Th>
                <Th>
                  <button type="button" onClick={() => applySort("lastActivity")} className="hover:text-neutral-900">
                    Son Hareket{sortIndicator("lastActivity")}
                  </button>
                </Th>
                <Th>İşlem</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <EmptyRow cols={9}>
                  Henüz Funda Puan hareketi olan üye yok. Puanlar, ödeme entegrasyonu açıldıktan sonra ödemesi onaylanan üye
                  siparişlerinden kazanılır.
                </EmptyRow>
              )}
              {rows.length > 0 && visibleRows.length === 0 && <EmptyRow cols={9}>Eşleşen üye yok.</EmptyRow>}
              {visibleRows.map((r) => (
                <Row key={r.userId}>
                  <Td className="font-medium">{r.fullName || "—"}</Td>
                  <Td>{r.phone || "—"}</Td>
                  <Td>{r.email || "—"}</Td>
                  <Td align="right" className="tabular-nums font-semibold">{fmt(r.available)}</Td>
                  <Td align="right" className="tabular-nums">{r.debt > 0 ? fmt(r.debt) : "—"}</Td>
                  <Td align="right" className="tabular-nums">{fmt(r.earned)}</Td>
                  <Td align="right" className="tabular-nums">{fmt(r.spent)}</Td>
                  <Td>{formatDateTime(r.lastActivity)}</Td>
                  <Td>
                    <button
                      type="button"
                      onClick={() => openDetail(r.userId)}
                      className="text-[12.5px] font-semibold text-neutral-700 underline hover:text-neutral-900"
                    >
                      Detay
                    </button>
                  </Td>
                </Row>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </Panel>

      {openUserId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" role="dialog" aria-modal="true">
          <div className="h-full w-full max-w-lg overflow-y-auto border-l border-neutral-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-neutral-900">{detail?.fullName || openRow?.fullName || "Üye"}</h2>
              <button type="button" onClick={() => setOpenUserId(null)} aria-label="Kapat" className="text-neutral-400 hover:text-neutral-900">
                ✕
              </button>
            </div>

            {detailLoading && <p className="text-[12.5px] text-neutral-400">Yükleniyor…</p>}
            {detailError && <p className="text-[12.5px] text-neutral-500">{detailError}</p>}

            {detail && (
              <>
                <dl className="grid grid-cols-2 gap-3 text-[12.5px] text-neutral-600">
                  <div>
                    <dt className="text-neutral-400">Telefon</dt>
                    <dd className="font-medium text-neutral-900">{detail.phone || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-400">E-posta</dt>
                    <dd className="font-medium text-neutral-900">{detail.email || "—"}</dd>
                  </div>
                </dl>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-neutral-200 px-3 py-2">
                    <p className="text-[11px] text-neutral-500">Kullanılabilir Puan</p>
                    <p className="text-[17px] font-semibold tabular-nums">{fmt(detail.available)}</p>
                  </div>
                  <div className="rounded-md border border-neutral-200 px-3 py-2">
                    <p className="text-[11px] text-neutral-500">Puan Borcu</p>
                    <p className="text-[17px] font-semibold tabular-nums">{detail.debt > 0 ? fmt(detail.debt) : "—"}</p>
                  </div>
                </div>

                <h3 className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-[0.04em] text-neutral-500">
                  Kullanılabilir Partiler (son kullanma sırasıyla)
                </h3>
                <TableWrap>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Kaynak</Th>
                        <Th align="right">Kalan</Th>
                        <Th>Kazanıldı</Th>
                        <Th>Son Kullanma</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.lots.length === 0 && <EmptyRow cols={4}>Kullanılabilir puan yok.</EmptyRow>}
                      {detail.lots.map((l) => (
                        <Row key={l.id}>
                          <Td>{l.source === "admin" ? "Merkez düzeltmesi" : l.orderNumber ?? "Sipariş"}</Td>
                          <Td align="right" className="tabular-nums">
                            {fmt(l.remaining)} / {fmt(l.points)}
                          </Td>
                          <Td>{formatDateTime(l.earnedAt, false)}</Td>
                          <Td>{formatDateTime(l.expiresAt, false)}</Td>
                        </Row>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>

                <div className="mt-5 rounded-md border border-neutral-200 p-3.5">
                  <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.04em] text-neutral-500">Puan Düzelt</h3>
                  {adjustError && (
                    <p role="alert" className="mb-2.5 rounded border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 text-[12px] text-neutral-900">
                      {adjustError}
                    </p>
                  )}
                  <div className="grid grid-cols-[auto_1fr] gap-2.5">
                    <div className="flex overflow-hidden rounded border border-neutral-300">
                      <button
                        type="button"
                        onClick={() => setAdjustDirection("add")}
                        className={`px-3 text-[15px] font-semibold ${adjustDirection === "add" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-50"}`}
                        aria-pressed={adjustDirection === "add"}
                        title="Puan ekle"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjustDirection("subtract")}
                        className={`px-3 text-[15px] font-semibold ${adjustDirection === "subtract" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-50"}`}
                        aria-pressed={adjustDirection === "subtract"}
                        title="Puan düş"
                      >
                        −
                      </button>
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="fp-adjust-points">Puan</label>
                      <input
                        id="fp-adjust-points"
                        type="number"
                        min={1}
                        step={1}
                        className={inputClass}
                        value={adjustPoints}
                        onChange={(e) => setAdjustPoints(e.target.value)}
                        placeholder="100"
                      />
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <label className={labelClass} htmlFor="fp-adjust-reason">Gerekçe</label>
                    <input
                      id="fp-adjust-reason"
                      type="text"
                      maxLength={300}
                      className={inputClass}
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="Müşteri hizmetleri düzeltmesi — sebep"
                    />
                  </div>
                  <p className="mt-2 text-[11.5px] text-neutral-500">
                    Eklenen puan 1 yıl geçerli bir parti olur; düşüş son kullanma tarihi en yakın partiden yapılır. Kayıtta işlemi
                    yapan hesap ve gerekçe saklanır.
                  </p>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={submitAdjustment}
                      disabled={adjustSaving}
                      className="rounded-md bg-neutral-900 px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-neutral-700 disabled:bg-neutral-300"
                    >
                      {adjustSaving ? "Kaydediliyor…" : "Kaydet"}
                    </button>
                  </div>
                </div>

                <h3 className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-[0.04em] text-neutral-500">Puan Hareketleri</h3>
                <TableWrap>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Tarih</Th>
                        <Th>İşlem</Th>
                        <Th>Sipariş / Gerekçe</Th>
                        <Th align="right">Puan</Th>
                        <Th align="right">Sonra</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.transactions.length === 0 && <EmptyRow cols={5}>Hareket yok.</EmptyRow>}
                      {detail.transactions.map((t) => (
                        <Row key={t.id}>
                          <Td>{formatDateTime(t.createdAt)}</Td>
                          <Td>
                            <Badge>{FUNDA_POINT_TRANSACTION_LABEL_TR[t.type]}</Badge>
                          </Td>
                          <Td>
                            {t.orderNumber ?? "—"}
                            {t.reason && (
                              <span className="block text-[11.5px] text-neutral-500">
                                {t.reason}
                                {t.actorName ? ` · ${t.actorName}` : ""}
                              </span>
                            )}
                            {t.expiredPoints > 0 && (
                              <span className="block text-[11.5px] text-neutral-500">{fmt(t.expiredPoints)} puanın süresi dolmuştu</span>
                            )}
                          </Td>
                          <Td align="right" className="tabular-nums font-medium">{signed(t.points)}</Td>
                          <Td align="right" className="tabular-nums">
                            {fmt(t.availableAfter)}
                            {t.debtAfter > 0 && <span className="block text-[11px] text-neutral-500">borç {fmt(t.debtAfter)}</span>}
                          </Td>
                        </Row>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
