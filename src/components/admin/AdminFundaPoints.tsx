"use client";

import { useMemo, useState } from "react";
import type { FundaPointAccount, FundaPointTransaction } from "@/lib/funda-points";
import { FUNDA_POINT_TRANSACTION_LABEL_TR } from "@/lib/funda-points";
import { Panel, Table, TableWrap, Th, Td, Row, EmptyRow, Badge } from "@/components/admin/ui";

type FilterKey = "all" | "hasPoints" | "recent30d" | "topBalance";
type SortKey = "balance" | "lifetimeEarned" | "updatedAt";
type SortDir = "asc" | "desc";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "hasPoints", label: "Puanı Olanlar" },
  { key: "recent30d", label: "Son 30 Gün Hareketi" },
  { key: "topBalance", label: "En Yüksek Puan" },
];

const TR_MONTHS_SHORT = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getDate()} ${TR_MONTHS_SHORT[d.getMonth()]} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatPoints(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("tr-TR")}`;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function AdminFundaPoints({
  initialAccounts,
  as,
}: {
  initialAccounts: FundaPointAccount[];
  as: string;
}) {
  const [accounts, setAccounts] = useState<FundaPointAccount[]>(initialAccounts);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [openCustomerId, setOpenCustomerId] = useState<string | null>(null);
  const [detailTransactions, setDetailTransactions] = useState<FundaPointTransaction[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [adjustDirection, setAdjustDirection] = useState<"add" | "subtract">("add");
  const [adjustPointsValue, setAdjustPointsValue] = useState("");
  const [adjustDescription, setAdjustDescription] = useState("");
  const [adjustSaving, setAdjustSaving] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const openAccount = accounts.find((a) => a.customerId === openCustomerId) ?? null;

  const applySort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const selectFilter = (key: FilterKey) => {
    setFilter(key);
    if (key === "topBalance") {
      setSortKey("balance");
      setSortDir("desc");
    }
  };

  const visibleAccounts = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const q = search.trim().toLocaleLowerCase("tr");
    let rows = accounts.filter((a) => {
      if (!q) return true;
      return (
        a.customerName.toLocaleLowerCase("tr").includes(q) ||
        a.customerPhone.toLocaleLowerCase("tr").includes(q) ||
        a.customerEmail.toLocaleLowerCase("tr").includes(q)
      );
    });

    if (filter === "hasPoints") rows = rows.filter((a) => a.balance > 0);
    if (filter === "recent30d") rows = rows.filter((a) => now - new Date(a.updatedAt).getTime() <= THIRTY_DAYS_MS);
    if (filter === "topBalance") rows = rows.filter((a) => a.balance > 0);

    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sortKey === "updatedAt") {
        return dir * a.updatedAt.localeCompare(b.updatedAt);
      }
      return dir * (a[sortKey] - b[sortKey]);
    });
  }, [accounts, search, filter, sortKey, sortDir]);

  const openDetail = async (customerId: string) => {
    setOpenCustomerId(customerId);
    setDetailError(null);
    setDetailLoading(true);
    setDetailTransactions([]);
    setAdjustDirection("add");
    setAdjustPointsValue("");
    setAdjustDescription("");
    setAdjustError(null);
    try {
      const res = await fetch(
        `/api/admin/funda-points?customerId=${encodeURIComponent(customerId)}&as=${encodeURIComponent(as)}`,
      );
      const data = (await res.json()) as {
        ok?: boolean;
        account?: FundaPointAccount;
        transactions?: FundaPointTransaction[];
        error?: string;
      };
      if (res.ok && data.ok && data.transactions) {
        setDetailTransactions(data.transactions);
        if (data.account) {
          setAccounts((prev) => prev.map((a) => (a.customerId === customerId ? data.account! : a)));
        }
      } else {
        setDetailError(data.error ?? "Hareketler yüklenemedi.");
      }
    } catch {
      setDetailError("Hareketler yüklenemedi.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setOpenCustomerId(null);
    setDetailError(null);
  };

  const submitAdjustment = async () => {
    if (!openAccount) return;
    const points = Math.floor(Number(adjustPointsValue));
    if (!Number.isFinite(points) || points <= 0) {
      setAdjustError("Puan geçerli bir pozitif sayı olmalı.");
      return;
    }
    if (!adjustDescription.trim()) {
      setAdjustError("Açıklama gerekli.");
      return;
    }
    if (adjustDirection === "subtract" && points > openAccount.balance) {
      setAdjustError("Yetersiz bakiye — bu düşüş müşteriyi eksiye götürür.");
      return;
    }

    const confirmText =
      adjustDirection === "add"
        ? `Bu müşteriye ${points} Funda Puan eklenecek. Devam edilsin mi?`
        : `Bu müşteriden ${points} Funda Puan düşülecek. Devam edilsin mi?`;
    if (!window.confirm(confirmText)) return;

    setAdjustSaving(true);
    setAdjustError(null);
    try {
      const res = await fetch("/api/admin/funda-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          as,
          customerId: openAccount.customerId,
          direction: adjustDirection,
          points,
          description: adjustDescription.trim(),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        account?: FundaPointAccount;
        transactions?: FundaPointTransaction[];
        error?: string;
      };
      if (res.ok && data.ok && data.account && data.transactions) {
        setAccounts((prev) => prev.map((a) => (a.customerId === data.account!.customerId ? data.account! : a)));
        setDetailTransactions(data.transactions);
        setAdjustPointsValue("");
        setAdjustDescription("");
        setFeedback("Puan düzeltmesi kaydedildi.");
      } else {
        setAdjustError(data.error ?? "Kaydedilemedi.");
      }
    } catch {
      setAdjustError("Kaydedilemedi.");
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
          placeholder="Müşteri ara…"
          className="h-9 w-full max-w-xs rounded border border-neutral-300 bg-white px-3 text-[13px] text-neutral-900 focus:border-neutral-900 focus:outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => selectFilter(f.key)}
              className={`rounded-md border px-2.5 py-1 text-[12px] font-medium ${
                filter === f.key
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
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

      <Panel>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Müşteri</Th>
                <Th>Telefon</Th>
                <Th>E-posta</Th>
                <Th align="right">
                  <button type="button" onClick={() => applySort("balance")} className="hover:text-neutral-900">
                    Mevcut Puan{sortIndicator("balance")}
                  </button>
                </Th>
                <Th align="right">
                  <button type="button" onClick={() => applySort("lifetimeEarned")} className="hover:text-neutral-900">
                    Toplam Kazanılan{sortIndicator("lifetimeEarned")}
                  </button>
                </Th>
                <Th align="right">Toplam Kullanılan</Th>
                <Th>
                  <button type="button" onClick={() => applySort("updatedAt")} className="hover:text-neutral-900">
                    Son Hareket{sortIndicator("updatedAt")}
                  </button>
                </Th>
                <Th>İşlem</Th>
              </tr>
            </thead>
            <tbody>
              {visibleAccounts.length === 0 && <EmptyRow cols={8}>Eşleşen müşteri yok.</EmptyRow>}
              {visibleAccounts.map((a) => (
                <Row key={a.customerId}>
                  <Td className="font-medium">{a.customerName || "—"}</Td>
                  <Td>{a.customerPhone || "—"}</Td>
                  <Td>{a.customerEmail || "—"}</Td>
                  <Td align="right" className="tabular-nums font-semibold">
                    {a.balance.toLocaleString("tr-TR")}
                  </Td>
                  <Td align="right" className="tabular-nums">{a.lifetimeEarned.toLocaleString("tr-TR")}</Td>
                  <Td align="right" className="tabular-nums">{a.lifetimeSpent.toLocaleString("tr-TR")}</Td>
                  <Td>{formatDateTime(a.updatedAt)}</Td>
                  <Td>
                    <button
                      type="button"
                      onClick={() => openDetail(a.customerId)}
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

      {openCustomerId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" role="dialog" aria-modal="true">
          <div className="h-full w-full max-w-lg overflow-y-auto border-l border-neutral-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-neutral-900">
                {openAccount?.customerName || "Müşteri"}
              </h2>
              <button type="button" onClick={closeDetail} aria-label="Kapat" className="text-neutral-400 hover:text-neutral-900">
                ✕
              </button>
            </div>

            {openAccount && (
              <>
                <dl className="grid grid-cols-2 gap-3 text-[12.5px] text-neutral-600">
                  <div>
                    <dt className="text-neutral-400">Telefon</dt>
                    <dd className="font-medium text-neutral-900">{openAccount.customerPhone || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-400">E-posta</dt>
                    <dd className="font-medium text-neutral-900">{openAccount.customerEmail || "—"}</dd>
                  </div>
                </dl>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-md border border-neutral-200 px-3 py-2">
                    <p className="text-[11px] text-neutral-500">Mevcut Puan</p>
                    <p className="text-[17px] font-semibold tabular-nums">{openAccount.balance.toLocaleString("tr-TR")}</p>
                  </div>
                  <div className="rounded-md border border-neutral-200 px-3 py-2">
                    <p className="text-[11px] text-neutral-500">Toplam Kazanılan</p>
                    <p className="text-[17px] font-semibold tabular-nums">{openAccount.lifetimeEarned.toLocaleString("tr-TR")}</p>
                  </div>
                  <div className="rounded-md border border-neutral-200 px-3 py-2">
                    <p className="text-[11px] text-neutral-500">Toplam Kullanılan</p>
                    <p className="text-[17px] font-semibold tabular-nums">{openAccount.lifetimeSpent.toLocaleString("tr-TR")}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-md border border-neutral-200 p-3.5">
                  <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.04em] text-neutral-500">
                    Puan Düzenle
                  </h3>
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
                        className={`px-3 text-[15px] font-semibold ${
                          adjustDirection === "add" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-50"
                        }`}
                        aria-pressed={adjustDirection === "add"}
                        title="Puan ekle"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjustDirection("subtract")}
                        className={`px-3 text-[15px] font-semibold ${
                          adjustDirection === "subtract" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-50"
                        }`}
                        aria-pressed={adjustDirection === "subtract"}
                        title="Puan düş"
                      >
                        −
                      </button>
                    </div>
                    <div>
                      <label className={labelClass}>Puan</label>
                      <input
                        type="number"
                        min={1}
                        className={inputClass}
                        value={adjustPointsValue}
                        onChange={(e) => setAdjustPointsValue(e.target.value)}
                        placeholder="100"
                      />
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <label className={labelClass}>Açıklama</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={adjustDescription}
                      onChange={(e) => setAdjustDescription(e.target.value)}
                      placeholder="Merkez müşteri hizmetleri düzeltmesi"
                    />
                  </div>
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
              </>
            )}

            <h3 className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-[0.04em] text-neutral-500">
              Puan Hareketleri
            </h3>

            {detailLoading && <p className="text-[12.5px] text-neutral-400">Yükleniyor…</p>}
            {detailError && <p className="text-[12.5px] text-neutral-500">{detailError}</p>}

            {!detailLoading && !detailError && (
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <Th>Tarih</Th>
                      <Th>İşlem</Th>
                      <Th>Sipariş</Th>
                      <Th align="right">Puan</Th>
                      <Th align="right">Bakiye</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailTransactions.length === 0 && <EmptyRow cols={5}>Hareket yok.</EmptyRow>}
                    {detailTransactions.map((t) => (
                      <Row key={t.id}>
                        <Td>{formatDateTime(t.createdAt)}</Td>
                        <Td>
                          <Badge>{FUNDA_POINT_TRANSACTION_LABEL_TR[t.type]}</Badge>
                        </Td>
                        <Td>{t.orderNumber ?? "—"}</Td>
                        <Td align="right" className="tabular-nums font-medium">{formatPoints(t.points)}</Td>
                        <Td align="right" className="tabular-nums">{t.balanceAfter.toLocaleString("tr-TR")}</Td>
                      </Row>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </div>
        </div>
      )}
    </>
  );
}
