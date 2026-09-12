"use client";

import { useState } from "react";
import Image from "next/image";
import type { Campaign, NewCampaignInput } from "@/lib/campaigns";
import {
  CAMPAIGN_STATUS_LABEL_TR,
  getCampaignStatus,
  istanbulDateInputValue,
  istanbulDateTimeToISO,
  istanbulTimeInputValue,
  nowInIstanbul,
} from "@/lib/campaigns";
import { Panel, Table, TableWrap, Th, Td, Row, EmptyRow, Badge } from "@/components/admin/ui";

type Branch = { id: string; name: string };

const TR_MONTHS_SHORT = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];

function istanbulDateParts(iso: string): { day: number; month: number } {
  const [, m, d] = istanbulDateInputValue(iso).split("-").map(Number);
  return { day: d, month: m };
}

function formatRange(startAt: string, endAt: string): string {
  const a = istanbulDateParts(startAt);
  const b = istanbulDateParts(endAt);
  if (a.month === b.month) return `${a.day}–${b.day} ${TR_MONTHS_SHORT[a.month - 1]}`;
  return `${a.day} ${TR_MONTHS_SHORT[a.month - 1]} – ${b.day} ${TR_MONTHS_SHORT[b.month - 1]}`;
}

/**
 * Live preview for the "Görsel" field. Keyed by path from the caller so a
 * new path remounts this (fresh `failed` state) instead of needing an
 * effect to reset it.
 */
function CampaignImagePreview({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  const trimmed = src.trim();

  if (!trimmed) {
    return <p className="text-[11.5px] text-neutral-400">Görsel eklenmezse varsayılan kampanya görseli kullanılır.</p>;
  }
  if (failed) {
    return <p className="text-[11.5px] text-neutral-400">Görsel bulunamadı — public path&apos;i kontrol edin.</p>;
  }
  return (
    <div className="relative h-16 w-24 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
      <Image
        src={trimmed}
        alt="Kampanya görseli önizleme"
        fill
        sizes="96px"
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

type FormState = {
  title: string;
  description: string;
  image: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  ctaLabel: string;
  ctaHref: string;
  active: boolean;
  branchTarget: "all" | string[];
  priority: number;
};

function blankForm(nextPriority: number): FormState {
  const { date } = nowInIstanbul();
  const [y, m, d] = date.split("-").map(Number);
  const end = new Date(y, m - 1, d + 7);
  const endDate = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
  return {
    title: "",
    description: "",
    image: "",
    startDate: date,
    startTime: "09:00",
    endDate,
    endTime: "23:59",
    ctaLabel: "İncele",
    ctaHref: "",
    active: true,
    branchTarget: "all",
    priority: nextPriority,
  };
}

function formFromCampaign(c: Campaign): FormState {
  return {
    title: c.title,
    description: c.description,
    image: c.image,
    startDate: istanbulDateInputValue(c.startAt),
    startTime: istanbulTimeInputValue(c.startAt),
    endDate: istanbulDateInputValue(c.endAt),
    endTime: istanbulTimeInputValue(c.endAt),
    ctaLabel: c.ctaLabel,
    ctaHref: c.ctaHref,
    active: c.active,
    branchTarget: c.branchIds,
    priority: c.priority,
  };
}

function validateForm(f: FormState): string | null {
  if (!f.title.trim()) return "Başlık boş olamaz.";
  const start = istanbulDateTimeToISO(f.startDate, f.startTime);
  const end = istanbulDateTimeToISO(f.endDate, f.endTime);
  if (Date.parse(end) <= Date.parse(start)) return "Bitiş tarihi başlangıçtan sonra olmalı.";
  if (!Number.isFinite(f.priority)) return "Sıra sayısal olmalı.";
  if (f.branchTarget !== "all" && f.branchTarget.length === 0) return "En az bir şube seçin ya da Tüm Şubeler'i işaretleyin.";
  return null;
}

export function AdminCampaigns({
  initialCampaigns,
  canManage,
  branches,
}: {
  initialCampaigns: Campaign[];
  canManage: boolean;
  branches: Branch[];
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [editing, setEditing] = useState<Campaign | "new" | null>(null);
  const [form, setForm] = useState<FormState>(blankForm(1));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const now = new Date();
  const branchName = (id: string) => branches.find((b) => b.id === id)?.name.replace("Funda 1959 ", "") ?? id;

  const openNew = () => {
    const nextPriority = campaigns.length > 0 ? Math.max(...campaigns.map((c) => c.priority)) + 1 : 1;
    setForm(blankForm(nextPriority));
    setFormError(null);
    setEditing("new");
  };
  const openEdit = (c: Campaign) => {
    setForm(formFromCampaign(c));
    setFormError(null);
    setEditing(c);
  };
  const close = () => {
    setEditing(null);
    setFormError(null);
  };

  const submit = async () => {
    const err = validateForm(form);
    if (err) {
      setFormError(err);
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload: { id?: string } & NewCampaignInput = {
      ...(editing !== "new" && editing ? { id: editing.id } : {}),
      title: form.title.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      startAt: istanbulDateTimeToISO(form.startDate, form.startTime),
      endAt: istanbulDateTimeToISO(form.endDate, form.endTime),
      ctaLabel: form.ctaLabel.trim(),
      ctaHref: form.ctaHref.trim(),
      active: form.active,
      branchIds: form.branchTarget,
      priority: Number(form.priority),
    };
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: editing === "new" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; campaigns?: Campaign[]; error?: string };
      if (res.ok && data.ok && data.campaigns) {
        setCampaigns(data.campaigns);
        setFeedback({ tone: "ok", text: editing === "new" ? "Kampanya oluşturuldu." : "Kampanya güncellendi." });
        close();
      } else {
        setFormError(data.error ?? "Kaydedilemedi.");
      }
    } catch {
      setFormError("Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Bu kampanyayı silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/admin/campaigns?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { ok?: boolean; campaigns?: Campaign[]; error?: string };
      if (res.ok && data.ok && data.campaigns) {
        setCampaigns(data.campaigns);
        setFeedback({ tone: "ok", text: "Kampanya silindi." });
      } else {
        setFeedback({ tone: "err", text: data.error ?? "Silinemedi." });
      }
    } catch {
      setFeedback({ tone: "err", text: "Silinemedi." });
    }
  };

  const toggleBranch = (id: string) => {
    setForm((f) => {
      const current = f.branchTarget === "all" ? [] : f.branchTarget;
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      return { ...f, branchTarget: next };
    });
  };

  const inputClass =
    "h-9 w-full rounded border border-neutral-300 bg-white px-2.5 text-[13px] text-neutral-900 focus:border-neutral-900 focus:outline-none";
  const labelClass = "mb-1 block text-[11.5px] font-semibold uppercase tracking-[0.04em] text-neutral-500";

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        {feedback ? (
          <span
            role="status"
            className={`text-[12.5px] font-medium ${feedback.tone === "err" ? "text-neutral-900 underline" : "text-neutral-500"}`}
          >
            {feedback.text}
          </span>
        ) : (
          <span />
        )}
        {canManage && (
          <button
            type="button"
            onClick={openNew}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-neutral-700"
          >
            + Yeni Kampanya
          </button>
        )}
      </div>

      <Panel>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Kampanya</Th>
                <Th>Süre</Th>
                <Th>Şube</Th>
                <Th>Durum</Th>
                <Th align="right">Sıra</Th>
                <Th>İşlem</Th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 && <EmptyRow cols={6}>Henüz kampanya yok.</EmptyRow>}
              {campaigns.map((c) => {
                const status = getCampaignStatus(c, now);
                return (
                  <Row key={c.id}>
                    <Td className="font-medium">{c.title}</Td>
                    <Td>{formatRange(c.startAt, c.endAt)}</Td>
                    <Td>{c.branchIds === "all" ? "Tüm Şubeler" : c.branchIds.map(branchName).join(", ")}</Td>
                    <Td>
                      <Badge strong={status === "ACTIVE"}>{CAMPAIGN_STATUS_LABEL_TR[status]}</Badge>
                    </Td>
                    <Td align="right" className="tabular-nums">{c.priority}</Td>
                    <Td>
                      {canManage ? (
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => openEdit(c)} className="text-[12.5px] font-semibold text-neutral-700 underline hover:text-neutral-900">
                            Düzenle
                          </button>
                          <button type="button" onClick={() => remove(c.id)} className="text-[12.5px] font-semibold text-neutral-400 underline hover:text-neutral-900">
                            Sil
                          </button>
                        </div>
                      ) : (
                        <span className="text-[12px] text-neutral-400">—</span>
                      )}
                    </Td>
                  </Row>
                );
              })}
            </tbody>
          </Table>
        </TableWrap>
      </Panel>

      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" role="dialog" aria-modal="true">
          <div className="h-full w-full max-w-md overflow-y-auto border-l border-neutral-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-neutral-900">
                {editing === "new" ? "Yeni Kampanya" : "Kampanyayı Düzenle"}
              </h2>
              <button type="button" onClick={close} aria-label="Kapat" className="text-neutral-400 hover:text-neutral-900">
                ✕
              </button>
            </div>

            {formError && (
              <p role="alert" className="mb-3 rounded border border-neutral-300 bg-neutral-50 px-3 py-2 text-[12.5px] text-neutral-900">
                {formError}
              </p>
            )}

            <div className="space-y-3.5">
              <div>
                <label className={labelClass}>Başlık</label>
                <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Kısa Açıklama</label>
                <textarea
                  className={`${inputClass} h-auto py-2`}
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Görsel</label>
                <input
                  className={inputClass}
                  placeholder="/home/campaigns/funda-puan.webp"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                />
                <div className="mt-2">
                  <CampaignImagePreview key={form.image.trim()} src={form.image} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Başlangıç Tarihi</label>
                  <input type="date" className={inputClass} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Başlangıç Saati</label>
                  <input type="time" className={inputClass} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Bitiş Tarihi</label>
                  <input type="date" className={inputClass} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Bitiş Saati</label>
                  <input type="time" className={inputClass} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>CTA Metni</label>
                  <input className={inputClass} value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>CTA Linki</label>
                  <input
                    className={inputClass}
                    placeholder="/lezzetlerimiz"
                    value={form.ctaHref}
                    onChange={(e) => setForm({ ...form, ctaHref: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Şube Hedefi</label>
                <label className="flex items-center gap-2 py-1 text-[13px] text-neutral-800">
                  <input
                    type="checkbox"
                    checked={form.branchTarget === "all"}
                    onChange={(e) => setForm({ ...form, branchTarget: e.target.checked ? "all" : [] })}
                  />
                  Tüm Şubeler
                </label>
                {form.branchTarget !== "all" && (
                  <div className="ml-1 mt-1 space-y-1 border-l border-neutral-200 pl-3">
                    {branches.map((b) => (
                      <label key={b.id} className="flex items-center gap-2 text-[13px] text-neutral-700">
                        <input
                          type="checkbox"
                          checked={form.branchTarget !== "all" && form.branchTarget.includes(b.id)}
                          onChange={() => toggleBranch(b.id)}
                        />
                        {b.name.replace("Funda 1959 ", "")}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Gösterim Sırası</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: Math.floor(Number(e.target.value) || 0) })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Durum</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, active: !form.active })}
                    aria-pressed={form.active}
                    className={`h-9 w-full rounded border px-2.5 text-[13px] font-medium ${
                      form.active ? "border-neutral-900 text-neutral-900" : "border-neutral-300 text-neutral-400"
                    }`}
                  >
                    {form.active ? "Aktif" : "Pasif"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button type="button" onClick={close} className="rounded-md border border-neutral-300 px-3 py-1.5 text-[12.5px] font-semibold text-neutral-700 hover:bg-neutral-50">
                Vazgeç
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="rounded-md bg-neutral-900 px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-neutral-700 disabled:bg-neutral-300"
              >
                {saving ? "Kaydediliyor…" : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
