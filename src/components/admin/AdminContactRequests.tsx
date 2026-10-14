"use client";

import { useState } from "react";
import {
  CONTACT_LIMITS,
  CONTACT_STATUSES,
  CONTACT_STATUS_LABEL,
  CONTACT_SUBJECT_LABEL,
  type ContactRequest,
  type ContactRequestPage,
  type ContactStatus,
} from "@/lib/contact";
import { Panel, Table, TableWrap, Th, Td, Row, EmptyRow, Badge } from "@/components/admin/ui";

const TR_MONTHS_SHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

/** Istanbul wall time, whatever the browser's zone */
function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
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
  return `${get("day")} ${TR_MONTHS_SHORT[Number(get("month")) - 1]} ${get("year")} ${get("hour")}:${get("minute")}`;
}

type Filter = ContactStatus | "all";

/**
 * Merkez İletişim Talepleri (D43): newest first, filter by status, a detail
 * panel with the message, status (Yeni / İşlemde / Kapandı) and the internal
 * note. What the screen shows after a change is what the database returned.
 */
export function AdminContactRequests({ initial }: { initial: ContactRequestPage }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [rows, setRows] = useState<ContactRequest[]>(initial.rows);
  const [total, setTotal] = useState(initial.total);
  const [counts, setCounts] = useState(initial.counts);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState<"status" | "note" | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailInfo, setDetailInfo] = useState<string | null>(null);

  const open = rows.find((r) => r.id === openId) ?? null;
  const allCount = counts.new + counts.in_progress + counts.closed;

  const load = async (next: Filter, offset: number) => {
    setLoading(true);
    setListError(null);
    try {
      const q = new URLSearchParams({ offset: String(offset) });
      if (next !== "all") q.set("status", next);
      const res = await fetch(`/api/admin/contact-requests?${q}`, { cache: "no-store" });
      const data = (await res.json()) as Partial<ContactRequestPage> & { ok?: boolean; error?: string };
      if (!res.ok || !data.ok || !data.rows || !data.counts) {
        setListError(data.error ?? "Talepler okunamadı.");
        return;
      }
      setRows((prev) => (offset === 0 ? data.rows! : [...prev, ...data.rows!]));
      setTotal(data.total ?? 0);
      setCounts(data.counts);
    } catch {
      setListError("Talepler okunamadı.");
    } finally {
      setLoading(false);
    }
  };

  const chooseFilter = (next: Filter) => {
    setFilter(next);
    void load(next, 0);
  };

  const openDetail = (r: ContactRequest) => {
    setOpenId(r.id);
    setNote(r.internalNote ?? "");
    setDetailError(null);
    setDetailInfo(null);
  };

  const save = async (change: { status?: ContactStatus; note?: string | null }, kind: "status" | "note") => {
    if (!open) return;
    setSaving(kind);
    setDetailError(null);
    setDetailInfo(null);
    try {
      const res = await fetch("/api/admin/contact-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: open.id, ...change }),
      });
      const data = (await res.json()) as { ok?: boolean; request?: ContactRequest; error?: string };
      if (!res.ok || !data.ok || !data.request) {
        setDetailError(data.error ?? "Kaydedilemedi.");
        return;
      }
      const saved = data.request;
      if (saved.status !== open.status) {
        setCounts((c) => ({ ...c, [open.status]: Math.max(0, c[open.status] - 1), [saved.status]: c[saved.status] + 1 }));
      }
      setRows((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      setNote(saved.internalNote ?? "");
      setDetailInfo(kind === "status" ? `Durum: ${CONTACT_STATUS_LABEL[saved.status]}` : "İç not kaydedildi.");
    } catch {
      setDetailError("Kaydedilemedi. Bağlantıyı kontrol edip tekrar deneyin.");
    } finally {
      setSaving(null);
    }
  };

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "Tümü", count: allCount },
    ...CONTACT_STATUSES.map((s) => ({ key: s, label: CONTACT_STATUS_LABEL[s], count: counts[s] })),
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => chooseFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`rounded-md border px-2.5 py-1 text-[12px] font-medium ${
              filter === f.key ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {f.label} ({f.count.toLocaleString("tr-TR")})
          </button>
        ))}
      </div>
      {listError && (
        <p role="alert" className="mb-3 text-[12.5px] text-neutral-700">
          {listError}
        </p>
      )}

      <Panel>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Tarih</Th>
                <Th>Ad Soyad</Th>
                <Th>Konu</Th>
                <Th>İletişim</Th>
                <Th>Durum</Th>
                <Th>İşlem</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <EmptyRow cols={6}>{loading ? "Yükleniyor…" : filter === "all" ? "Henüz iletişim talebi yok." : "Bu durumda talep yok."}</EmptyRow>
              )}
              {rows.map((r) => (
                <Row key={r.id}>
                  <Td>{formatDateTime(r.createdAt)}</Td>
                  <Td className="font-medium">{r.fullName}</Td>
                  <Td>{CONTACT_SUBJECT_LABEL[r.subject] ?? r.subject}</Td>
                  <Td>
                    {r.phone && <span className="block">{r.phone}</span>}
                    {r.email && <span className="block text-neutral-500">{r.email}</span>}
                  </Td>
                  <Td>
                    <Badge strong={r.status === "new"}>{CONTACT_STATUS_LABEL[r.status]}</Badge>
                  </Td>
                  <Td>
                    <button
                      type="button"
                      onClick={() => openDetail(r)}
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
      {rows.length < total && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            disabled={loading}
            onClick={() => load(filter, rows.length)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-[12.5px] font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            {loading ? "Yükleniyor…" : `Daha fazla göster (${rows.length} / ${total})`}
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" role="dialog" aria-modal="true" aria-label="İletişim talebi">
          <div className="h-full w-full max-w-lg overflow-y-auto border-l border-neutral-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-neutral-900">{open.fullName}</h2>
              <button type="button" onClick={() => setOpenId(null)} aria-label="Kapat" className="text-neutral-400 hover:text-neutral-900">
                ✕
              </button>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-[12.5px] text-neutral-600">
              <div>
                <dt className="text-neutral-400">Tarih</dt>
                <dd className="font-medium text-neutral-900">{formatDateTime(open.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-neutral-400">Konu</dt>
                <dd className="font-medium text-neutral-900">{CONTACT_SUBJECT_LABEL[open.subject] ?? open.subject}</dd>
              </div>
              <div>
                <dt className="text-neutral-400">Telefon</dt>
                <dd className="font-medium text-neutral-900">
                  {open.phone ? <a href={`tel:${open.phone.replace(/[^\d+]/g, "")}`} className="underline">{open.phone}</a> : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-400">E-posta</dt>
                <dd className="break-all font-medium text-neutral-900">
                  {open.email ? <a href={`mailto:${open.email}`} className="underline">{open.email}</a> : "—"}
                </dd>
              </div>
            </dl>

            <h3 className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-[0.04em] text-neutral-500">Mesaj</h3>
            <p className="whitespace-pre-wrap break-words rounded-md border border-neutral-200 bg-neutral-50 p-3 text-[13px] text-neutral-900">
              {open.message}
            </p>

            {detailError && (
              <p role="alert" className="mt-4 rounded border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 text-[12px] text-neutral-900">
                {detailError}
              </p>
            )}
            {detailInfo && (
              <p role="status" className="mt-4 text-[12px] font-medium text-neutral-500">
                {detailInfo}
              </p>
            )}

            <h3 className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-[0.04em] text-neutral-500">Durum</h3>
            <div className="flex flex-wrap gap-1.5">
              {CONTACT_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={saving !== null || open.status === s}
                  onClick={() => save({ status: s }, "status")}
                  aria-pressed={open.status === s}
                  className={`rounded-md border px-3 py-1.5 text-[12.5px] font-semibold ${
                    open.status === s ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                  } disabled:cursor-default`}
                >
                  {CONTACT_STATUS_LABEL[s]}
                </button>
              ))}
            </div>
            {open.handledAt && (
              <p className="mt-1.5 text-[11.5px] text-neutral-500">
                Son durum değişikliği: {formatDateTime(open.handledAt)}
                {open.handledBy ? ` · ${open.handledBy}` : ""}
              </p>
            )}

            <h3 className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-[0.04em] text-neutral-500">
              İç not (yalnızca Merkez)
            </h3>
            <label htmlFor="contact-note" className="sr-only">
              İç not
            </label>
            <textarea
              id="contact-note"
              rows={4}
              maxLength={CONTACT_LIMITS.noteMax}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded border border-neutral-300 bg-white px-2.5 py-2 text-[13px] text-neutral-900 focus:border-neutral-900 focus:outline-none"
              placeholder="Örn. arandı, teklif gönderildi"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-[11.5px] text-neutral-500">
                {open.noteUpdatedAt ? `Son düzenleme: ${formatDateTime(open.noteUpdatedAt)}${open.noteUpdatedBy ? ` · ${open.noteUpdatedBy}` : ""}` : ""}
              </p>
              <button
                type="button"
                disabled={saving !== null || note.trim() === (open.internalNote ?? "")}
                onClick={() => save({ note: note.trim() === "" ? null : note }, "note")}
                className="rounded-md bg-neutral-900 px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-neutral-700 disabled:bg-neutral-300"
              >
                {saving === "note" ? "Kaydediliyor…" : "Notu kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
